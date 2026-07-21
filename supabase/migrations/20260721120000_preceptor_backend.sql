-- ============================================================================
-- SBD Preceptor Certification backend (#78 Phase 1 — content + scored gates)
-- Spec: docs/decisions/2026-07-21-preceptor-certification-ph1.md
--       (Dr. Jake "Developer Build Synopsis and Access-Control Specification")
-- ----------------------------------------------------------------------------
-- ADDITIVE + idempotent + transactional. A fourth curriculum on the Foundations
-- rails: its own namespaced tables, the SAME 3-gate progress shape, and the
-- SAME scoped RLS helper (sbd_fi_leader_scope) already used by F&I — no new
-- engine, no new permission model.
--
-- WHAT THIS ADDS
--   1. preceptor_modules  — read-only reference (15 modules, continuous numbering
--      1..15, dual level labels, per-level climbing gate thresholds). SELECT to
--      all authenticated. Rich content (reader/knowledge check/sims/observation)
--      ships in the app constant PRECEPTOR_MODULES (preceptor.js), same as
--      FOUNDATIONS_MODULES; this table is the seed/reference for assignment FK,
--      dashboards, and thresholds.
--   2. preceptor_assignments / preceptor_progress — EXACT Foundations shape
--      (g1/g2/g3 jsonb, one row per (staff, module), facility_id audit denorm).
--   3. Scoped RLS reusing sbd_fi_leader_scope(target_staff): own = auth.uid(),
--      leader = master/assessor(system) or facility_admin/hospital(own facility).
--      NOT the wide-open using(true) base — least-privilege from the start
--      (§3.0 security-audit-grade; #50 "scoping is server-side, not the UI").
--
-- OUT OF SCOPE (later phases, do NOT add here):
--   - Phase 2: assignment UI wiring + remediation mapping + dashboard rollups.
--   - Phase 3: preceptor_access master-admin toggle; L2/L3 prerequisite gating;
--     Gate-3 qualified-confirmer enforcement. (Phase 1 uses the existing
--     confirm-by-name-and-date flow; confirmer-standing check comes in Phase 3.)
--
-- ROLLBACK (inverse): drop the 3 tables (they are unread by any other surface),
--   which removes all policies/indexes with them; helpers are shared and stay.
--     drop table if exists public.preceptor_progress, public.preceptor_assignments,
--       public.preceptor_modules cascade;
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. preceptor_modules — read-only reference (seeded below)
-- ----------------------------------------------------------------------------
create table if not exists public.preceptor_modules (
  id            text primary key,          -- 'P01'..'P15' (continuous 1..15)
  seq           int  not null,             -- absolute order 1..15
  level         int  not null,             -- 1 Facilitator | 2 Advanced | 3 Master
  level_label   text not null,             -- 'Level 1 Facilitator', ...
  level_pos     text not null,             -- '1 of 6', '2 of 4', ...
  title         text not null,
  focus         text,
  k_threshold   int  not null,             -- Gate 1 knowledge pass %
  s_threshold   int  not null,             -- Gate 2 simulation pass %
  o_threshold   int  not null,             -- Gate 3 observation/practicum pass %
  content_pending boolean not null default false,  -- true = reader not yet encoded (M7)
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. assignments + progress — EXACT Foundations shape (mirror of
--    foundations_assignments / foundations_progress)
-- ----------------------------------------------------------------------------
create table if not exists public.preceptor_assignments (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null,
  module_id    text not null,
  assigned_by  uuid,
  type         text not null default 'certification',
  trigger      text,
  assigned_date date not null default current_date,
  status       text not null default 'assigned',
  facility_id  uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (staff_id, module_id)
);

create table if not exists public.preceptor_progress (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null,
  module_id  text not null,
  g1         jsonb not null default '{"status":"open","score":0,"attempts":[]}'::jsonb,
  g2         jsonb not null default '{"status":"open","score":0,"attempts":[]}'::jsonb,
  g3         jsonb not null default '{"status":"open","items":[]}'::jsonb,
  complete   boolean not null default false,
  facility_id uuid,
  updated_at timestamptz not null default now(),
  unique (staff_id, module_id)
);

create index if not exists idx_preceptor_assignments_staff    on public.preceptor_assignments(staff_id);
create index if not exists idx_preceptor_assignments_facility on public.preceptor_assignments(facility_id);
create index if not exists idx_preceptor_progress_staff       on public.preceptor_progress(staff_id);
create index if not exists idx_preceptor_progress_facility    on public.preceptor_progress(facility_id);

-- ----------------------------------------------------------------------------
-- 3. SEED — 15 modules (metadata/thresholds; rich content in preceptor.js)
--    Thresholds per the synopsis gate-standard table (they climb by level).
--    M07 reader prose is not in the delivered source set -> content_pending=true
--    (its Gate-1 items exist in the L2 assessor bank; drops in as a one-file add).
-- ----------------------------------------------------------------------------
insert into public.preceptor_modules
  (id, seq, level, level_label, level_pos, title, focus, k_threshold, s_threshold, o_threshold, content_pending)
values
  ('P01', 1,1,'Level 1 Facilitator','1 of 6','The SBD Philosophy and System Architecture','Philosophy, system architecture, the facilitator role',90,80,85,false),
  ('P02', 2,1,'Level 1 Facilitator','2 of 6','Mastering David OG, Your Operational Partner','Using David OG to find who is stuck, ready, or needs a human',90,80,85,false),
  ('P03', 3,1,'Level 1 Facilitator','3 of 6','The Belt System and Curriculum Mastery','Belt system, standardized curriculum, gates',90,80,85,false),
  ('P04', 4,1,'Level 1 Facilitator','4 of 6','Coaching and Intervention Strategies','Coaching the stuck, discouraged, or avoidant learner',90,80,85,false),
  ('P05', 5,1,'Level 1 Facilitator','5 of 6','Observation and Assessment Mastery','Objective observation, Gate 3, assessment integrity',90,80,85,false),
  ('P06', 6,1,'Level 1 Facilitator','6 of 6','Operational Excellence and Scalability','Running the development system at scale',90,80,85,false),
  ('P07', 7,2,'Level 2 Advanced','1 of 4','Multi-Facility Operations','Managing development across multiple facilities',90,85,90,true),
  ('P08', 8,2,'Level 2 Advanced','2 of 4','Advanced Coaching and Leadership','Advanced coaching and leading other facilitators',90,85,90,false),
  ('P09', 9,2,'Level 2 Advanced','3 of 4','Program Design and Continuous Improvement','Designing and improving development programs',90,85,90,false),
  ('P10',10,2,'Level 2 Advanced','4 of 4','Organizational Change Management','Leading change while protecting the standard',90,85,90,false),
  ('P11',11,3,'Level 3 Master','1 of 5','Facilitator Training Pedagogy','Training the trainers: pedagogy of facilitator development',95,90,95,false),
  ('P12',12,3,'Level 3 Master','2 of 5','Curriculum Development','Developing and maintaining curriculum with fidelity',95,90,95,false),
  ('P13',13,3,'Level 3 Master','3 of 5','SBD System Administration','System administration of the SBD platform',95,90,95,false),
  ('P14',14,3,'Level 3 Master','4 of 5','Strategic Leadership and Program Scaling','Strategic leadership and scaling the program',95,90,95,false),
  ('P15',15,3,'Level 3 Master','5 of 5','Research and Evidence-Based Practice','Research and evidence-based practice',95,90,95,false)
on conflict (id) do update set
  seq=excluded.seq, level=excluded.level, level_label=excluded.level_label,
  level_pos=excluded.level_pos, title=excluded.title, focus=excluded.focus,
  k_threshold=excluded.k_threshold, s_threshold=excluded.s_threshold,
  o_threshold=excluded.o_threshold, content_pending=excluded.content_pending;

-- ----------------------------------------------------------------------------
-- 4. RLS — least-privilege from the start; reuse sbd_fi_leader_scope()
-- ----------------------------------------------------------------------------
alter table public.preceptor_modules     enable row level security;
alter table public.preceptor_assignments enable row level security;
alter table public.preceptor_progress    enable row level security;

-- Modules: read-only reference for any authenticated portal user.
drop policy if exists prc_modules_select on public.preceptor_modules;
create policy prc_modules_select on public.preceptor_modules
  for select to authenticated using (true);

-- Assignments: read = own or leader-scoped; write = leader-scoped only.
drop policy if exists prc_assign_select on public.preceptor_assignments;
create policy prc_assign_select on public.preceptor_assignments
  for select to authenticated
  using (staff_id = auth.uid() or public.sbd_fi_leader_scope(staff_id));

drop policy if exists prc_assign_write on public.preceptor_assignments;
create policy prc_assign_write on public.preceptor_assignments
  for all to authenticated
  using (public.sbd_fi_leader_scope(staff_id))
  with check (public.sbd_fi_leader_scope(staff_id));

-- Progress: read = own or leader; a staff member writes their own gate progress,
-- a leader may also write (e.g. Gate-3 confirmation on a candidate's record).
drop policy if exists prc_prog_select on public.preceptor_progress;
create policy prc_prog_select on public.preceptor_progress
  for select to authenticated
  using (staff_id = auth.uid() or public.sbd_fi_leader_scope(staff_id));

drop policy if exists prc_prog_insert on public.preceptor_progress;
create policy prc_prog_insert on public.preceptor_progress
  for insert to authenticated
  with check (staff_id = auth.uid() or public.sbd_fi_leader_scope(staff_id));

drop policy if exists prc_prog_update on public.preceptor_progress;
create policy prc_prog_update on public.preceptor_progress
  for update to authenticated
  using (staff_id = auth.uid() or public.sbd_fi_leader_scope(staff_id))
  with check (staff_id = auth.uid() or public.sbd_fi_leader_scope(staff_id));

-- ----------------------------------------------------------------------------
-- 5. GRANTs (explicit, per synopsis) — RLS still governs row visibility.
-- ----------------------------------------------------------------------------
grant select on public.preceptor_modules to anon, authenticated;
grant select, insert, update, delete on public.preceptor_assignments to authenticated;
grant select, insert, update, delete on public.preceptor_progress    to authenticated;

commit;
