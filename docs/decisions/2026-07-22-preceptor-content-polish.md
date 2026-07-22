# Preceptor Certification — content polish

Date: 2026-07-22
Author: Shawn (DepreShawnNeverEnds)
Follows: Phase 1 (2026-07-21) + Phase 2 (2026-07-22), both live on prod.

## Problem
Three refinements remain on the shipped preceptor curriculum:
1. **L2/L3 simulations** are not encoded — only Level 1 has its 5 sims. L2/L3 render an
   "administered by your assessor" placeholder. The L2/L3 assessor gate docs DO contain the
   scenarios; they just use a scenario-injection format the Phase-1 parser skipped.
2. **Gate-3 observation rubrics** are empty — the capstone view shows the auto-fail
   conditions but no rubric categories. The rubric tables exist in all three assessor gate docs.
3. **Tour parity (#77)** — the guided tour has no step for the new `s-/h-/a-preceptor` views,
   violating the standing tour-parity rule (a new view ships with its tour step for every role).

Module 7's reader is NOT in scope here — its workbook was never delivered in the source zip;
it drops in as a one-file content update when the file arrives (its gate items already work).

## Options
1. Hand-author sims/rubrics into preceptor.js. Rejected: transcription-error risk; the source
   docs are the truth.
2. **Extend the deterministic generator (chosen).** Improve `gen.py` to parse the L2/L3 sim
   scenarios + the Gate-3 rubric tables from the assessor gate docs, regenerate the content
   JSON, and re-embed `PRC_LEVEL_GATES` in preceptor.js. Tour steps added by hand (small).

## Choice + why
Option 2 for the content (keeps every item traceable to Dr. Jake's gate docs, no invention);
hand-add the 3 tour steps (trivial, no source needed).

## Scope
- **Generator:** parse L2/L3 Gate-2 simulations (scenario + scoring guide) and all three
  Gate-3 rubric tables (category + weight) from `SBD_L{2,3}_..._Assessor.txt`; regenerate
  `PRECEPTOR_CONTENT.json`; re-embed `PRC_LEVEL_GATES` in `src/js/preceptor.js`.
- **Render:** `renderPrcGate2Reference` already loops `simulations`; `renderPrcG3View`/the
  observation view already loops `rubric` + `autoFail` — so once the data is present it renders
  with no logic change (verify).
- **Tour:** add a `{ target:'[data-view="X-preceptor"]', title:'Preceptor Certification',
  desc:'…', group:'Development' }` step for master (`a-preceptor`), leader/hospital
  (`h-preceptor`), and staff (`s-preceptor`) in `src/js/onboarding.js`, each beside the
  Instruments step.

## Blast radius
- `src/js/preceptor.js` — only the `PRC_LEVEL_GATES` data constant changes (+ regenerated
  sims/rubrics); no logic change. Phase 1/2 functions untouched.
- `src/js/onboarding.js` — 3 additive tour steps.
- `index.html` — cache-bust bump on preceptor.js and onboarding.js.
- No DB change, no F&I impact.

## Rollback
Frontend-only, single revert. Data-only content change + 3 tour steps.

## Out of scope
Module 7 reader (blocked on source file); Phase 3 access toggle; L2/L3 candidate-scored sims
(they stay assessor-administered reference, per the Phase-1 gate model).
