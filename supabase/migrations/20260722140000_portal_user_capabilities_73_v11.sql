-- ============================================================================
-- #73 v1.1 — stackable, role-independent capabilities on portal users
-- ----------------------------------------------------------------------------
-- ADDITIVE. A capability triggers the SAME access branch the matching role already does, so a
-- granted user gets exactly the role's reach and nothing broader. Empty capabilities ({}) leave
-- every helper's result unchanged, so no non-granted user is affected. Master-admin-controlled.
--   shape: { "assessor": true (system-wide), "educator_facilities": ["<fid>", ...] }
-- ROLLBACK: restore the three helpers to their pre-#73 bodies and
--   alter table public.sbd_portal_users drop column if exists capabilities;
--   drop function if exists public.sbd_set_user_capabilities(uuid, jsonb);
-- ============================================================================

alter table public.sbd_portal_users
  add column if not exists capabilities jsonb not null default '{}'::jsonb;

comment on column public.sbd_portal_users.capabilities is
  'Role-independent stackable capabilities (#73). Shape: { "assessor": true (system-wide), '
  '"educator_facilities": ["<fid>", ...] }. Honored additively by sbd_is_assessor / '
  'sbd_leads_facility_of / sbd_fi_leader_scope. Master-admin controlled via sbd_set_user_capabilities.';

-- assessor capability: system-wide, mirrors the assessor role's reach
create or replace function public.sbd_is_assessor()
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  select exists(select 1 from sbd_portal_users p
                where p.auth_uid = auth.uid()
                  and (p.role = 'assessor' or coalesce((p.capabilities->>'assessor')::boolean, false)));
$function$;

-- educator capability: scoped to the granted facilities, mirrors the educator/leader role
create or replace function public.sbd_leads_facility_of(p_staff_id uuid)
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  select exists(
    select 1 from sbd_portal_users p join staff s on s.id = p_staff_id
    where p.auth_uid = auth.uid()
      and (
        ( p.role in ('educator','hospital','facility_admin')
          and ( s.fid::text = p.facility_id
                or (p.assigned_facility_ids is not null and s.fid::text = any(p.assigned_facility_ids)) ) )
        or
        ( p.capabilities ? 'educator_facilities'
          and s.fid::text in (select jsonb_array_elements_text(p.capabilities->'educator_facilities')) )
      ));
$function$;

-- combined F&I leader scope: every existing branch preserved, two capability branches added
create or replace function public.sbd_fi_leader_scope(target_staff uuid)
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  select
    exists (select 1 from public.sbd_portal_users u
            where u.auth_uid = auth.uid() and u.role in ('master_admin','admin'))
    or lower(coalesce(auth.jwt()->>'email','')) in
      ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
    or exists (
      select 1 from public.sbd_portal_users u, public.staff s
      where u.auth_uid = auth.uid() and u.role in ('staff_admin','assessor')
        and s.id = target_staff
        and ( coalesce(array_length(u.assigned_facility_ids, 1), 0) = 0
              or s.fid::text in (select x.fid::text from unnest(u.assigned_facility_ids) as x(fid)) )
    )
    or exists (
      select 1 from public.sbd_portal_users u, public.staff s
      where u.auth_uid = auth.uid() and u.role in ('facility_admin','hospital')
        and s.id = target_staff
        and u.facility_id::text = s.fid::text
    )
    -- #73 v1.1: assessor capability (system-wide, mirrors assessor role reach)
    or exists (
      select 1 from public.sbd_portal_users u
      where u.auth_uid = auth.uid()
        and coalesce((u.capabilities->>'assessor')::boolean, false)
    )
    -- #73 v1.1: facility-educator capability (only the granted facilities)
    or exists (
      select 1 from public.sbd_portal_users u, public.staff s
      where u.auth_uid = auth.uid() and s.id = target_staff
        and u.capabilities ? 'educator_facilities'
        and s.fid::text in (select jsonb_array_elements_text(u.capabilities->'educator_facilities'))
    );
$function$;

-- master-admin-only writer (SECURITY DEFINER RPC; no broad table-write RLS required)
create or replace function public.sbd_set_user_capabilities(p_staff_id uuid, p_caps jsonb)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.sbd_is_master_admin() then
    raise exception 'Only a master admin can change capabilities';
  end if;
  update public.sbd_portal_users
     set capabilities = coalesce(p_caps, '{}'::jsonb)
   where auth_uid = p_staff_id;
end;
$function$;

revoke all on function public.sbd_set_user_capabilities(uuid, jsonb) from public, anon;
grant execute on function public.sbd_set_user_capabilities(uuid, jsonb) to authenticated;
