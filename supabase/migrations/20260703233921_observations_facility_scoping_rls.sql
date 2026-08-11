-- Facility-scope the observations table + sibling tables (PR#96 QA finding, 2026-07-03).
-- The Observations console showed a role/facility-scoped queue in the browser, but the
-- observations table RLS was wide open (obs_all_all USING true) — any authenticated user
-- could read/edit/delete every facility's records via the REST API. This mirrors the
-- Foundations/Instruments RLS model but keys on the observation's own fid, matching what
-- renderAObservations() filters on (o.fid). The sibling tables were open too, and their
-- "master" guards were dead (they checked user_profiles, which has 0 rows in prod;
-- identities live in sbd_portal_users) — closed here as defense-in-depth (all empty now).
begin;

-- 1. Facility-scope helper, keyed on fid. SECURITY DEFINER so it can read the lookup
--    tables under RLS. Tiers mirror sbd_fi_leader_scope():
--      master tier : master_admin/admin/system_admin + SIPS master emails -> ALL
--      assessor    : staff_admin, scoped by assigned_facility_ids; EMPTY/NULL = ALL
--      facility    : facility_admin/hospital -> own facility only
--    (No 'assessor' portal role exists in this system; "assessor" == staff_admin.)
create or replace function public.sbd_obs_facility_scope(target_fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.sbd_portal_users u
            where u.auth_uid = auth.uid()
              and u.role in ('master_admin','admin','system_admin'))
    or lower(coalesce(auth.jwt()->>'email','')) in
       ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
    or exists (
      select 1 from public.sbd_portal_users u
      where u.auth_uid = auth.uid() and u.role = 'staff_admin'
        and ( coalesce(array_length(u.assigned_facility_ids, 1), 0) = 0
              or target_fid::text in
                 (select x.fid::text from unnest(u.assigned_facility_ids) as x(fid)) )
    )
    or exists (
      select 1 from public.sbd_portal_users u
      where u.auth_uid = auth.uid() and u.role in ('facility_admin','hospital')
        and u.facility_id::text = target_fid::text
    );
$$;

grant execute on function public.sbd_obs_facility_scope(uuid) to authenticated, anon;

-- 2. observations — replace the wide-open policies with scoped ones.
drop policy if exists obs_all_all    on public.observations;
drop policy if exists obs_select_all on public.observations;

-- SELECT: leaders see their facilities; a candidate sees only their own rows.
create policy obs_select_scoped on public.observations
  for select to authenticated
  using ( staff_id = auth.uid() or public.sbd_obs_facility_scope(fid) );

-- INSERT: a candidate may request their own; leaders may create within scope.
create policy obs_insert_scoped on public.observations
  for insert to authenticated
  with check ( staff_id = auth.uid() or public.sbd_obs_facility_scope(fid) );

-- UPDATE: leaders/observers within facility scope ONLY (no self-branch — a candidate
--         must not edit an assessment of themselves; all post-request writes are admin-session).
create policy obs_update_scoped on public.observations
  for update to authenticated
  using ( public.sbd_obs_facility_scope(fid) )
  with check ( public.sbd_obs_facility_scope(fid) );

-- DELETE: master admins only (mirrors fnd_assign_delete).
create policy obs_delete_master on public.observations
  for delete to authenticated
  using ( public.sbd_is_master_admin() );

-- 3. Sibling tables (all empty in prod today; master guards were dead against user_profiles).

-- remediations carry fid -> scope directly with the same helper (+ candidate self-read).
drop policy if exists orm_all_all    on public.observation_remediations;
drop policy if exists orm_master_all on public.observation_remediations;
create policy orm_scoped on public.observation_remediations
  for all to authenticated
  using ( staff_id = auth.uid() or public.sbd_obs_facility_scope(fid) )
  with check ( public.sbd_obs_facility_scope(fid) );

-- audits carry observation_id -> scope via the parent observation's fid.
drop policy if exists oa_all_all    on public.observation_audits;
drop policy if exists oa_master_all on public.observation_audits;
create policy oa_scoped on public.observation_audits
  for all to authenticated
  using ( exists (select 1 from public.observations o
                  where o.id = observation_id and public.sbd_obs_facility_scope(o.fid)) )
  with check ( exists (select 1 from public.observations o
                       where o.id = observation_id and public.sbd_obs_facility_scope(o.fid)) );

-- overrides = assessor-authority grants (governance). Default: master/system only.
drop policy if exists oo_all_all    on public.observation_overrides;
drop policy if exists oo_master_all on public.observation_overrides;
create policy oo_master_system on public.observation_overrides
  for all to authenticated
  using ( exists (select 1 from public.sbd_portal_users u
                  where u.auth_uid = auth.uid() and u.role in ('master_admin','system_admin')) )
  with check ( exists (select 1 from public.sbd_portal_users u
                       where u.auth_uid = auth.uid() and u.role in ('master_admin','system_admin')) );

-- checklists = global templates: keep the existing global read (oc_authenticated_select),
-- restrict writes to master/system only.
drop policy if exists oc_all_all    on public.observation_checklists;
drop policy if exists oc_master_all on public.observation_checklists;
create policy oc_write_master on public.observation_checklists
  for all to authenticated
  using ( exists (select 1 from public.sbd_portal_users u
                  where u.auth_uid = auth.uid() and u.role in ('master_admin','system_admin')) )
  with check ( exists (select 1 from public.sbd_portal_users u
                       where u.auth_uid = auth.uid() and u.role in ('master_admin','system_admin')) );

commit;
