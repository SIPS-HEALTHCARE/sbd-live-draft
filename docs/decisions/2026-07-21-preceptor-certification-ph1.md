# Preceptor Certification — Phase 1 (content + scored gates)

Date: 2026-07-21
Author: Shawn (DepreShawnNeverEnds)
Source of truth: Dr. Jake Tayler Jacobs, "SBD Preceptor Certification — Developer Build
Synopsis and Access-Control Specification" (21-file curriculum set: 15 learner workbooks,
6 gate documents, synopsis, facilitator program). Tracker #78.

## Problem
Position School track 02B (Educator/Preceptor School) exists in the nav but is a thin stub
(~15 knowledge Q + 5 sims on the generic PS engine). The client-owned curriculum is a full
3-level, 15-module, 9-gate certification pathway. The platform has no real preceptor
certification content or scored gates. Phase 1 must make the curriculum readable and its
gates passable, on the existing rails, with no new engine.

## Options
1. **Pad track 02B's PS question bank.** Rejected: the spec is explicit that the build is a
   fourth curriculum on the Foundations rails, not a bigger PS bank. 02B is only the
   conceptual entry point. Padding 02B would not deliver the 3-level/9-gate structure and
   would fork from the spec.
2. **Build `preceptor_modules` as a fourth Foundations-pattern curriculum (chosen).** New
   namespaced tables + a new `src/js/preceptor.js` domain file mirroring `instruments.js`,
   reusing the shared 3-gate engine (`fndGatePasses`/`FND_PASSES_REQUIRED`, `fndGateBadge`,
   Gate-3 confirm flow). Exactly what the synopsis directs.

## Choice + why
Option 2. It is the spec's explicit instruction ("build nothing new that the platform
already does"), reuses proven engine/table/RLS patterns (lowest risk), and keeps preceptor
logic out of the 14k-line `ui-views.js` per Banned Pattern B7. Phase 1 scope only:
content + scored gates. Assignment/remediation (Phase 2) and the master-admin
belt-independent access toggle (Phase 3) are explicitly OUT of this pass.

### Structure to encode (from the synopsis)
- 15 modules, **continuous numbering 1–15**, **dual labels** (absolute # + within-level
  position, e.g. Module 7 = "Level 2, Module 1 of 4").
- Levels & climbing gate thresholds:
  - L1 Facilitator (mods 1–6): Knowledge 90 / Sim 80 / Obs 85
  - L2 Advanced (mods 7–10): Knowledge 90 / Sim 85 / Obs 90
  - L3 Master (mods 11–15): Knowledge 95 / Sim 90 / Practicum 95
- Content source: the 15 learner workbooks (module reader + knowledge items + sims) and the
  6 gate docs (candidate/assessor per level → observation checklists).

### Build shape
- **Migration** `supabase/migrations/2026072100XXXX_preceptor_backend.sql` (ADDITIVE):
  `preceptor_modules` (read-only reference, SELECT to authenticated), `preceptor_assignments`,
  `preceptor_progress` — cloned from `foundations_assignments`/`foundations_progress`
  (`g1/g2/g3` jsonb, `unique(staff_id, module_id)`), with a `level`/`level_pos` and per-module
  threshold columns to carry the climbing standards.
- **RLS**: mirror the Foundations SELECT/INSERT/UPDATE matrix BUT apply the **scoped** policy
  set (the `sbd_fi_leader_scope` addendum pattern), not the wide-open `using(true)` base —
  per §3.0 security-audit-grade and the #50 "scoping is server-side" lesson. Explicit GRANTs
  to authenticated. Per-module gate thresholds are read from the module row, not hardcoded.
- **New file** `src/js/preceptor.js` (loaded after `foundations.js`/`instruments.js`, before
  `ui-views.js`; own `?v=` tag): `PRECEPTOR_MODULES` constant (the 15 encoded modules) +
  thin accessors, reusing foundations' gate helpers. No gate logic duplicated (B6).
- **Views**: reuse the Foundations reader + gate UI, parameterized by curriculum. Nav
  entries `s-preceptor` (Staff Portal, after Foundations/Instruments) and `h-preceptor`
  (Hospital Portal, after Position School). Router/nav wiring in index.html + minimal
  ui-views.js routing only — the domain logic stays in preceptor.js (B7).
- Gate-3 confirmation-authority check (only a certified preceptor+ confirms) is noted but
  ENFORCED in Phase 3; Phase 1 uses the existing confirm-by-name-and-date flow.

## Blast radius
- **New tables only** — `preceptor_*` are additive; no existing table/column/RPC is altered,
  so no live-contract break (contrast the 2026-07-03 `david_usage_by_app_mtd` incident).
- **New file** `preceptor.js` — does not modify foundations/instruments logic; reuses their
  exported gate helpers (load-order dependency: must load AFTER foundations.js).
- **index.html** — one new `<script>` tag + two sidebar `data-view` nav entries; bump `?v=`
  on any edited `src/js` file.
- **ui-views.js** — minimal: register the two nav routes to preceptor render entrypoints.
  If a Foundations render fn is generalized to serve preceptor data, grep every existing
  caller first (§2.7) so Foundations/Instruments rendering is not disturbed.
- Tour parity (#77): new `s-/h-preceptor` views need tour steps — tracked, not blocking P1.

## Rollback
- Frontend: revert the `preceptor.js` add + the index.html nav/script lines + ui-views
  routing (single commit, isolated). Foundations/Instruments untouched → no regression.
- DB: `preceptor_*` tables are additive and unread by any other surface; a
  `drop table if exists preceptor_progress, preceptor_assignments, preceptor_modules;`
  down-migration removes them with zero impact on live data.

## Scalability sniff test (§5)
1. Two apps? Content is data (`PRECEPTOR_MODULES` + seeded rows), engine is shared — no
   copy-paste of logic.
2. 10× data? Per-staff assignment/progress rows, indexed on `staff_id`, same as F&I — scales.
3. Who can `curl` it? Authenticated users only; writes gated by scoped RLS (leader-or-self),
   not UI. Reads scoped by `sbd_fi_leader_scope`.
4. Provider/API change? None — no LLM/edge dependency in Phase 1.
5. How do we know it broke? Gate attempts log to `g1/g2/g3.attempts` like F&I; node-check +
   headless click-test before handoff.
6. Can someone else undo it? Yes — one migration file + one frontend commit, both in git.

## Out of scope for Phase 1 (queued)
- Phase 2: `preceptor_assignments` assignment UI for educators/managers + remediation linking
  + dashboard rollups.
- Phase 3: `preceptor_access` table + master-admin-only belt-independent grant/revoke toggle
  in user-management; L2/L3 prerequisite enforcement; Gate-3 qualified-confirmer enforcement.
