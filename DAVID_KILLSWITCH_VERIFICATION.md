# David AI Global Killswitch — Bypass Verification (#17)

**Audited:** 2026-07-13 · **Scope:** does `GLOBAL_KILLSWITCH` actually stop David, and can anything bypass it?
**Method:** read-only code audit of `supabase/functions/` + `src/`. No prod calls.
**Prerequisite for:** #59 (anomaly auto-throttle) — that build needs to know exactly what the switch does and does not cover.

## Verdict

The killswitch is **sound for its actual scope: the David chat assistant (`david-chat`)**. There is no path that streams a David chat answer after the switch is thrown, no cached client state that keeps chat usable, and the flag is re-read from the database on every request. **But the switch does not govern the two assessment-grading functions, and does not lock out master admins** — see the gaps below. Whether that is correct depends on what "global killswitch" is meant to mean, which is a product decision for Shawn and directly shapes #59.

## What the switch does

`GLOBAL_KILLSWITCH` (`supabase/functions/david-admin-api/index.ts:373-389`) runs a single
`UPDATE david_facility_access SET is_active = false` across all rows, and writes one audit row
(`david_audit_logs`, action `GLOBAL_KILLSWITCH`, facility `ALL_NETWORK`). There is **no separate global flag** — "global" is the aggregate of every facility row being off. Handler is gated to `master_admin` (`:52-57`).

## Confirmed safe (no bypass)

- **Per-request DB re-read.** `david-chat` re-reads `david_facility_access.is_active` from the DB on every request via `verifyUserAndFacility` (`david-chat/auth.ts:28`), called at `index.ts:47` — **before** the stream is created, before the quota check, and before any LLM call. On failure it returns **403 before any model call**. No cached value or JWT claim is trusted for `is_active` (the JWT only identifies the user).
- **Facility AND user gate.** Non-master access requires facility `is_active` **and** user `is_active` (`auth.ts:33-41`). Turning all facility rows off locks out every non-master user regardless of their per-user flag.
- **No client-side bypass.** The frontend nav gate (`src/js/ui-views.js:673-683`) is UX-only and self-documented as such; the chat send path (`src/components/DavidChat.js:1853`) carries only the auth JWT, no stored access grant. A stale client that sends a message after the switch still hits `david-chat` and gets 403.
- **Reserve draw is not a bypass.** The "manager reserve draw" (`david-chat/index.ts` quota block) is a *quota* concept inside the post-gate `!isMaster && facilityId` path; it can only run after the `is_active` gate has already passed, so it cannot fire on a killswitched facility.

## Gaps to decide (feed these to Shawn / #59)

- **G1 — master_admin is not covered.** `master_admin` is authorized before either access table is read (`auth.ts:23-25`), so the switch does not lock out master admins. Likely intended (admins need a way back in), but confirm.
- **G2 — the switch governs `david-chat` ONLY.** `david-grade-assessment` (`index.ts` OpenRouter call) and `sbd-score-assessment` invoke the model **without** checking `david_facility_access`. Assessment grading keeps running — and keeps spending — after the killswitch is thrown. **If the switch is meant to halt all AI spend, it does not today.** Decision: is grading in-scope for the killswitch, or explicitly out (it is assessment scoring, not the David assistant)? This determines whether #59's throttle must also gate the grading functions.
- **G3 — auto-throttle is unimplemented.** The "auto-throttle" in `david-anomaly-detector/index.ts:54-55` is a **comment only**. #59 builds it for real; it should reuse the same `david_facility_access.is_active` mechanism this audit validated (and decide G2 for grading).

## Table shapes (reference)

- `david_facility_access`: `is_active`, `tier`, `usage_tier`, `questions_allowance`, `questions_consumed`, `reserve_consumed`, `period_start`, `custom_directive`, … — the switch only writes `is_active`.
- `david_user_access`: has its own `is_active`; the switch does **not** touch it, but it sits behind the facility flag in the gate, so flipping facilities off is sufficient to lock non-master users.
