-- 20260828120000_719_t74_assessor_scope_remaining_tables.sql
-- #719 (ledger T74), the remaining steps: adopt the facility-scoped assessor gate on the
-- four tables still calling the zero-arg sbd_is_assessor().
--
-- Verified against production 2026-08-28 before writing this file:
--   scoped already   observations (T91, 20260807120000), sbd_assessment_queue (T77+T79),
--                    staff SELECT (T79) — the "assessor half is live" the issue records.
--   still system wide, 10 policies on 4 tables (the T91 file names them as "the remaining
--   T74 steps"):
--     observation_remediations  orm_insert/update/delete_locked      fid          direct
--     observation_audits        oa_insert/update/delete_locked       observation  join
--     observation_overrides     oo_insert/update_master_assessor     staff_id     join
--     ps_completion_requests    pscr_select, pscr_update             facility_id  direct
--
-- RUNTIME EFFECT, measured against the live holders 2026-08-28, not assumed:
--   Avery Henderson (staff_admin, assessor, NO facility list) — system wide before and after;
--     the absent-list-means-system-wide clause (T74) covers them on every branch here.
--   Shan Harris, Amy Cooper, Kirti Chaudhary — each carries an assessor_facilities list that
--     already bites on observations/queue/staff but NOT on these four tables. After this
--     applies, their chosen scope bites here too: writes at a non-listed facility are refused
--     by RLS. That narrowing is the point of #719, done by the admin's existing choice in
--     Role Management rather than by this migration inventing one.
--   Reads: orm_select / oa_select gain the same scoped assessor branch, mirroring T91's fix
--     on observations — without it a capability-only assessor (Kirti is staff_member +
--     assessor) writes remediation/audit rows they cannot read back, the exact half-shipped
--     shape 20260730170000 and T91 both document. Read never exceeds write on either table.
--   oo_select is deliberately NOT widened: the #50/#54 ruling keeps override reads at
--     master + system_admin, and this file only scopes the writes that ruling allowed.
--
-- The two join tables get SECURITY DEFINER helpers (shape copied from sbd_leads_facility_of,
-- the proven staff_id-parameter reference) instead of inline EXISTS, so the answer does not
-- depend on the caller's RLS reach into staff/observations. A missing parent row yields
-- false: deny, not leak — same posture as sbd_is_assessor(null).
--
-- No column grants are touched (the 2026-07-30 outage rule). Row policies only.
--
-- ROLLBACK: re-run the policy bodies from 20260723140000 (orm_*, oa_*),
--   20260724140000 (oo_*), 20260725012717 (pscr_*), then
--   drop function if exists public.sbd_is_assessor_for_staff(uuid);
--   drop function if exists public.sbd_is_assessor_for_observation(uuid);

begin;

-- DROP POLICY takes ACCESS EXCLUSIVE; fail fast rather than queue readers behind us.
-- Re-running the file is safe: one transaction.
set local lock_timeout = '3s';

-- ── helpers ──────────────────────────────────────────────────────────────────

create or replace function public.sbd_is_assessor_for_staff(p_staff_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists(
    select 1 from staff st
    where st.id = p_staff_id
      and public.sbd_is_assessor(st.fid)
  );
$function$;

comment on function public.sbd_is_assessor_for_staff(uuid) is
  '#719/T74: is the caller an assessor at p_staff_id''s facility. For policies on tables that '
  'carry only a staff_id (observation_overrides). Missing staff row denies. Definer so the '
  'answer does not depend on the caller''s RLS reach into staff.';

create or replace function public.sbd_is_assessor_for_observation(p_observation_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists(
    select 1 from observations o
    where o.id = p_observation_id
      and public.sbd_is_assessor(o.fid)
  );
$function$;

comment on function public.sbd_is_assessor_for_observation(uuid) is
  '#719/T74: is the caller an assessor at the facility of observation p_observation_id. For '
  'policies on tables that carry only an observation_id (observation_audits). Missing parent '
  'denies.';

revoke all on function public.sbd_is_assessor_for_staff(uuid) from public;
revoke all on function public.sbd_is_assessor_for_staff(uuid) from anon;
grant execute on function public.sbd_is_assessor_for_staff(uuid) to authenticated;
grant execute on function public.sbd_is_assessor_for_staff(uuid) to service_role;

revoke all on function public.sbd_is_assessor_for_observation(uuid) from public;
revoke all on function public.sbd_is_assessor_for_observation(uuid) from anon;
grant execute on function public.sbd_is_assessor_for_observation(uuid) to authenticated;
grant execute on function public.sbd_is_assessor_for_observation(uuid) to service_role;

-- ── observation_remediations (fid direct) ────────────────────────────────────
-- Non-assessor branches copied verbatim from 20260723140000.

drop policy if exists orm_select_scoped on public.observation_remediations;
create policy orm_select_scoped on public.observation_remediations
  for select to authenticated
  using (
    staff_id = auth.uid()
    or public.sbd_obs_facility_scope(fid)
    or public.sbd_is_assessor(fid)
  );

drop policy if exists orm_insert_locked on public.observation_remediations;
create policy orm_insert_locked on public.observation_remediations
  for insert to authenticated
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor(fid) );

drop policy if exists orm_update_locked on public.observation_remediations;
create policy orm_update_locked on public.observation_remediations
  for update to authenticated
  using      ( public.sbd_is_master_admin() or public.sbd_is_assessor(fid) )
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor(fid) );

drop policy if exists orm_delete_locked on public.observation_remediations;
create policy orm_delete_locked on public.observation_remediations
  for delete to authenticated
  using ( public.sbd_is_master_admin() or public.sbd_is_assessor(fid) );

-- ── observation_audits (via parent observation) ──────────────────────────────

drop policy if exists oa_select_scoped on public.observation_audits;
create policy oa_select_scoped on public.observation_audits
  for select to authenticated
  using (
    exists (
      select 1 from public.observations o
      where o.id = observation_audits.observation_id
        and public.sbd_obs_facility_scope(o.fid)
    )
    or public.sbd_is_assessor_for_observation(observation_id)
  );

drop policy if exists oa_insert_locked on public.observation_audits;
create policy oa_insert_locked on public.observation_audits
  for insert to authenticated
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor_for_observation(observation_id) );

