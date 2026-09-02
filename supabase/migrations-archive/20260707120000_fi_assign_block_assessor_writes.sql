-- 20260707120000_fi_assign_block_assessor_writes.sql
-- Task #55 / audit A1 — enforce "Assessor cannot assign" at the server (Phase 4).
-- Blocks staff_admin (Assessor) + plain staff from INSERT/UPDATE on the two F&I
-- assignment tables. Allows master_admin/admin, system_admin, and facility leaders
-- (educator/hospital/facility_admin, facility-scoped). SELECT + DELETE unchanged.
-- Additive/idempotent, transactional, no data change. Prefer a Supabase branch first.
begin;

-- Single source of truth for "who may create/modify an F&I assignment row".
create or replace function public.sbd_fi_can_manage_assignments(target_staff uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    -- master admins (portal role, plus SIPS email fallback for belt-and-suspenders)
    public.sbd_is_master_admin()
    or lower(coalesce(auth.jwt()->>'email','')) in
       ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
    -- system_admin: system-wide, unscoped (per decision) — NOTE: not sbd_is_system_admin(),
    -- which would re-admit staff_admin. Explicit role='system_admin' only.
    or exists (select 1 from public.sbd_portal_users u
               where u.auth_uid = auth.uid() and u.role = 'system_admin')
    -- facility leaders, scoped to the target staff's current facility
    or public.sbd_leads_facility_of(target_staff);
$$;

-- ── foundations_assignments ──
drop policy if exists fnd_assign_leader_insert on public.foundations_assignments;
drop policy if exists fnd_assign_leader_update on public.foundations_assignments;
drop policy if exists fnd_assign_insert        on public.foundations_assignments;
drop policy if exists fnd_assign_update        on public.foundations_assignments;

create policy fnd_assign_insert on public.foundations_assignments
  for insert to authenticated
  with check (public.sbd_fi_can_manage_assignments(staff_id));
create policy fnd_assign_update on public.foundations_assignments
  for update to authenticated
  using (public.sbd_fi_can_manage_assignments(staff_id))
  with check (public.sbd_fi_can_manage_assignments(staff_id));

-- ── instrument_assignments (mirror) ──
drop policy if exists inst_assign_leader_insert on public.instrument_assignments;
drop policy if exists inst_assign_leader_update on public.instrument_assignments;
drop policy if exists inst_assign_insert        on public.instrument_assignments;
drop policy if exists inst_assign_update        on public.instrument_assignments;

create policy inst_assign_insert on public.instrument_assignments
  for insert to authenticated
  with check (public.sbd_fi_can_manage_assignments(staff_id));
create policy inst_assign_update on public.instrument_assignments
  for update to authenticated
  using (public.sbd_fi_can_manage_assignments(staff_id))
  with check (public.sbd_fi_can_manage_assignments(staff_id));

commit;
