-- Manual assessment-window override storage on staff.
-- Feature: master_admin / staff_admin (SIPS assessor) can open a staffer's
-- assessment window early. Timing-only; auto-reverts to the normal since-based
-- cadence once `until` passes. See docs/decisions/2026-07-16-manual-window-override.md
-- and plans/TEAM-INSTRUCTION New (3).md.
--
-- Additive + nullable: no destructive change, no backfill, no RLS change needed.
-- master_admin (staff_master_all) and staff_admin (staff_staff_admin_write, scoped
-- to assigned_fids) already hold UPDATE on public.staff, which covers this column.

alter table public.staff
  add column if not exists window_override jsonb;

comment on column public.staff.window_override is
  'Manual assessment-window override. Null = none. Shape: {until:"YYYY-MM-DD", by:"<uuid>", byName:"<name>", at:"<iso>", reason:"<text>"}. `until` is computed at open-time = now + the belt''s normal open period (BELT_WINDOWS[belt].open weeks). Honored by getWindowStatus() (src/js/logic.js) only after the current-belt gate-lock passes and only while `until` is in the future; then the normal since-based cadence resumes. Never derived from or written to staff.since.';

-- Rollback:
--   update public.staff set window_override = null;                 -- clear all overrides
--   alter table public.staff drop column if exists window_override; -- remove the column
