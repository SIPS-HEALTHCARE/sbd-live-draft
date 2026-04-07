/* Run in project SQL editor -- Dashboard > SQL Editor

-- FACILITIES
create table public.facilities (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  loc            text not null,
  dept           text not null,
  contact        text not null,
  email          text not null unique,
  since          text,
  active         boolean default true,
  system_id      uuid references public.hospital_systems(id) on delete set null,
  deactivated_at timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table public.facilities enable row level security;
create policy "facilities_master_all" on public.facilities for all
  to authenticated
  using (auth.jwt()->>'role' = 'master_admin')
  with check (auth.jwt()->>'role' = 'master_admin');
create policy "facilities_staff_admin_select" on public.facilities for select
  to authenticated
  using (
    auth.jwt()->>'role' = 'staff_admin' and
    id = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  );
create policy "facilities_hospital_select" on public.facilities for select
  to authenticated
  using (id = (auth.jwt()->>'facility_id')::uuid);
create policy "facilities_system_admin_select" on public.facilities for select
  to authenticated
  using (
    auth.jwt()->>'role' = 'system_admin' and
    system_id = (auth.jwt()->>'system_id')::uuid
  );

-- USER PROFILES
create table public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  role          text not null check (role in ('master_admin','staff_admin','hospital','facility_admin','system_admin','staff_member')),
  fid           uuid references public.facilities(id) on delete set null,
  system_id     uuid,
  assigned_fids uuid[] default '{}',
  active        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.user_profiles enable row level security;
create policy "profiles_master_all" on public.user_profiles for all
  to authenticated
  using (auth.jwt()->>'role' = 'master_admin')
  with check (auth.jwt()->>'role' = 'master_admin');
create policy "profiles_self_select" on public.user_profiles for select
  to authenticated
  using (id = auth.uid());
create policy "profiles_staff_admin_select" on public.user_profiles for select
  to authenticated
  using (auth.jwt()->>'role' = 'staff_admin');

-- STAFF
create table public.staff (
  id          uuid primary key default gen_random_uuid(),
  fid         uuid references public.facilities(id) on delete cascade,
  first       text not null,
  last        text not null,
  role        text not null,
  belt        text not null check (belt in ('White','Yellow','Green','Blue','Brown','Black')),
  since       date,
  stars       int default 0,
  cur_comp    text check (cur_comp in ('pass','fail') or cur_comp is null),
  cur_sim     text check (cur_sim in ('pass','fail') or cur_sim is null),
  cur_obs     text check (cur_obs in ('pass','fail') or cur_obs is null),
  nxt_comp    text check (nxt_comp in ('pass','fail') or nxt_comp is null),
  nxt_sim     text check (nxt_sim in ('pass','fail') or nxt_sim is null),
  nxt_obs     text check (nxt_obs in ('pass','fail') or nxt_obs is null),
  ps_enrolled boolean default false,
  ps_done     boolean default false,
  ps_track    text,
  ps_mod      text,
  ps_tracks   jsonb default '{}',
  promo       boolean default false,
  history     jsonb default '[]',
  oip         jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.staff enable row level security;
create policy "staff_master_all" on public.staff for all
  to authenticated
  using (auth.jwt()->>'role' = 'master_admin')
  with check (auth.jwt()->>'role' = 'master_admin');
create policy "staff_staff_admin_select" on public.staff for select
  to authenticated
  using (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  );
create policy "staff_staff_admin_write" on public.staff for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  )
  with check (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  );
create policy "staff_hospital_select" on public.staff for select
  to authenticated
  using (fid = (auth.jwt()->>'facility_id')::uuid);
create policy "staff_facility_admin_all" on public.staff for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  )
  with check (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  );
create policy "staff_system_admin_select" on public.staff for select
  to authenticated
  using (
    auth.jwt()->>'role' = 'system_admin' and
    fid in (select id from public.facilities where system_id = (auth.jwt()->>'system_id')::uuid)
  );
create policy "staff_member_self" on public.staff for select
  to authenticated
  using (id = (auth.jwt()->>'staff_id')::uuid);

-- ASSESSMENT HISTORY
create table public.assessment_history (
  id              uuid primary key default gen_random_uuid(),
  staff_id        uuid references public.staff(id) on delete cascade,
  fid             uuid references public.facilities(id),
  assessment_type text not null check (assessment_type in ('Competency','Simulation','Observation')),
  target_belt     text not null check (target_belt in ('White','Yellow','Green','Blue','Brown','Black')),
  result          text not null check (result in ('pass','fail')),
  notes           text,
  assessed_by     uuid,
  assessed_at     timestamptz default now()
);
alter table public.assessment_history enable row level security;
create policy "ah_master_all" on public.assessment_history for all
  to authenticated
  using (auth.jwt()->>'role' = 'master_admin')
  with check (auth.jwt()->>'role' = 'master_admin');
create policy "ah_staff_admin_all" on public.assessment_history for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  )
  with check (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  );
create policy "ah_hospital_select" on public.assessment_history for select
  to authenticated
  using (fid = (auth.jwt()->>'facility_id')::uuid);
create policy "ah_facility_admin_all" on public.assessment_history for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  )
  with check (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  );
create policy "ah_member_self" on public.assessment_history for select
  to authenticated
  using (staff_id = (auth.jwt()->>'staff_id')::uuid);

-- ASSESSMENT QUEUE
create table public.assessment_queue (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid references public.staff(id) on delete cascade,
  fid          uuid references public.facilities(id),
  type         text not null check (type in ('Competency','Simulation','Observation')),
  target_belt  text not null check (target_belt in ('White','Yellow','Green','Blue','Brown','Black')),
  status       text not null default 'pending' check (status in ('pending','pass','fail','withdrawn')),
  requested_at timestamptz default now(),
  resolved_at  timestamptz,
  notes        text
);
alter table public.assessment_queue enable row level security;
create policy "aq_master_all" on public.assessment_queue for all
  to authenticated
  using (auth.jwt()->>'role' = 'master_admin')
  with check (auth.jwt()->>'role' = 'master_admin');
create policy "aq_staff_admin_all" on public.assessment_queue for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  )
  with check (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  );
create policy "aq_hospital_select" on public.assessment_queue for select
  to authenticated
  using (fid = (auth.jwt()->>'facility_id')::uuid);
create policy "aq_facility_admin_all" on public.assessment_queue for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  )
  with check (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  );
create policy "aq_member_self_insert" on public.assessment_queue for insert
  to authenticated
  with check (staff_id = (auth.jwt()->>'staff_id')::uuid);
create policy "aq_member_self_select" on public.assessment_queue for select
  to authenticated
  using (staff_id = (auth.jwt()->>'staff_id')::uuid);

-- SCHEDULE
create table public.schedule (
  id                uuid primary key default gen_random_uuid(),
  fid               uuid references public.facilities(id) on delete cascade,
  date              date not null,
  shift             text not null,
  assigned_staff    uuid[] default '{}',
  published_by      uuid,
  notes             text default '',
  zone_assignments  jsonb default '{}',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
alter table public.schedule enable row level security;
create policy "schedule_master_all" on public.schedule for all
  to authenticated
  using (auth.jwt()->>'role' = 'master_admin')
  with check (auth.jwt()->>'role' = 'master_admin');
create policy "schedule_staff_admin_all" on public.schedule for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  )
  with check (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  );
create policy "schedule_hospital_select" on public.schedule for select
  to authenticated
  using (fid = (auth.jwt()->>'facility_id')::uuid);
create policy "schedule_facility_admin_all" on public.schedule for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  )
  with check (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  );
create policy "schedule_member_self" on public.schedule for select
  to authenticated
  using (auth.uid() = any(assigned_staff));

-- ATTENDANCE
create table public.attendance (
  id           uuid primary key default gen_random_uuid(),
  fid          uuid references public.facilities(id) on delete cascade,
  date         date not null,
  shift        text not null,
  staff_id     uuid references public.staff(id) on delete cascade,
  status       text not null check (status in ('present','absent','late','coverage')),
  coverage_for uuid references public.staff(id),
  marked_by    uuid,
  points       int default 0,
  created_at   timestamptz default now()
);
alter table public.attendance enable row level security;
create policy "att_master_all" on public.attendance for all
  to authenticated
  using (auth.jwt()->>'role' = 'master_admin')
  with check (auth.jwt()->>'role' = 'master_admin');
create policy "att_staff_admin_all" on public.attendance for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  )
  with check (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  );
create policy "att_hospital_select" on public.attendance for select
  to authenticated
  using (fid = (auth.jwt()->>'facility_id')::uuid);
create policy "att_facility_admin_all" on public.attendance for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  )
  with check (
    auth.jwt()->>'role' = 'facility_admin' and
    fid = (auth.jwt()->>'facility_id')::uuid
  );
create policy "att_member_self" on public.attendance for select
  to authenticated
  using (staff_id = (auth.jwt()->>'staff_id')::uuid);

-- PROMOTION APPROVALS
create table public.promotion_approvals (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid references public.staff(id) on delete cascade,
  fid           uuid references public.facilities(id),
  current_role  text not null,
  proposed_role text not null,
  submitted_by  uuid,
  status        text not null default 'pending' check (status in ('pending','approved','denied')),
  reviewed_by   uuid,
  review_notes  text default '',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.promotion_approvals enable row level security;
create policy "pa_master_all" on public.promotion_approvals for all
  to authenticated
  using (auth.jwt()->>'role' = 'master_admin')
  with check (auth.jwt()->>'role' = 'master_admin');
create policy "pa_staff_admin_all" on public.promotion_approvals for all
  to authenticated
  using (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  )
  with check (
    auth.jwt()->>'role' = 'staff_admin' and
    fid = any((select assigned_fids from public.user_profiles where id = auth.uid()))
  );
create policy "pa_hospital_all" on public.promotion_approvals for all
  to authenticated
  using (fid = (auth.jwt()->>'facility_id')::uuid)
  with check (fid = (auth.jwt()->>'facility_id')::uuid);

-- FREE AGENTS
create table public.free_agents (
  id             uuid primary key default gen_random_uuid(),
