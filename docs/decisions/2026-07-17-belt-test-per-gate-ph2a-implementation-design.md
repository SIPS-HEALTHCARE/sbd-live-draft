# 2026-07-17 — Belt-test per-gate — Ph.2a implementation design note (answers locked)

> **This is the §4 Design-First Gate artifact.** It locks the three answers Iggie relayed from
> Dr. Jake (2026-07-17, post-1 PM sync) into a buildable spec: data model, engine split, PIN
> threading, assessor notes, and the phase/deploy plan. **No code is written yet** — this note
> is the required pre-code artifact. It supersedes the open questions in the
> [Ph.1 scope/gap-map](2026-07-17-belt-test-per-gate-population-scope.md) and the forked
> estimate in the [Ph.2 development plan §3](2026-07-17-ph2-development-plan.md).
>
> **Verified against the current working tree** (not the older HEAD the Ph.1 doc traced) via a
> full re-scan on 2026-07-17. Line numbers below are current. Cache-bust baseline:
> `api-supabase.js?v=46`, `ui-views.js?v=158`, `belt-test-engine.js?v=1`, `belt-test-flow.js?v=4`.

---

## The three answers (locked) — and what each overrides

| # | Question | Answer (Iggie ← Jake) | Overrides |
|---|---|---|---|
| **PIN** | single assessor PIN vs. observer+candidate handshake | **Option A — single assessor PIN, per test.** "Same as the placement test. Single assessor PIN unlocks each test." | The Ph.2 plan's read leaned **B**. **A is confirmed.** Kills the +1.5–2 day handshake delta. |
| **Scoring** | S1 (defer blend) vs. S2 (per-gate pass/fail, drop suggestion) | **Both: per-gate pass/fail AND a deferred combined recommendation.** "Pass or fail for each test, and a combined belt recommendation once both are done. Each gate stands on its own; the recommendation layer stays and just waits for both." | Not the pure **S2** the plan/memory leaned. It is **S1's deferred blend + S2's per-gate outcome surfaced** — keep the recommendation, but compute it only once both components exist, and show each gate's own pass/fail immediately. |
| **Notes** | numeric only vs. narrative assessor notes | **Narrative. "A notes place for the assessor — schema + entry UI in scope. Plan the bigger version."** | New scope. No `notes` field exists on either belt-test table today. First-class column + entry UI + mapping + read paths (not a throwaway). |

**Net vs. memory:** the stored read `PIN=B / scoring=S2` is wrong on both counts — it is **PIN=A** and **deferred-blend + per-gate pass/fail**, plus a **new notes** requirement. Memory updated.

### Sub-decisions the three answers did NOT cover — defaults locked here (confirm before 2b)
1. **PIN scoping granularity.** "Single assessor PIN unlocks each test" confirms the *pattern* (A, not the handshake). Because the two tests now populate and run at *different times* (each as its gate is approved), the default is **one PIN per component** (scoped to `(staff, belt, component)`), not one shared value for both. Low-risk either way. **Default: per-component PIN.**
2. **Timer TTL.** Jake's Q3 (per-component window) was not answered. **Default: keep the existing 120-min TTL, applied per component.** Trivial to shorten later.
3. **Where the combined recommendation lives.** **Default: a dedicated `component='combined'` result row**, written when the second gate is scored — a stable audit home for `blended_*`/`system_suggestion`/`final_belt`, so the accept/promotion path reads one authoritative row. (Alternative — compute-on-read — rejected: no audit trail, recomputes on every render.)
4. **Notes granularity.** "A notes place for the assessor" → **per-gate notes** (a `notes` value on each component result row), so the assessor can annotate Knowledge and Situational independently. This is distinct from the existing `override_justification` (an override-reason field).

---

## Terminology (unchanged from Ph.1 — the clean 1:1 mapping)

| Jake's term | `component` token | Queue `type` | Staff field | Bank key |
|---|---|---|---|---|
| **Knowledge** | `'knowledge'` | `'Competency'` | `s.cur/nxt.c` | `questions.knowledge` (40 MCQ) |
| **Situational** | `'simulation'` | `'Simulation'` | `s.cur/nxt.s` | `questions.simulation` (20 scenarios) |
| Observation | — | `'Observation'` | `s.cur/nxt.o` | separate on-floor module — **out of scope** |

`component ∈ {'knowledge','simulation'}` is the internal token (matches the `questions.*` bank keys and `_btFlatten` types); it maps to the queue `type` where the approval gate is checked.

---

## Data model (§B2 — migration file, user applies; MCP has no prod access)

**New migration:** `supabase/migrations/20260717140000_belt_tests_per_component.sql` (rollback body in a trailing comment).

