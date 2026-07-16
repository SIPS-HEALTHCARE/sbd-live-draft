# 2026-07-16 — Manual assessment-window override (open early)

> Design-First Gate note (ENGINEERING_STANDARDS.md §4). Feature touches the DB schema,
> so this note must be acknowledged before implementation code is written.
> Source request: `plans/TEAM-INSTRUCTION New (3).md` (QA, confirmed by Iggie 2026-07-15).
> Verified against repo HEAD `bfa20b7` (#113).

Problem:
  The assessment window is never a stored state — `getWindowStatus()` (logic.js:61)
  computes OPEN/CLOSED live from `staff.since` (belt-earned date) and the fixed per-belt
  cadence in `BELT_WINDOWS`. There is no human escape hatch: if a staffer is ready early,
  or the assessor's schedule doesn't line up with the auto-cycle, nobody can let them in.
  Iggie asked that master admin / SIPS assessor be able to open a window ahead of the cycle.

Options:
  1. Store a manual override on the staff row (`window_override` jsonb) that
     `getWindowStatus()` honors until an expiry date, then falls through to the normal
     since-based cadence. Additive, one nullable column, reversible.
  2. Store a real per-staffer window on/off state table with open/close events. Correct
     long-term audit model but new table + RLS + read wiring on the hot login path — far
     more blast radius than the ask.
  3. Mutate `staff.since` to fake an earlier earn date so the cadence math opens the window.
     Rejected outright: `since` drives points, projection, velocity, and history math —
     overwriting it corrupts unrelated calculations and is not reversible.

Choice + why:
  Option 1. It matches the request exactly (timing-only, auto-reverting, belt's normal open
  length), is the smallest correct change, and never touches `since` so every other engine
  keeps working. The override is a self-contained jsonb blob
  `{until, by, byName, at, reason}`; `until` is computed at open-time as now + the belt's
  `cfg.open` weeks, so there is no duration picker and the window silently reverts once
  `until` passes. The override is honored AFTER the existing gate-lock check, so it is
  timing-only: a staffer still must pass their current belt's C/S/O gates before applying
  (decision #2). Gate: role must be `master_admin` or `staff_admin` (SIPS masters +
  SIPS assessors); `facility_admin` / `hospital` / `system_admin` are excluded at the UI.

  Write mechanism — REFINEMENT vs. the QA note: the QA note writes the whole record via
  `mapStaffToBackend(s)` (full spread). This design instead uses a TARGETED single-column
  write `SB.updateStaff(s.id, { window_override: s.windowOverride })` for the open/close
  actions, matching the in-file precedent `toggleObserver` / `generateObserverPin`
  (ui-views.js:12840, 12855) and giving the smallest possible blast radius — it is
  physically incapable of touching `oip` / `history` / `ps_tracks`. The mapper additions
  (both directions) are STILL required so that OTHER full-spread writes (promotions, role
  changes) round-trip the override instead of nulling it. Net: safer than the QA note while
  honoring the same data-safety intent.

Blast radius:
  - DB: `staff` table gains one nullable `window_override jsonb` column. No RLS change —
    `staff_master_all` and `staff_staff_admin_write` already grant UPDATE (verified in
    schema.sql:92-111; staff_admin scoped to `assigned_fids`). Migration must be applied
    by the USER (Supabase MCP has no SBD prod write access) before frontend deploy.
  - api-supabase.js: `mapStaffFromBackend` (+1 line) and `mapStaffToBackend` (+1 line).
    Field name `windowOverride` <-> `window_override`. Grep confirms zero existing refs.
  - logic.js: one new block in `getWindowStatus()` after the gate-lock line (70), before
    the since-math. Returns the existing `status:'open'` shape (+ optional `manual`/
    `openedBy`), so every one of the ~15 `getWindowStatus()` callers keeps working unchanged.
    Independent of and sits above the NaNd fix at logic.js:75-76 (both stay).
  - ui-views.js: 3 new functions (`adminOpenWindow`, `confirmOpenWindow`, `adminCloseWindow`)
    + one button block in the admin staffer profile (`renderHProfile`, context==='admin',
    near the "Assessment Window Status" card) + one "opened early" badge in `renderSWindow`.
    New domain-ish additions land in the existing monolith (B7 tension) but are small,
    self-contained, and belong with the window UI they extend.
  - index.html: cache-bust bumps — logic.js 26->27, api-supabase.js 45->46, ui-views.js
    155->156. (activity.js unchanged; `logActivity` already global & guarded.)
  - What could break: if the mapper round-trip is wrong, a later full-spread staff write
    could drop the override (mitigated by the targeted-write choice + mapper additions);
    if the role gate is bypassed, a facility_admin could still curl a write (RLS permits it
    within their facility) — same posture as every other staff field today, accepted by QA.

Rollback:
  - Code: revert the commit; nothing else reads `windowOverride`, so removing it is inert.
  - Data: `update staff set window_override = null;` clears all overrides (windows revert to
    normal cadence instantly). The column can be dropped later with
    `alter table staff drop column if exists window_override;` — additive, so dropping is safe.
