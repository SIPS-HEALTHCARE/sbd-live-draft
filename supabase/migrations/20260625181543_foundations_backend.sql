-- ============================================================
-- SBD Foundations backend (#23 tables + seed, #24 RLS/grants)
-- Additive. Per-staff Foundations assignments + 3-gate progress.
-- Module curriculum content ships in the app as a constant
-- (FOUNDATIONS_MODULES), so no module-content table is needed here.
-- Data shapes mirror the standalone code exactly:
--   assignment: {staffId, moduleId, assignedBy, type, trigger, assignedDate, status}
--   progress:   {staffId, moduleId, g1{}, g2{}, g3{}, complete}
-- staff_id == sbd_portal_users.auth_uid == auth.uid().
-- ============================================================

create table if not exists public.foundations_assignments (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null,
  module_id    text not null,
  assigned_by  uuid,
  type         text not null default 'remediation',
  trigger      text,
  assigned_date date not null default current_date,
  status       text not null default 'assigned',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (staff_id, module_id)
);

create table if not exists public.foundations_progress (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null,
  module_id  text not null,
  g1         jsonb not null default '{"status":"open","score":0,"attempts":[]}'::jsonb,
  g2         jsonb not null default '{"status":"open","score":0,"attempts":[]}'::jsonb,
  g3         jsonb not null default '{"status":"open","items":[]}'::jsonb,
  complete   boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (staff_id, module_id)
);

create index if not exists idx_foundations_assignments_staff on public.foundations_assignments(staff_id);
create index if not exists idx_foundations_progress_staff on public.foundations_progress(staff_id);

alter table public.foundations_assignments enable row level security;
alter table public.foundations_progress  enable row level security;

-- Privileged roles (educator/manager/assessor map to these on this platform).
-- Reads: any authenticated portal user (staff see their own; leaders see all).
create policy fnd_assign_select on public.foundations_assignments
  for select to authenticated using (true);
create policy fnd_prog_select on public.foundations_progress
  for select to authenticated using (true);

-- Assignments are created/managed only by leaders.
create policy fnd_assign_write on public.foundations_assignments
  for all to authenticated
  using (exists (select 1 from public.sbd_portal_users u
                 where u.auth_uid = auth.uid()
                   and u.role in ('master_admin','facility_admin','staff_admin','hospital')))
  with check (exists (select 1 from public.sbd_portal_users u
                 where u.auth_uid = auth.uid()
                   and u.role in ('master_admin','facility_admin','staff_admin','hospital')));

-- Progress: a staff member writes their own gate progress; leaders may also
-- write (e.g. Gate 3 educator confirmation on a candidate's record).
create policy fnd_prog_insert on public.foundations_progress
  for insert to authenticated
  with check (staff_id = auth.uid()
              or exists (select 1 from public.sbd_portal_users u
                         where u.auth_uid = auth.uid()
                           and u.role in ('master_admin','facility_admin','staff_admin','hospital')));
create policy fnd_prog_update on public.foundations_progress
  for update to authenticated
  using (staff_id = auth.uid()
         or exists (select 1 from public.sbd_portal_users u
                    where u.auth_uid = auth.uid()
                      and u.role in ('master_admin','facility_admin','staff_admin','hospital')))
  with check (staff_id = auth.uid()
         or exists (select 1 from public.sbd_portal_users u
                    where u.auth_uid = auth.uid()
                      and u.role in ('master_admin','facility_admin','staff_admin','hospital')));
