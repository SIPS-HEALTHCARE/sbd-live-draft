# #1224 — Observation gate reset: placement confirm stops writing `cur_obs`

*Board 148 (Shawn, 12 Sep) · ledger T132 · our card #1224 · HEAD at the time: `dc5852e3`*

## Problem

`confirmPlacement()` (`src/js/ui-views.js:4654`) wrote `cur_comp`, `cur_sim` **and**
`cur_obs` to `'pass'` when an admin confirmed a belt placement. No observation happens
anywhere in that flow — no checklist, no observer, no `observations` row — so the
observation gate read **Passed** with nothing behind it.

#1121 fixed a different thing on the same board: the F&I G3 checklist no longer stamps a
fake `score: 100`. It never touched this write.

## Options

1. **Stop writing all three gates at placement.** Honest, but `getWindowStatus()`
   (`logic.js:92`) gate-locks the next-belt window until all three current-belt gates pass,
   so every newly placed staffer would be frozen behind two gates they *did* sit.
2. **Stop writing `cur_obs` only; keep `cur_comp`/`cur_sim`.** ← chosen.
3. **Keep the write and loosen the window's gate-lock instead.** Rejected: it moves the same
   lie one layer down and quietly weakens the belt model for every other path.

## Choice + why

The rule is *a gate is only written by a real confirmation of that gate*, applied per gate:

- **Competency and Simulation stay.** The placement assessment **is** those two components.
  It asks knowledge questions and simulation scenarios, scores them, blends them against the
  belt's knowledge/simulation floors, and an assessor signs the result off in this very
  function. The `placement_reviews` row is the evidence. Writing them is truthful, so the
  same rule that removes `cur_obs` is what keeps these.
- **Observation goes.** There is no observation step in placement at all. This was the only
  gate with zero evidence, which is exactly why it is the only one removed.

The write is *absent* from the PATCH rather than set to `null`, and the in-memory mirror
spreads `s.cur` rather than replacing it, so a candidate who genuinely passed an observation
before their review was confirmed does not lose it.

**Accepted consequence, stated plainly:** a newly placed Yellow+ staffer now reads
"Complete current belt assessments first" until a real observation is recorded. White is
exempt (`getWindowStatus` short-circuits on it), so the routine new-hire path is unchanged.
Of the 40 corrected rows, 20 are White (no operational change) and 20 are not (7 Yellow,
10 Green, 3 Brown) and are window-locked until observed. That lock is the point: the window
used to open on a gate nobody ran.

**How a real observation still lands.** Unchanged: the assessor's Record Assessment modal
with type `Observation` and target belt = the staffer's **current** belt routes through
`submitAssessment()` → `s.cur.o` → `sbd-record-assessment`. A belt promotion also lifts a
confirmed `nxt_obs` into `cur_obs`. Note the candidate-facing observation console is a
**next-belt** gate by design (`requestObservation` is only ever called with `nextBelt`) and
writes `nxt_obs`, so it is not the path for clearing a current-belt gate — the 20 locked
staff need an assessor-recorded observation, not a candidate PIN request.

## The count

Read live from prod 2026-09-11 (`supabase db query --linked`):

| query | result |
|---|---|
| `select count(*) from staff where cur_obs='pass'` | **42** |
| ...with **no** observation evidence of any kind | **40** ← corrected |
| ...with some observation trace, left alone | **2** |
| `select count(*) from observations` | 3 |
| `select count(*) from observations where review_status='approved'` | **0** |

Evidence is defined fail-safe: an `observations` row for that `staff_id` in **any** status,
**or** a `staff.history` entry whose `type` matches `%observ%` in **any** result. Any trace
at all keeps a row out of the clear.

**40 matches Shawn's number exactly.** The issue's 41 counts `Placement` history entries,
not evidence; the issue's premise that the remaining one is explained by F&I/preceptor G3 is
not what the data shows — **zero** of the 42 have a non-`na` G3 pass in
`foundations_progress`, `instrument_progress` or `preceptor_progress`, and **zero** have an
approved observation. No belt observation has ever been confirmed end to end in this
database. 41 of the 42 carry a `Placement` history entry and 40 join a confirmed
`placement_reviews` row (Shawn's join); 3 carry a `Belt Override` entry.

The 2 rows deliberately left alone: `2e550aae-ea87-4694-ab9a-52f848be8dca` and
`c280aa16-7f97-40f1-8b7c-c2822463b5ed`. Both carry a `staff.history` entry of type
`Observation`; `c280aa16` also has an `observations` row (it is the account #1109 identified
as Dr Jake's test account). Ambiguous, so a human rules on them rather than a script.

## Blast radius

| touched | what |
|---|---|
| `src/js/ui-views.js` | `confirmPlacement()` only — the staff PATCH body and its in-memory mirror. Cache-buster `?v=238 → 239`. |
| `supabase/migrations/20260912120000_1224_observation_gate_reset.sql` | new; clears 40 rows, snapshots them first, asserts its own count. |
| `scripts/verify-1224-observation-gate.js` | new harness. |
| `scripts/verify-no-belt-placement.js` | updated: it pinned the old three-gate contract (cases 2, 3b, 6). |

`cur_obs` feeds exactly three things and nothing else: the window gate-lock
(`logic.js:92`), `calcPoints()` (−50 points per cleared gate; `staff` has no stored points
column, so nothing is re-derived), and display (the "Observation Gate Passed" stat card and
the profile gate cards move from Passed to Not Started).

## Explicitly out of scope

`submitBeltOverride()` (`ui-views.js` ~11036) also writes `cur_obs: 'pass'` on a promotion,
carrying the same comment about the window lock. Board 148 scopes only the confirm path, and
an override is a different animal: an explicit master-admin action with a mandatory reason,
a ≥10-character justification and an audit entry — it is a decision, not a measurement.
1 of the 40 corrected rows came from an override (`f9a295f8`, "Assessor Error Correction"),
so the correction and the code are momentarily out of step there. **Open question for
Shawn:** should the override path drop `cur_obs` too? Assertion 12 of
`verify-1224-observation-gate.js` pins the current behaviour so the decision stays visible.

## Applied

Migration `20260912120000` applied to prod **2026-09-11** and ledger-recorded. Read back live:

| check | expected | actual |
|---|---|---|
| `staff` still at `cur_obs='pass'` | 2 | **2** |
| `staff_obs_gate_backup_1224` rows | 40 | **40** |
| backed-up rows now `cur_obs is null` | 40 | **40** |
| ...by belt | White 20 / Yellow 7 / Green 10 / Brown 3 | **same** |
| ...still `cur_comp='pass'` and `cur_sim='pass'` | 40 | **40** |
| ...non-White, i.e. now window-locked | 20 | **20** |
| backup table RLS on, zero policies | yes / 0 | **yes / 0** |

## Rollback

The migration snapshots the pre-state into `public.staff_obs_gate_backup_1224` inside the
same transaction:

```sql
update public.staff s set cur_obs = b.cur_obs
  from public.staff_obs_gate_backup_1224 b where b.id = s.id;
drop table public.staff_obs_gate_backup_1224;
```

Keep the backup table until #1224 is closed out and the read-back is on the ledger.
The frontend rolls back by reverting the `ui-views.js` commit and dropping `?v=` back to 238.
