-- 20260723140000_observation_write_lockdown_50_54.sql
-- #50/#54: Observation-record write lockdown (Ignacio's ruling, 2026-07-23).
--
-- Editing observation (assessment) records is MASTER ADMIN ONLY for now, plus
-- anyone explicitly granted the Assessor capability via the Role Management tab
-- (public.sbd_is_assessor() -> role='assessor' OR capabilities.assessor). The
-- oversight roles (hospital / system_admin / facility_admin) drop to READ-ONLY.
-- Candidate self-request rows are preserved (staff_id = auth.uid() on INSERT).
-- READS are untouched everywhere, so oversight roles can still view.
--
-- NOTE (operational): no user currently holds role='assessor' or the assessor
-- capability, and the existing "Assessor" users are role='staff_admin' -- which
-- sbd_is_assessor() does NOT match. So after this applies, ONLY master_admins can
-- write until each assessor is granted the Assessor capability in Role Management.
-- This is per the client's "only master admin for now" ruling.
--
-- Scope: observations, observation_remediations, observation_audits (the tables
-- flagged in the write review). observation_overrides and observation_checklists
-- are unchanged (already restricted to master/system roles).

-- ── observations ─────────────────────────────────────────────────────────────
-- SELECT (obs_select_scoped) and DELETE (obs_delete_master) unchanged.
drop policy if exists obs_insert_scoped on public.observations;
create policy obs_insert_scoped on public.observations
  for insert to authenticated
  with check (
    staff_id = auth.uid()               -- candidate self-request preserved
    or public.sbd_is_master_admin()
    or public.sbd_is_assessor()
  );

drop policy if exists obs_update_scoped on public.observations;
create policy obs_update_scoped on public.observations
  for update to authenticated
  using      ( public.sbd_is_master_admin() or public.sbd_is_assessor() )
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor() );

-- ── observation_remediations ─────────────────────────────────────────────────
-- Was ALL-scoped (read + write via facility scope). Split: reads stay scoped so
-- oversight can view; writes lock to master / assessor.
drop policy if exists orm_scoped on public.observation_remediations;

create policy orm_select_scoped on public.observation_remediations
  for select to authenticated
  using ( staff_id = auth.uid() or public.sbd_obs_facility_scope(fid) );

create policy orm_insert_locked on public.observation_remediations
  for insert to authenticated
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor() );

create policy orm_update_locked on public.observation_remediations
  for update to authenticated
  using      ( public.sbd_is_master_admin() or public.sbd_is_assessor() )
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor() );

create policy orm_delete_locked on public.observation_remediations
  for delete to authenticated
  using ( public.sbd_is_master_admin() or public.sbd_is_assessor() );

-- ── observation_audits ───────────────────────────────────────────────────────
-- Was ALL-scoped via the parent observation's facility. Split the same way.
drop policy if exists oa_scoped on public.observation_audits;

create policy oa_select_scoped on public.observation_audits
  for select to authenticated
  using (
    exists (
      select 1 from public.observations o
      where o.id = observation_audits.observation_id
        and public.sbd_obs_facility_scope(o.fid)
    )
  );

create policy oa_insert_locked on public.observation_audits
  for insert to authenticated
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor() );

create policy oa_update_locked on public.observation_audits
  for update to authenticated
  using      ( public.sbd_is_master_admin() or public.sbd_is_assessor() )
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor() );

create policy oa_delete_locked on public.observation_audits
  for delete to authenticated
  using ( public.sbd_is_master_admin() or public.sbd_is_assessor() );
