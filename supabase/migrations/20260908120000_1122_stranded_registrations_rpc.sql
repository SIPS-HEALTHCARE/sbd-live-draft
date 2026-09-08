-- #1122 (Shawn board 155): list approved registrations with no auth account behind them,
-- so the Registrations screen can show a "Re-issue link" control per row.
--
-- The frontend cannot see auth.users, and the stranded predicate already lives in
-- sbd_check_stranded_registrations() (board 142). This is the same predicate without the
-- 7-day / 10-minute window, returned to a master admin instead of queued as an alert.
-- SECURITY DEFINER runs as postgres and so bypasses every RLS policy, including the T33
-- sbd_mfa_gate, which is why the master-admin AND aal2 checks are inlined here.
--
-- last_reissued_at comes from the audit row sbd-approve-registration writes on each
-- re-issue (action = 'registration_link_reissued'); the client uses it to grey the
-- button inside the 10-minute cooldown. The server enforces the cooldown regardless.

create or replace function public.sbd_stranded_registrations()
returns table (
  id               uuid,
  name             text,
  email            text,
  facility         text,
  location         text,
  department       text,
  requested_role   text,
  requested_at     timestamptz,
  reviewed_at      timestamptz,
  last_reissued_at timestamptz
)
language sql stable security definer
set search_path = public
as $$
  select r.id, r.name, r.email, r.facility, r.location, r.department, r.requested_role,
         r.requested_at, r.reviewed_at,
         (select max(a.created_at) from public.sbd_account_audit a
           where a.action = 'registration_link_reissued'
             and a.detail->>'registration_id' = r.id::text) as last_reissued_at
  from public.registrations r
  where public.sbd_is_master_admin()
    and public.sbd_mfa_satisfied()
    and r.status = 'approved'
    and not exists (select 1 from auth.users u where lower(u.email) = lower(r.email))
  order by r.reviewed_at desc nulls last;
$$;

revoke all on function public.sbd_stranded_registrations() from public;
revoke all on function public.sbd_stranded_registrations() from anon;
grant execute on function public.sbd_stranded_registrations() to authenticated;

comment on function public.sbd_stranded_registrations() is
  '#1122: approved registrations with no auth.users row, for the master-admin Re-issue link control. Same predicate as sbd_check_stranded_registrations (board 142) without the time window. Returns nothing to anyone who is not an aal2 master admin.';
