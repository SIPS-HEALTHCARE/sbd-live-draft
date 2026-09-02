-- 20260807120000_t91_review_observations_assessor_facility_scope.sql
-- T91 review follow-up (2026-08-07), and T74 step N for one table: public.observations.
--
-- WHAT THE REVIEW FOUND. Two holes in the observation policies, both older than T91, both
-- made worse by it now that every item carries the observer's own written words:
--
--   1. obs_update_scoped / obs_insert_scoped call the ZERO-ARG public.sbd_is_assessor().
--      That answers "an assessor anywhere", so any granted assessor could write an
--      observation in ANY facility. The facility-aware overload sbd_is_assessor(uuid)
--      has existed since 20260730060000 (T74) and was never adopted here.
--
--   2. obs_select_scoped has no assessor branch at all — it is staff_id = auth.uid() OR
--      sbd_obs_facility_scope(fid), and that helper keys on role
--      (master/admin/system_admin, staff_admin, facility_admin/hospital), not on the
--      assessor capability. So a capability-granted assessor who is not also one of those
--      roles could WRITE a record they could not READ BACK. With T91 that means typing or
--      dictating the evidence for every item and then not being able to see it, and the
--      reviewer's evidence block reading fine while the author's list is empty. Two of the
--      three current grant holders are exactly this shape (staff_member + assessor
--      capability), per the T74 audit.
--
-- WHAT THIS CHANGES.
--   * Both write policies keep the #50/#54 lockdown intent — master admin, plus explicitly
--     granted assessors, and nobody else — but the assessor half is now asked AT the row's
--     facility instead of globally.
--   * SELECT gains the same assessor branch, so an assessor reads exactly the set they may
--     write. Read never exceeds write on this table.
--
-- NO READ PATH CAN LOSE ROWS. The new obs_select_scoped is the old one plus one OR branch —
-- both original branches are restated verbatim — so it is a strict superset for every
-- caller. The only GET against this table is the login-time
-- GET /rest/v1/observations?select=* in auth-init.js (SB.getObservations), flat, no embeds,
-- and no SQL view in this schema reads observations, so there is nothing else to widen.
--
-- RUNTIME EFFECT TODAY, stated plainly rather than assumed. sbd_is_assessor(uuid) treats an
-- absent or empty capabilities.assessor_facilities list as system wide (T74's
-- backward-compatibility clause, so no existing holder silently loses reach). None of the
-- three current holders has a list. So:
--   - Writes: no change in reach for anyone. Reach narrows only when an admin actually picks
--     facilities in Role Management, which the UI already supports
--     (rmAddAssessorFacility / rmRemoveAssessorFacility).
--   - Reads: the two capability-only holders gain read of observations they could already
--     write. That is a smaller grant than the one they hold, and it is what makes the T91
--     evidence readable by its author. The way to actually scope both is to set
--     assessor_facilities for those two accounts; this migration is what makes that setting
--     bite on this table.
--
-- SCOPE. observations only, the table T91 touched. observation_remediations,
-- observation_audits, observation_overrides and sbd_assessment_queue still call the zero-arg
-- gate and are the remaining T74 steps; they are deliberately left for their own migrations
-- so each can be reverted alone, which is the whole point of T74's one-table-at-a-time plan.
-- None of them is written by the frontend today (no api-supabase.js path touches them).
--
-- No column grants are touched. Row policies only — a per-column grant on this family is
-- what took the staff list down on 2026-07-30 (T37).
--
-- Revert: re-run the policy bodies from 20260723140000 (writes) and 20260703233921 (select).

begin;

-- DROP POLICY takes ACCESS EXCLUSIVE on public.observations, which blocks the login-time
-- GET /rest/v1/observations for as long as this transaction runs. It is six statements, so
-- milliseconds — but if some long read is holding the table, fail fast instead of queueing
-- every reader behind us. Re-running the file is safe: it is one transaction.
set local lock_timeout = '3s';

-- SELECT: candidate's own rows, role-based facility scope, or an assessor AT this facility.
drop policy if exists obs_select_scoped on public.observations;
create policy obs_select_scoped on public.observations
  for select to authenticated
  using (
    staff_id = auth.uid()
    or public.sbd_obs_facility_scope(fid)
    or public.sbd_is_assessor(fid)
  );

-- INSERT: candidate self-request preserved; otherwise master admin, or an assessor AT this
-- facility (was: an assessor anywhere).
drop policy if exists obs_insert_scoped on public.observations;
create policy obs_insert_scoped on public.observations
  for insert to authenticated
  with check (
    staff_id = auth.uid()
    or public.sbd_is_master_admin()
    or public.sbd_is_assessor(fid)
  );

-- UPDATE: master admin, or an assessor AT this facility (was: an assessor anywhere).
-- No self-branch: a candidate must never edit an assessment of themselves.
drop policy if exists obs_update_scoped on public.observations;
create policy obs_update_scoped on public.observations
  for update to authenticated
  using      ( public.sbd_is_master_admin() or public.sbd_is_assessor(fid) )
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor(fid) );

commit;
