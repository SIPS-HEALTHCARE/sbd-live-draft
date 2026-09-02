-- 20260724140000_observation_overrides_write_lockdown_50_54.sql
-- #50/#54 follow-up: observation_overrides is the 4th table in the team
-- instruction (Obs-Write-Lockdown-50-54-TEAM-INSTRUCTION). Our 20260723140000
-- locked observations / observation_remediations / observation_audits but left
-- oo_master_system (ALL) in place, so system_admin could still write overrides.
-- Per the ruling, system_admin drops to READ-ONLY here too:
--   SELECT: master + system_admin visibility, as today.
--   INSERT/UPDATE: master-or-assessor (sbd_is_assessor = #73 capability).
--   DELETE: master-only (mirrors obs_delete_master).
-- observation_checklists stays untouched per the instruction (template content,
-- not in the flagged set — its system_admin write is flagged to Iggie separately).

drop policy if exists oo_master_system on public.observation_overrides;

create policy oo_select_master_system on public.observation_overrides
  for select to authenticated
  using (
    public.sbd_is_master_admin()
    or exists (select 1 from public.sbd_portal_users u
               where u.auth_uid = auth.uid() and u.role = 'system_admin')
  );

create policy oo_insert_master_assessor on public.observation_overrides
  for insert to authenticated
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor() );

create policy oo_update_master_assessor on public.observation_overrides
  for update to authenticated
  using      ( public.sbd_is_master_admin() or public.sbd_is_assessor() )
  with check ( public.sbd_is_master_admin() or public.sbd_is_assessor() );

create policy oo_delete_master on public.observation_overrides
  for delete to authenticated
  using ( public.sbd_is_master_admin() );
