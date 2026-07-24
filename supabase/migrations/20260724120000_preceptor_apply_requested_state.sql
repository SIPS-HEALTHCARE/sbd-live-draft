-- 20260724120000_preceptor_apply_requested_state.sql
-- Preceptor apply→approve flow (Ignacio 2026-07-23): add a 'requested' (application
-- pending) state + a requested_at timestamp, and let a candidate self-apply for their
-- OWN record only (default -> requested). Master-admin approval (-> granted) unchanged.

-- 1. Allow the new 'requested' state on the existing check constraint.
alter table public.preceptor_access drop constraint if exists preceptor_access_state_check;
alter table public.preceptor_access
  add constraint preceptor_access_state_check
  check (state in ('granted','revoked','default','requested'));

-- 2. Application timestamp.
alter table public.preceptor_access add column if not exists requested_at timestamptz;

-- 3. Candidate self-apply: a user may write their OWN row, and only to set state
--    'requested' from a 'default' row (or a fresh insert). Master admins and the SIPS
--    allowlist keep full write (grant/revoke/reset/approve).
drop policy if exists prc_access_write on public.preceptor_access;
create policy prc_access_write on public.preceptor_access
  for all to authenticated
  using (
    public.sbd_is_master_admin()
    or lower(coalesce(auth.jwt()->>'email','')) in
       ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
    or (staff_id = auth.uid() and state = 'default')
  )
  with check (
    public.sbd_is_master_admin()
    or lower(coalesce(auth.jwt()->>'email','')) in
       ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
    or (staff_id = auth.uid() and state = 'requested')
  );

-- 4. Cutover safety (one-time, idempotent): grant current active preceptor users
--    (anyone with an assignment or progress row) so they keep the access they had via
--    belt-default. Only touches no-row / 'default' users — never overrides a deliberate
--    'revoked' or an existing 'granted'/'requested'. New candidates still apply->approve.
insert into public.preceptor_access (staff_id, state, granted_by, reason, granted_at, updated_at)
select distinct a.staff_id, 'granted', 'system (apply-flow cutover)',
       'Auto-granted at apply-flow cutover to preserve existing preceptor access', now(), now()
from (
  select staff_id from public.preceptor_assignments
  union
  select staff_id from public.preceptor_progress
) a
left join public.preceptor_access pa on pa.staff_id = a.staff_id
where coalesce(pa.state,'default') = 'default'
on conflict (staff_id) do update
  set state='granted', granted_by=excluded.granted_by, reason=excluded.reason,
      granted_at=excluded.granted_at, updated_at=excluded.updated_at;
