# #1208 — Typed response field for module simulation gates (Shawn board 164)

**Date:** 2026-09-12 · **Ledger:** #1208 (board 164) · **Successor card:** #1209 (board 167, review + scoring)

## Problem

The Foundations and Instruments G2 "Simulation" gate is multiple choice only. A candidate
reads a scenario and clicks one of four options; nothing they write is captured, so a leader
has no way to see *how* the person reasoned. Board 164 asks for a typed answer on the
simulation gate and a write path that stores it.

The card names `aip_question_responses` as the destination. That table cannot take this
data as it stands:

- `attempt_id` and `question_id` are NOT NULL FKs into `aip_assessment_attempts` and
  `aip_questions` — a dormant pre-hire AIP candidate schema whose grader was retired in #61.
  F&I G2 has no rows in either. Writing here means fabricating parent rows in an unrelated
  subsystem, or loosening its FKs.
- Its RLS was `USING (true)` / `WITH CHECK (true)` in prod until #1228 closed it on
  2026-09-11. It is not a table to put real staff answers in.
- `ARCHITECTURE.md` marks the AIP grader retired/orphaned. Tying a live curriculum gate to it
  permanently couples module training to a subsystem nobody maintains.

## Options

1. **New purpose-built table** (`module_gate_responses`), staff-scoped RLS, shaped for
   staff/module/gate/question/attempt.
2. **Repurpose `aip_question_responses`** — needs the RLS fix plus backfilled
   `aip_questions` + `aip_assessment_attempts` rows for every simulation item and every gate
   attempt, forever.
3. **No new table — ride `g2.attempts[]`** in the existing `foundations_progress` /
   `instrument_progress` JSONB. Zero migration.

## Choice + why

**Option 1.** Option 2 is a larger migration that buys a permanent dependency on a retired
schema (Sriman, 9/11: "creating fake parent rows to satisfy its foreign keys"). Option 3 is
the tempting lazy one and was rejected on three grounds: the answers would live in *two*
tables that #1209's reviewer must union; `sbd_fi_progress_guard` already rewrites parts of
those rows server-side; and the client upserts the whole progress row on every gate save, so a
typed answer is one race away from being clobbered by a stale in-memory copy. Evidence of what
a candidate wrote should be append-only and its own row.

**Scope: no "first module".** One field in the G2 renderer of both curricula, so every `fm-*`
and every instrument module gets it at once (Sriman, 9/11 — item 167 says scoring applies in
every module, so the field should too). Preceptor G2 is assessor-scored and Endoscopy `en-14`
G2 is a server-pinned not-applicable pass (#720), so both stay out; neither reaches this code.

**Shape: one box per drawn scenario, optional.** Per-scenario is what gives `question_ref` and
`attempt_no` meaning and what lets #1209 show the scenario beside the answer. Optional keeps
this card input-and-storage only: the Submit button is never blocked and pass/fail stays purely
MCQ, so no gate already in flight changes cost. Only non-empty boxes are written.

**One column beyond the agreed field list: `question_text`.** `question_ref` is the scenario's
index in the module's bank (`sim-3`), and that bank lives in `src/js`. The day anyone reorders
or edits `m.simulations`, every stored ref silently points at a different scenario — in a
surface a leader uses to judge competency. Storing the prompt as written makes the row
self-describing and the ref merely a convenience.

**No scoring columns.** No `is_correct`, no manual-scoring flag, no assessor view. Those are
#1209's, per decision 3.

## Blast radius

| Thing | Change |
|---|---|
| `supabase/migrations/20260912140000_1208_module_gate_responses.sql` | New table + RLS + grants. Nothing existing altered. |
| `src/js/api-supabase.js` | `SB.logGateResponses(rows)` — one POST, `return=minimal`. |
| `src/js/foundations.js` | Textarea in `renderFndGateAssessment` (g2 only); collect + fire-and-forget save in `submitFndGate`. Two shared helpers (`fiSimAnswerHTML`, `fiSaveSimAnswers`) live here because this file loads first. |
| `src/js/instruments.js` | Calls the same two helpers from `renderInstGate` / `submitInstGate`. No second copy (Standards B6). |
| `index.html` | `?v=` bump on the three files above. |

**What could break:** nothing on the read path — no existing surface reads this table. The
write is best-effort (`.catch` → `handleSyncError`), so a failed insert logs and the gate still
scores and saves exactly as it does today. The textarea sits inside `.fnd-q` blocks that both
curricula already render; the MCQ `input[name=...]` selectors `submitFndGate` /
`submitInstGate` score against are untouched.

**Who can `curl` it:** `authenticated` only, `anon` explicitly revoked (the #1228 lesson).
Insert is own-staff-only, select is own-or-`sbd_fi_leader_scope`, and there is no UPDATE or
DELETE policy — clients can append evidence and never rewrite it. The restrictive
`sbd_mfa_gate` is written out by hand because the table name carries neither the `sbd_` nor the
`foundations_` prefix the T33 loop walks (same as `curriculum_modules` and `curriculum_access`).

## Rollback

```sql
drop table if exists public.module_gate_responses;  -- nothing references it
```
Frontend: revert the three `src/js` files and the `?v=` bumps. The two are independent — the
client's save is wrapped, so the frontend is harmless without the table and the table is inert
without the frontend.

## Verify

`node scripts/verify-1208-typed-response.js` (static: the field renders on g2 and only g2, the
helpers are defined once, both curricula call them, the migration carries the RLS shape).
`supabase/verify/1208_gate_responses_check.sql` (live: policy set, grants, anon revoked).
