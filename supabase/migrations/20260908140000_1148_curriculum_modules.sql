-- ============================================================================
-- #1148 — curriculum_modules: one registry for every module in the five curricula
-- (Shawn board 134, ledger T129)
--
-- Today each curriculum is a constant in its own file (FOUNDATIONS_MODULES,
-- INSTRUMENT_MODULES, PRECEPTOR_MODULES, ENDOSCOPY_MODULES, the Scripts module)
-- and every assignment panel reads its own list. This table lists all of them in
-- one place so grants and assignment can read from it, one curriculum at a time.
--
-- The constants stay the source of truth for now: the seed block in §3 is the
-- output of `node scripts/curriculum-registry-seed.js`, pasted verbatim, and
-- `node scripts/verify-1148-curriculum-registry.js` fails if the two drift.
-- Content (sections, question banks, observation lists) never moves here — the
-- registry holds identity, order, gate shape and an on/off switch only.
--
-- preceptor_modules (baseline) is that curriculum's own older per-level table and
-- is left alone; nothing reads DB.preceptorModules yet.
--
-- RLS: read for every authenticated user; INSERT/UPDATE/DELETE for admins only
-- (sbd_is_master_admin = master_admin/admin, aal2 through sbd_mfa_gate, which the
-- T33 prefix loop does not reach because the name has no sbd_/foundations_ prefix,
-- so the same restrictive policy is created here explicitly).
--
-- APPLIED BY: the USER via `supabase db query --linked -f <this file>` (CLI is the
-- only prod SQL path; the dashboard editor rolls back manual-COMMIT scripts).
-- ORDER: any time. The frontend (foundations.js/instruments.js registryModules)
-- falls back to the constants while the table is missing or empty, so a leader's
-- screen is identical before and after.
--
-- ROLLBACK: drop table public.curriculum_modules;  (frontend falls back to constants)
-- VERIFY:   supabase/verify/1148_curriculum_modules_check.sql
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. The table
-- ----------------------------------------------------------------------------
create table if not exists public.curriculum_modules (
  module_id   text primary key,                       -- fm-01, im-wb, scripts, en-01, P01
  curriculum  text not null
              check (curriculum in ('foundations','instruments','scripts','endoscopy','preceptor')),
  title       text not null,
  sequence    integer not null check (sequence > 0),  -- display order inside the curriculum
  gate_shape  text not null
              check (gate_shape in ('knowledge_simulation_observation',  -- 3-gate engine
                                    'knowledge',                          -- Endoscopy chapters
                                    'knowledge_observation',              -- Endoscopy capstone
                                    'leader_confirmed')),                 -- Scripts
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_curriculum_modules_curriculum
  on public.curriculum_modules(curriculum, sequence);

drop trigger if exists curriculum_modules_touch_updated_at on public.curriculum_modules;
create trigger curriculum_modules_touch_updated_at
before update on public.curriculum_modules
for each row execute function public.touch_updated_at();

comment on table public.curriculum_modules is
  '#1148 (board 134, T129): registry of every module across the five curricula. Identity, order, gate shape, active flag only; content stays in the src/js constants. Seeded by scripts/curriculum-registry-seed.js.';

-- ----------------------------------------------------------------------------
-- 2. RLS — read for authenticated, write for admins only, aal2 gate as on every
--    other belt table (T33).
-- ----------------------------------------------------------------------------
alter table public.curriculum_modules enable row level security;

drop policy if exists cm_select on public.curriculum_modules;
create policy cm_select on public.curriculum_modules
  for select to authenticated using (true);

drop policy if exists cm_admin_write on public.curriculum_modules;
create policy cm_admin_write on public.curriculum_modules
  for all to authenticated
  using (public.sbd_is_master_admin())
  with check (public.sbd_is_master_admin());

drop policy if exists sbd_mfa_gate on public.curriculum_modules;
create policy sbd_mfa_gate on public.curriculum_modules
  as restrictive for all to authenticated
  using (public.sbd_mfa_satisfied()) with check (public.sbd_mfa_satisfied());

revoke all on public.curriculum_modules from anon;
grant select, insert, update, delete on public.curriculum_modules to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Seed — output of `node scripts/curriculum-registry-seed.js`, verbatim.
--    Idempotent: re-running re-asserts the constants' values and re-activates
--    the row. Rows deactivated on purpose must be re-deactivated after a re-seed.
-- ----------------------------------------------------------------------------
insert into public.curriculum_modules (curriculum, module_id, title, sequence, gate_shape) values
  ('foundations', 'fm-01', 'Foundations', 1, 'knowledge_simulation_observation'),
  ('foundations', 'fm-02', 'Decontamination', 2, 'knowledge_simulation_observation'),
  ('foundations', 'fm-03', 'Inspection & Identification', 3, 'knowledge_simulation_observation'),
  ('foundations', 'fm-04', 'Assembly & Tray Building', 4, 'knowledge_simulation_observation'),
  ('foundations', 'fm-05', 'Packaging & Wrapping', 5, 'knowledge_simulation_observation'),
  ('foundations', 'fm-06', 'Sterilization', 6, 'knowledge_simulation_observation'),
  ('foundations', 'fm-07', 'Storage & Distribution', 7, 'knowledge_simulation_observation'),
  ('foundations', 'fm-08', 'High-Level Disinfection', 8, 'knowledge_simulation_observation'),
  ('foundations', 'fm-09', 'Quality Assurance', 9, 'knowledge_simulation_observation'),
  ('foundations', 'fm-10', 'Professional Development', 10, 'knowledge_simulation_observation'),
  ('instruments', 'im-wb', 'White Belt Instruments', 1, 'knowledge_simulation_observation'),
  ('instruments', 'im-yb', 'Yellow Belt Instruments', 2, 'knowledge_simulation_observation'),
  ('instruments', 'im-gb', 'Green Belt Instruments', 3, 'knowledge_simulation_observation'),
  ('instruments', 'im-bb', 'Blue Belt Instruments', 4, 'knowledge_simulation_observation'),
  ('scripts', 'scripts', 'Scripts', 1, 'leader_confirmed'),
  ('endoscopy', 'en-01', 'Why Endoscope Reprocessing Matters', 1, 'knowledge'),
  ('endoscopy', 'en-02', 'Understanding Endoscope Anatomy', 2, 'knowledge'),
  ('endoscopy', 'en-03', 'Personal Protective Equipment', 3, 'knowledge'),
  ('endoscopy', 'en-04', 'Pre-Cleaning At Point Of Use', 4, 'knowledge'),
  ('endoscopy', 'en-05', 'Transport To Reprocessing', 5, 'knowledge'),
  ('endoscopy', 'en-06', 'Leak Testing', 6, 'knowledge'),
  ('endoscopy', 'en-07', 'Manual Cleaning', 7, 'knowledge'),
  ('endoscopy', 'en-08', 'High-Level Disinfection', 8, 'knowledge'),
  ('endoscopy', 'en-09', 'Rinsing', 9, 'knowledge'),
  ('endoscopy', 'en-10', 'Drying', 10, 'knowledge'),
  ('endoscopy', 'en-11', 'Storage', 11, 'knowledge'),
  ('endoscopy', 'en-12', 'Documentation & Traceability', 12, 'knowledge'),
  ('endoscopy', 'en-13', 'Troubleshooting', 13, 'knowledge'),
  ('endoscopy', 'en-14', 'Review & Competency Verification', 14, 'knowledge_observation'),
  ('preceptor', 'P01', 'The SBD Philosophy and System Architecture', 1, 'knowledge_simulation_observation'),
  ('preceptor', 'P02', 'Mastering David OG, Your Operational Partner', 2, 'knowledge_simulation_observation'),
  ('preceptor', 'P03', 'The Belt System and Curriculum Mastery', 3, 'knowledge_simulation_observation'),
  ('preceptor', 'P04', 'Coaching and Intervention Strategies', 4, 'knowledge_simulation_observation'),
  ('preceptor', 'P05', 'Observation and Assessment Mastery', 5, 'knowledge_simulation_observation'),
  ('preceptor', 'P06', 'Operational Excellence and Scalability', 6, 'knowledge_simulation_observation'),
  ('preceptor', 'P07', 'Multi-Facility Operations', 7, 'knowledge_simulation_observation'),
  ('preceptor', 'P08', 'Advanced Coaching and Leadership', 8, 'knowledge_simulation_observation'),
  ('preceptor', 'P09', 'Program Design and Continuous Improvement', 9, 'knowledge_simulation_observation'),
  ('preceptor', 'P10', 'Organizational Change Management', 10, 'knowledge_simulation_observation'),
  ('preceptor', 'P11', 'Facilitator Training Pedagogy', 11, 'knowledge_simulation_observation'),
  ('preceptor', 'P12', 'Curriculum Development', 12, 'knowledge_simulation_observation'),
  ('preceptor', 'P13', 'SBD System Administration', 13, 'knowledge_simulation_observation'),
  ('preceptor', 'P14', 'Strategic Leadership and Program Scaling', 14, 'knowledge_simulation_observation'),
  ('preceptor', 'P15', 'Research and Evidence-Based Practice', 15, 'knowledge_simulation_observation')
on conflict (module_id) do update
  set curriculum = excluded.curriculum,
      title      = excluded.title,
      sequence   = excluded.sequence,
      gate_shape = excluded.gate_shape,
      active     = true;

commit;