drop policy if exists oa_update_locked on public.observation_audits;
create policy oa_update_locked on public.observation_audits
  for update to authenticated
  using      ( public.sbd_is_master_admin() or public.sbd_is_assessor_for_observation(observation_id) )
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor_for_observation(observation_id) );

drop policy if exists oa_delete_locked on public.observation_audits;
create policy oa_delete_locked on public.observation_audits
  for delete to authenticated
  using ( public.sbd_is_master_admin() or public.sbd_is_assessor_for_observation(observation_id) );

-- ── observation_overrides (via staff row; SELECT and DELETE untouched) ───────

drop policy if exists oo_insert_master_assessor on public.observation_overrides;
create policy oo_insert_master_assessor on public.observation_overrides
  for insert to authenticated
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor_for_staff(staff_id) );

drop policy if exists oo_update_master_assessor on public.observation_overrides;
create policy oo_update_master_assessor on public.observation_overrides
  for update to authenticated
  using      ( public.sbd_is_master_admin() or public.sbd_is_assessor_for_staff(staff_id) )
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor_for_staff(staff_id) );

-- ── ps_completion_requests (facility_id direct) ──────────────────────────────
-- facility_id is set from the staff row by the only insert path (requestPSCompletion →
-- mapPSCompletionRequestToBackend) and every production row carries it, verified 2026-08-28.
-- A null would deny a SCOPED assessor (fail closed) and change nothing for anyone else.
-- Non-assessor branches copied verbatim from 20260725012717; pscr_insert untouched.

drop policy if exists pscr_select on public.ps_completion_requests;
create policy pscr_select on public.ps_completion_requests
  for select to authenticated
  using (
    staff_id = auth.uid()
    or public.sbd_is_master_admin()
    or public.sbd_is_assessor(facility_id)
    or public.sbd_leads_facility_of(staff_id)
  );

drop policy if exists pscr_update on public.ps_completion_requests;
create policy pscr_update on public.ps_completion_requests
  for update to authenticated
  using (
    public.sbd_is_master_admin()
    or public.sbd_is_assessor(facility_id)
    or public.sbd_leads_facility_of(staff_id)
  )
  with check (
    public.sbd_is_master_admin()
    or public.sbd_is_assessor(facility_id)
    or public.sbd_leads_facility_of(staff_id)
  );

commit;
