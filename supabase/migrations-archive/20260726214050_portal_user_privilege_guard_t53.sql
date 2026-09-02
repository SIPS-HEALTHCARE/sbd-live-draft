-- T53: a signed-in user could promote themselves to master admin.
--
-- sbd_portal_users carries authenticated_update_own_profile:
--     FOR UPDATE USING (auth_uid = auth.uid()) WITH CHECK (auth_uid = auth.uid())
-- with no column restriction, and `authenticated` holds UPDATE on every column of the
-- table including role and capabilities. One statement against their own row was enough:
--
--     before: sbd_get_user_role() = staff_member
--     self-promote to master_admin: 1 row(s) updated
--     after:  sbd_get_user_role() = master_admin, sbd_is_master_admin() = t
--     placement_reviews visible 49, writable 49
--     self-grant assessor capability: sbd_is_assessor() = t
--
-- (Reproduced 2026-07-26 inside a transaction that was rolled back; no data changed.)
--
-- Every access rule on the platform reads sbd_get_user_role(), sbd_is_master_admin() or
-- sbd_is_assessor(), so this sat underneath all of them, including the observation write
-- lockdown and the placement_reviews scoping applied moments earlier.
--
-- Why a trigger and not a column grant:
-- A column-level REVOKE applies to the `authenticated` database role, which is every
-- signed-in user including master admins. That would also break the admin screen that
-- changes a person's portal access (ui-views.js writes {role} directly) and it cannot
-- distinguish an edge function from a candidate. RLS cannot express this either: an UPDATE
-- policy sees the old row in USING and the new row in WITH CHECK, but cannot compare the
-- two, and column immutability is exactly a comparison.
--
-- A BEFORE UPDATE trigger can compare old and new, so it allows the change only when the
-- caller is entitled to make it:
--   * nothing privileged changed          -> allow (ordinary profile self-edit)
--   * caller is a master admin            -> allow (Role Management, admin screens)
--   * caller is the service role, or has  -> allow (edge functions: registration approval,
--     no JWT at all (migrations, psql)             account activate/deactivate, claim sync)
--   * anyone else                         -> refuse
--
-- The self-service profile editor writes only name, initials and title, so it is unaffected.
-- Capability grants already go through sbd_set_user_capabilities, a SECURITY DEFINER
-- function that checks for master admin itself, so that path is unaffected too.

create or replace function public.sbd_guard_portal_user_privileges()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  jwt_role  text;
  privileged_change boolean;
begin
  privileged_change :=
       new.role                  is distinct from old.role
    or new.capabilities          is distinct from old.capabilities
    or new.facility_id           is distinct from old.facility_id
    or new.assigned_facility_ids is distinct from old.assigned_facility_ids
    or new.system_id             is distinct from old.system_id
    or new.active                is distinct from old.active
    or new.protected             is distinct from old.protected
    or new.auth_uid              is distinct from old.auth_uid
    or new.staff_id              is distinct from old.staff_id
    or new.email                 is distinct from old.email;

  if not privileged_change then
    return new;
  end if;

  jwt_role := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role';

  -- No JWT context means a migration, psql, or a direct admin connection.
  -- 'service_role' is how the edge functions reach the database.
  if jwt_role is null or jwt_role = 'service_role' then
    return new;
  end if;

  if public.sbd_is_master_admin() then
    return new;
  end if;

  raise exception
    'Only a master admin can change role, capabilities, facility assignment, account state or identity on a portal user'
    using errcode = '42501';
end $$;

drop trigger if exists sbd_portal_users_privilege_guard on public.sbd_portal_users;

create trigger sbd_portal_users_privilege_guard
before update on public.sbd_portal_users
for each row
execute function public.sbd_guard_portal_user_privileges();

comment on function public.sbd_guard_portal_user_privileges() is
  'T53: refuses changes to role, capabilities, facility assignment, account state or identity on sbd_portal_users unless the caller is a master admin, the service role, or has no JWT context. Ordinary profile self-edits (name, initials, title) are unaffected.';
