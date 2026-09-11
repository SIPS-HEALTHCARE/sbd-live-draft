-- ============================================================================
-- #1208 — module_gate_responses: the typed answer on a module simulation gate
-- (Shawn board 164, dated 11 Sep)
--
-- The Foundations / Instruments G2 gate is multiple choice only. This table is
-- where a candidate's typed reasoning lands: one row per scenario they actually
-- wrote something for, tied to the staff member, the module, the gate and the
-- attempt number.
--
-- NOT aip_question_responses, which the card names. That table's attempt_id and
-- question_id are NOT NULL FKs into aip_assessment_attempts / aip_questions — a
-- dormant pre-hire AIP schema whose grader was retired in #61 and which had
-- USING(true) RLS in prod until #1228 closed it on 2026-09-11. Writing here
-- would mean fabricating parent rows in an unrelated subsystem and permanently
-- coupling a live curriculum gate to one ARCHITECTURE.md marks orphaned.
-- Design note: docs/decisions/2026-09-12-1208-simulation-typed-response.md.
--
-- INPUT AND STORAGE ONLY. No is_correct, no score, no reviewed_by — #1209
-- (board 167) owns scoring and the assessor surface, and adds its own columns.
--
-- APPEND-ONLY to clients: there is no UPDATE and no DELETE policy. This is
-- evidence of what someone wrote; it is not editable from the browser.
--
-- APPLIED BY: the USER via `supabase db query --linked -f <this file>` (CLI is
-- the only prod SQL path; the dashboard editor silently rolls back scripts with
-- a manual COMMIT).
-- ORDER: standalone. No table, policy, function or trigger outside this file is
-- touched, and the frontend's write is best-effort — so the migration and the
-- src/js change can land in either order.
--
-- ROLLBACK:
--   drop table if exists public.module_gate_responses;
-- VERIFY: supabase/verify/1208_gate_responses_check.sql
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. The table
-- ----------------------------------------------------------------------------
-- No FK on staff_id: neither the progress tables nor curriculum_access carry one
-- (orphan cleanup + FKs were deferred in #843), and a lone FK here would be the
-- only thing in the F&I family that can refuse a write.
--
-- module_id is free text for the same reason foundations_assignments.module_id
-- is: one column carries 'fm-01'..'fm-10' AND 'en-%' AND the instrument ids.
--
-- question_ref is the scenario's index in the module's in-code bank ('sim-3').
-- question_text is the prompt AS THE CANDIDATE SAW IT — the banks live in
-- src/js, so the day anyone reorders m.simulations every stored ref points at a
-- different scenario. The text makes the row self-describing and the ref merely
-- a convenience. This is the one column beyond the agreed field list.
create table if not exists public.module_gate_responses (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid not null,
  module_id     text not null,
  gate          text not null default 'g2' check (gate in ('g1','g2','g3')),
  question_ref  text,
  question_text text,
  attempt_no    integer,
  answer_text   text not null,
  created_at    timestamptz not null default now()
);

-- #1209 reads "every answer for this person / this module", and the leader
-- surface lands on (staff, module). One composite index covers both.
create index if not exists idx_module_gate_responses_staff_module
  on public.module_gate_responses(staff_id, module_id, created_at desc);

comment on table public.module_gate_responses is
  '#1208 (board 164): typed candidate answers on a module gate — one row per scenario answered, per attempt. Written by submitFndGate / submitInstGate (src/js) for the G2 simulation gate. Append-only to clients: no UPDATE/DELETE policy. Scoring and the assessor review surface are #1209 (board 167), which adds its own columns. NOT related to aip_question_responses.';

comment on column public.module_gate_responses.question_ref is
  'Index of the scenario in the module''s in-code bank, as ''sim-<n>''. The bank lives in src/js and can be reordered — question_text is the durable record, this is the convenience.';
comment on column public.module_gate_responses.attempt_no is
  'Which attempt at this gate the answer belongs to (1-based), matching the position in the progress row''s g2.attempts[] array. The gate needs 3 passing attempts (FND_PASSES_REQUIRED).';

-- ----------------------------------------------------------------------------
-- 2. RLS
-- ----------------------------------------------------------------------------
alter table public.module_gate_responses enable row level security;

-- A staff member writes their own answers. Same two-legged predicate every
-- fnd_prog_self_* policy uses: staff_id may be the auth uid directly, or be
-- reachable through the portal user's staff_id.
drop policy if exists mgr_self_insert on public.module_gate_responses;
create policy mgr_self_insert on public.module_gate_responses
  for insert to authenticated
  with check (
    staff_id = auth.uid()
    or exists (
      select 1 from public.sbd_portal_users u
      where u.auth_uid = auth.uid()
        and u.staff_id is not null
        and u.staff_id::text = module_gate_responses.staff_id::text
    )
  );

-- Read: your own answers, or a leader in F&I scope (the same helper that scopes
-- every assignment and progress row — master_admin/SIPS, assessor's assigned
-- facilities, facility_admin/hospital's own facility).
drop policy if exists mgr_select on public.module_gate_responses;
create policy mgr_select on public.module_gate_responses
  for select to authenticated
  using (
    staff_id = auth.uid()
    or exists (
      select 1 from public.sbd_portal_users u
      where u.auth_uid = auth.uid()
        and u.staff_id is not null
        and u.staff_id::text = module_gate_responses.staff_id::text
    )
    or public.sbd_fi_leader_scope(staff_id)
  );

-- Deliberately NO update and NO delete policy. RLS denies what no policy allows,
-- so an authenticated caller can append and read and nothing else. A correction
-- is a new row, not a rewrite.

-- T33 / #1144 admin second door. Written out by hand because the T33 prefix loop
-- (20260904120000 / 20260904130000) walks sbd_/david_/foundations_/instrument_/
-- observation/preceptor_/script_/ps_ and this name matches none of them — the
-- same reason #1148 and #1149 had to write it out for their tables.
drop policy if exists sbd_mfa_gate on public.module_gate_responses;
create policy sbd_mfa_gate on public.module_gate_responses
  as restrictive for all to authenticated
  using (public.sbd_mfa_satisfied()) with check (public.sbd_mfa_satisfied());

-- ----------------------------------------------------------------------------
-- 3. Grants
-- ----------------------------------------------------------------------------
-- anon gets nothing: #1228 had to go back and close exactly this on two AIP
-- tables. Only the two verbs the policies allow are granted, so the table-level
-- grant and the policy set say the same thing.
--
-- ⚠️ REVOKE FROM authenticated FIRST, and the order is load-bearing. Supabase
-- ships `alter default privileges in schema public grant all on tables to
-- authenticated`, so this table was born with DELETE/TRUNCATE/UPDATE already on
-- it; GRANT is additive and never takes them back. RLS still denied those verbs
-- (there is no UPDATE/DELETE policy), but a table-level grant that contradicts
-- its own policy set is one dropped policy away from being real. Caught by
-- supabase/verify/1208_gate_responses_check.sql on the first read-back.
revoke all on public.module_gate_responses from anon;
revoke all on public.module_gate_responses from public;
revoke all on public.module_gate_responses from authenticated;
grant select, insert on public.module_gate_responses to authenticated;
grant all on public.module_gate_responses to service_role;

commit;
