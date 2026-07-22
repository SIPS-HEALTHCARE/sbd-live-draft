-- ============================================================================
-- SBD #120 — master-admin override for the belt-assessment request gate
-- ----------------------------------------------------------------------------
-- ADDITIVE. Belt assessment requests are gated on the candidate's current-belt
-- practice tests (canRequestAssessment). This column lets a master admin waive
-- that gate for a specific candidate (client ask, 2026-07-22). Mirrors the
-- window_override pattern exactly: one jsonb column on public.staff, written by
-- a targeted single-column PATCH, UI-gated to master admin.
--   value: null (no waiver) | { waived: true, by, byName, at, reason }
-- ROLLBACK:
--   update public.staff set assessment_gate_override = null;                 -- clear all
--   alter table public.staff drop column if exists assessment_gate_override; -- remove column
-- ============================================================================

alter table public.staff
  add column if not exists assessment_gate_override jsonb;

comment on column public.staff.assessment_gate_override is
  'Master-admin waiver of the practice-test gate for belt assessment requests. '
  'null = no waiver; { waived, by, byName, at, reason }. Additive; mirrors window_override.';
