-- ============================================================================
-- Belt test — per-gate (per-component) population  [Ph.2b]
--   Design note: docs/decisions/2026-07-17-belt-test-per-gate-ph2a-implementation-design.md
--
-- Makes each written belt-test gate populate/deliver/score independently:
--   Knowledge (Competency gate)  ↔ component = 'knowledge'
--   Situational (Simulation gate) ↔ component = 'simulation'
--   Deferred combined recommendation ↔ component = 'combined'
--
-- ADDITIVE + one index amendment. Existing/legacy rows backfill to 'combined',
-- so the pre-existing single-combined-test path stays valid during rollout.
-- Applied by the USER (MCP has no prod access). Rollback body at the bottom.
-- ============================================================================

-- ── 1. sbd_belt_tests: component column + amended active-uniqueness index ─────
-- One ACTIVE test per (staff, belt, COMPONENT) — a candidate can hold an active
-- Knowledge test and an active Situational test at the same time. The prior
-- index (staff_id, target_belt) forbade that; that collision was the blocker.
ALTER TABLE public.sbd_belt_tests
    ADD COLUMN IF NOT EXISTS component text NOT NULL DEFAULT 'combined'
        CHECK (component IN ('knowledge', 'simulation', 'combined'));

DROP INDEX IF EXISTS sbd_belt_tests_active_uq;   -- was: (staff_id, target_belt) WHERE status='active'
CREATE UNIQUE INDEX IF NOT EXISTS sbd_belt_tests_active_uq
    ON public.sbd_belt_tests (staff_id, target_belt, component)
    WHERE status = 'active';

-- ── 2. sbd_belt_test_results: component + assessor notes ─────────────────────
-- A component result row fills only its own half (k_* OR sim_*) and carries the
-- per-gate pass/fail (k_overall_passed / sim_overall_passed; outcome PASS or
-- REMEDIATION — both already in the CHECK, no constraint change). The deferred
-- blended recommendation lands on a separate component='combined' row written
-- when the SECOND gate is scored (test_id NULL, so the mark-submitted trigger
-- below no-ops for it — its IF NEW.test_id IS NOT NULL guard already handles it).
ALTER TABLE public.sbd_belt_test_results
    ADD COLUMN IF NOT EXISTS component text NOT NULL DEFAULT 'combined'
        CHECK (component IN ('knowledge', 'simulation', 'combined'));

-- Assessor free-text notes, captured per gate at the record/accept step.
-- Distinct from override_justification (which is the override-reason field).
ALTER TABLE public.sbd_belt_test_results
    ADD COLUMN IF NOT EXISTS notes text;

-- Engine reconstruction blob (private): the raw per-level / per-question score
-- detail for the component, so the deferred combined recommendation can be
-- computed byte-identically to the legacy single-pass blend even when the two
-- components are scored in separate sessions (the raw answers are device-local
-- and gone by the second submit). Written by scoreComponent*, read by
-- combineComponents. NULL on legacy 'combined' rows.
ALTER TABLE public.sbd_belt_test_results
    ADD COLUMN IF NOT EXISTS component_detail jsonb;

CREATE INDEX IF NOT EXISTS sbd_btr_staff_belt_component_idx
    ON public.sbd_belt_test_results (staff_id, target_belt, component);

-- ── Notes ────────────────────────────────────────────────────────────────────
-- • No RLS change: policies key on role/facility/staff_id, unaffected by the new
--   columns. Candidate self-INSERT still covers the per-component and combined
--   rows (all carry the candidate's staff_id).
-- • The sbd_mark_belt_test_submitted trigger is unchanged and correct here: each
--   component result links to its own component test_id and closes only that test.

-- ============================================================================
-- ROLLBACK (manual — additive columns are safe to keep; the index revert is the
-- only step that restores prior behavior):
--   DROP INDEX IF EXISTS sbd_belt_tests_active_uq;
--   CREATE UNIQUE INDEX IF NOT EXISTS sbd_belt_tests_active_uq
--       ON public.sbd_belt_tests (staff_id, target_belt) WHERE status = 'active';
--   ALTER TABLE public.sbd_belt_test_results DROP COLUMN IF EXISTS component_detail;
--   ALTER TABLE public.sbd_belt_test_results DROP COLUMN IF EXISTS notes;
--   ALTER TABLE public.sbd_belt_test_results DROP COLUMN IF EXISTS component;
--   DROP INDEX IF EXISTS sbd_btr_staff_belt_component_idx;
--   ALTER TABLE public.sbd_belt_tests DROP COLUMN IF EXISTS component;
-- (Reverting the index requires no active per-component tests in flight.)
-- ============================================================================