### `sbd_belt_tests` — one test row per component
- **`+ component text NOT NULL DEFAULT 'combined'`** — backfills existing/legacy rows as `'combined'` so the old single-test path stays valid; new rows write `'knowledge'` or `'simulation'`.
- **Amend the active-uniqueness index** (the real blocker — current `20260615120000_belt_tests.sql:28-30`):
  ```sql
  DROP INDEX IF EXISTS sbd_belt_tests_active_uq;   -- was (staff_id, target_belt) WHERE status='active'
  CREATE UNIQUE INDEX sbd_belt_tests_active_uq
    ON public.sbd_belt_tests (staff_id, target_belt, component) WHERE status='active';
  ```
  This is the single destructive-ish step; the old definition is preserved in the rollback comment.
- `queue_ids` (jsonb) shifts from bundling *both* gate rows to the *one* component's queue row.

### `sbd_belt_test_results` — per-component rows + a combined row + notes
- **`+ component text NOT NULL DEFAULT 'combined'`** — same backfill logic.
- **`+ notes text`** — the assessor notes field (nullable). Distinct from `override_justification`.
- **Per-component row** (written on that component's submit): fills only that half's fields —
  - `component='knowledge'`: `k_level_scores, k_overall, k_floor_results, k_overall_passed`; `outcome` = `PASS`/`FAIL` for the gate; `sim_*`, `blended_*`, `system_suggestion`, `final_belt` left NULL.
  - `component='simulation'`: `sim_*` + gate `outcome`; `k_*`/blend/suggestion NULL.
- **Combined row** (`component='combined'`, written when the *second* component result lands): `blended_score, blended_passed, system_suggestion, outcome, suggestion_reason_codes, conditions, watch_flags, remediation_flags` — the recommendation layer, deferred until both exist. `final_belt`/override fields fill at accept as today.

> **Blast-radius note:** the `mapBeltTestResult{To,From}Backend` mappers (`api-supabase.js:752`,`:790`) gain `component` and `notes`. The `BT` localStorage object (`belt-test-flow.js:17-28`) gains `component` so the active client test knows which half it is.

---

## Engine: split the blend (`belt-test-engine.js:365-434`)

Today `scoreBeltTest(test, mcqAnswers, simScores)` scores both halves and blends inline:
`blended = kScore.overall*0.60 + sScore.overall*0.40` (`:370-371`), then `suggestBeltFromBlended(blended)` (`:228-234`) picks the belt. The knowledge and simulation sub-scores are **already computed independently inside** — the split is an extraction, not a rewrite.

- **Extract** `scoreComponentKnowledge(...)` and `scoreComponentSimulation(...)` from the existing `kScore`/`sScore` bodies → each returns a per-component result with its own floor pass/fail and gate `outcome` (`PASS`/`FAIL`). No blend, no suggested belt.
- **Add** `combineComponents(kResult, sResult)` → the deferred recommendation: reuse the **existing 0.60/0.40 weights and `suggestBeltFromBlended`** unchanged, plus `evaluateAtBelt` for the PASS/CONDITIONAL_PASS floor logic and reason codes. This is called once both component result rows exist.
- `scoreBeltTest` stays as a thin back-compat wrapper (`scoreComponentKnowledge` + `scoreComponentSimulation` + `combineComponents`) so the legacy combined path and its tests keep passing.

**Semantics preserved:** the combined recommendation is byte-for-byte what today's blend produces; it just fires later. Each gate additionally reports its own pass/fail immediately — the S2 half of the answer.

---

## Candidate flow (`belt-test-flow.js` — §B7, logic stays here, not `ui-views.js`)

| # | Fn (current) | Change |
|---|---|---|
| 1 | `btEligible(staffId, belt)` `:38-44` — `hasC && hasS && !pending` | Split into **per-component** eligibility: `knowledge` ← approved `Competency` & no pending knowledge result; `simulation` ← approved `Simulation` & no pending simulation result. |
| 2 | `beltTestEntryCard(s, belt)` `:47-61` (call site `ui-views.js:8884`) | Emit **up to two independent cards** — a Knowledge card when its gate is approved, a Situational card when its gate is approved — each with its own start/resume action. |
| 3 | `startBeltTest(staffId, belt)` `:64-67` → `showAssessorPinGate(staffId,'belt',cb)` | Thread `component`: `startBeltTest(staffId, belt, component)`; PIN gate scoped per component (default per-component PIN, 120-min TTL). |
| 4 | `btOnAuthorized`→`SB.generateBeltTest` `:69-97`,`:73` | Pass `component`; request only the needed half. |
| 5 | `BT` localStorage `:17-28`, `_btFlatten` `:124-128` | Carry `component`; `_btFlatten` emits only that half (knowledge-only or simulation-only list). |
| 6 | `submitBeltTest(trigger)` `:202-255` | Score **one component** (`scoreComponent*`); insert a **component-scoped** result row; on the second submit, also compute + insert the `combined` row. |

---

## Server: `sbd-generate-belt-test` (§B1 — deploy via `supabase functions deploy`, no dashboard)

- **Gate** (`index.ts:207-224`, `QUEUE_NOT_APPROVED` at `:218`): stop requiring **both** — accept a `component` param and gate only on that component's approval (`knowledge`→`Competency`, `simulation`→`Simulation`).
- **Sample** (insert `:245-262`, `questions:{knowledge,simulation}` at `:254-257`): build and persist **only the requested half** on a component-scoped test row.
- **Idempotency/collision** (short-circuit `:197-205`, race re-read `:264-274`): re-key from `(staff, belt, active)` → **`(staff, belt, component, active)`** so the two components don't collide on the amended unique index.

---

## Assessor side (`ui-views.js` — extend existing fns at their call sites; new logic in the flow module)

| Fn (current line) | Change |
|---|---|
| `acceptBeltTestResult(id)` `:13251-13287` (two `recordAssessment` at `:13271-13272`) | Split into **per-component accept**: records **only the matching gate** (`Competency` for knowledge, `Simulation` for simulation). The final-belt/promotion decision happens once **both** gates are recorded and the `combined` row's recommendation is present. **§B11: the `s.cur/s.nxt` write must spread the full staff record — never a partial PATCH.** |
| `renderBeltPinAuthBlock(fids)` `:13308-13343` (`btEligible` filter, `${n} ready`) | Per-component "ready" rows: a staffer can be ready for Knowledge, Situational, or both; `Generate Belt PIN` scoped to the component. |
| `showAssessorPinGate(staffId, type, cb)` `:1640` / `showGeneratePinModal(staffId, type)` | Thread `component` (e.g. `type='belt:knowledge'`/`'belt:simulation'`) so PIN generation/entry is component-scoped. |
| Review/accept modal | **Assessor notes entry UI** — a `notes` textarea at the record-result step (replacing the current hardcoded `'Dynamic Belt Test — assessor accepted'` literal at `:13271-13272`); persisted to `sbd_belt_test_results.notes` via the updated mapper; surfaced in the review panel and on the staff/facility belt report ("the bigger version"). |

`sbd-assessor-pin` edge fn: confirm it can carry a `component` (and per-component TTL) — small change if it currently keys only on `type='belt'`. Flagged for 2b.

**Observation stays entirely separate** — `ovsUnlock` (`ui-views.js:3063-3078`, the two-PIN handshake) is untouched; the accept dialog keeps its "Observation remains a separate manual gate" note.

---

## Phase & deploy plan

| Phase | Work | Est. |
|---|---|---|
| **2a — this design note** | Answers locked, model + touch points fixed | ✅ today |
| **2b — data + server** | `20260717140000` migration (`component` on both tables, amended unique index, `notes` col) + `sbd-generate-belt-test` per-component gate/half/idempotency + `sbd-assessor-pin` component/TTL | ~1–1.5 d |
| **2c — candidate flow** | `btEligible` split · two cards · `startBeltTest`/`generateBeltTest`/`BT`/`_btFlatten` component threading | ~1 d |
| **2d — scoring + assessor** | engine split (`scoreComponent*` + `combineComponents`) · per-component accept/review/PIN-auth · **assessor notes entry UI + mapping + read paths** | ~2 d |
| **3 — QA** | local/mock end-to-end per component + regression on the legacy combined path; **no live writes** | ~1 d |

**Estimate: ~5.5–6.5 working days** (PIN=A avoids the handshake delta; notes adds ~0.5–1 d over the plan's 5-day A+S1 figure). **Target ≈ Mon Jul 27 – Tue Jul 28**, pending the user applying the migration on schedule.

**Deploy order (memory: migrations applied by the USER; §B1 CLI deploys):**
write migration → **user applies `20260717140000`** → `supabase functions deploy sbd-generate-belt-test` (+ `sbd-assessor-pin` if changed) → deploy frontend with bumped `?v=` on `belt-test-flow.js`, `belt-test-engine.js`, `ui-views.js`, `api-supabase.js`.

## Standards gates
§4 (this note satisfies the pre-code gate) · §B2 (`20260717140000` migration; user applies) · §B1 (`sbd-generate-belt-test`/`sbd-assessor-pin` via CLI, no dashboard) · §B7 (candidate + new assessor logic in `belt-test-flow.js`/`belt-test-engine.js`; only call-site extensions in `ui-views.js`) · §B11 (per-component accept spreads the full staff record) · cache-bust every edited `src/js/*.js` · update `ARCHITECTURE.md §10`.

## Rollback
`component`/`notes` columns are additive (nullable / defaulted `'combined'`); the amended unique index is the one destructive step and keeps the old definition in a rollback comment; code reverts via git; the feature is inert until the frontend `?v=` bump ships.

## Remaining confirmations (non-blocking — defaults locked above)
PIN scoping granularity (default per-component) · timer TTL (default 120 min/component) · combined-recommendation home (default `component='combined'` row) · notes granularity (default per-gate). Flag any you want changed before 2b locks; none block starting 2b.
