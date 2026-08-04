-- SBD Instruments backend (mirror of Foundations). Additive.
-- Per-staff instrument-mastery assignments + 3-gate progress. Applied to prod.
create table if not exists public.instrument_assignments (
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
create table if not exists public.instrument_progress (
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
create index if not exists idx_instrument_assignments_staff on public.instrument_assignments(staff_id);
create index if not exists idx_instrument_progress_staff on public.instrument_progress(staff_id);

alter table public.instrument_assignments enable row level security;
alter table public.instrument_progress  enable row level security;

create policy inst_assign_select on public.instrument_assignments
  for select to authenticated
  using (staff_id = auth.uid() or assigned_by = auth.uid()
         or exists (select 1 from public.sbd_portal_users u where u.auth_uid = auth.uid()
                    and u.role in ('master_admin','facility_admin','staff_admin','hospital')));
create policy inst_prog_select on public.instrument_progress
  for select to authenticated
  using (staff_id = auth.uid()
         or exists (select 1 from public.sbd_portal_users u where u.auth_uid = auth.uid()
                    and u.role in ('master_admin','facility_admin','staff_admin','hospital')));
create policy inst_assign_write on public.instrument_assignments
  for all to authenticated
  using (exists (select 1 from public.sbd_portal_users u where u.auth_uid = auth.uid()
                 and u.role in ('master_admin','facility_admin','staff_admin','hospital')))
  with check (exists (select 1 from public.sbd_portal_users u where u.auth_uid = auth.uid()
                 and u.role in ('master_admin','facility_admin','staff_admin','hospital')));
create policy inst_prog_insert on public.instrument_progress
  for insert to authenticated
  with check (staff_id = auth.uid()
              or exists (select 1 from public.sbd_portal_users u where u.auth_uid = auth.uid()
                         and u.role in ('master_admin','facility_admin','staff_admin','hospital')));
create policy inst_prog_update on public.instrument_progress
  for update to authenticated
  using (staff_id = auth.uid()
         or exists (select 1 from public.sbd_portal_users u where u.auth_uid = auth.uid()
                    and u.role in ('master_admin','facility_admin','staff_admin','hospital')))
  with check (staff_id = auth.uid()
         or exists (select 1 from public.sbd_portal_users u where u.auth_uid = auth.uid()
                    and u.role in ('master_admin','facility_admin','staff_admin','hospital')));
