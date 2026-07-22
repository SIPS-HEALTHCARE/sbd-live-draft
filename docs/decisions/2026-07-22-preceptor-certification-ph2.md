# Preceptor Certification — Phase 2 (rollups, dashboard/report surfacing, remediation linking)

Date: 2026-07-22
Author: Shawn (DepreShawnNeverEnds)
Follows: docs/decisions/2026-07-21-preceptor-certification-ph1.md (Phase 1 shipped, live).

## Problem
Phase 1 shipped the preceptor curriculum with assign + per-module scored knowledge gates,
and it persists live. But preceptor completion is invisible everywhere the other curricula
report: the admin Network Overview, the facility health/hospital dashboards, and the
personal + facility reports show Foundations & Instruments progress but nothing for the
preceptor pathway. And a gate failure does not surface the targeted-remediation path the
way Foundations frames it.

## Options
1. Bespoke preceptor dashboards/reports. Rejected: duplicates the F&I reporting surface and
   grows `ui-views.js` with a new domain (Banned Pattern B7).
2. **Mirror the Foundations reporting pattern (chosen).** Add preceptor rollup DATA functions
   in `preceptor.js` (like `fndSummaryForStaff`/`fiFacilityRollup`), and surface them through
   the SAME dashboard/report renderers that already call the F&I rollups — render CALLS only
   in `ui-views.js`, domain logic in `preceptor.js`.

## Choice + why
Option 2. Reuses proven rollup shapes and the existing report/dashboard renderers; keeps
preceptor logic out of `ui-views.js`; no schema change (reads the existing `preceptor_*`
tables). Lowest risk, consistent surface for the client.

## Scope
1. **Rollup data (preceptor.js):**
   - `prcSummaryForStaff(staffId)` → { assigned, complete, pct, byLevel } for one candidate.
   - `prcFacilityRollup(facilityId)` → { assignedCount, completeCount, completionPct, staffWith }
     across a facility (mirror `fiFacilityRollup`).
   - Section-render helpers in `preceptor.js` (e.g. `prcStaffSectionHTML`, `prcFacilitySectionHTML`,
     PDF variants) so `ui-views.js` only calls them (parity with `fiStaffSectionHTML`).
2. **Dashboard surfacing:** a "Preceptor Certification" completion stat/card in the admin
   Network Overview and the hospital/facility dashboard, next to the F&I completion numbers.
3. **Reports:** a Preceptor Certification section in the personal report (`renderSReport`/
   `downloadStaffReport`) and the facility report (`renderHReports`/`downloadFacilityReportV2`),
   on-screen + PDF, mirroring the F&I section wiring.
4. **Remediation linking:** on a failed gate, surface a targeted "assign remediation" prompt
   for that module (the assign modal already supports type=remediation + trigger; this wires
   the failure → prompt path, the way Foundations frames a failure-driven assignment).

## Blast radius
- **preceptor.js** — additive functions only; no change to Phase-1 gate/assign logic.
- **ui-views.js** — render CALLS added into the existing dashboard/report renderers
  (renderADashboard/renderHDashboard, renderSReport/renderHReports, the PDF builders). Grep
  each renderer's existing F&I call site and add the preceptor call beside it; do NOT alter
  F&I output. Bump `?v=` on every edited src/js file.
- **No DB change.** Reads `preceptor_modules/assignments/progress` (already live).
- Reuse `Security.sanitize`, the shared badge/format helpers; no duplication (B6).

## Rollback
Frontend-only, single revert. No schema to undo. F&I and Phase-1 preceptor untouched, so no
regression path beyond the added sections (which are purely additive render blocks).

## Scalability sniff test (§5)
1. Two apps? Rollups are pure functions over existing per-staff rows — no copy-paste.
2. 10× data? Same indexed per-staff/per-facility reads as F&I rollups.
3. curl surface? No new endpoint; reads go through existing RLS-scoped tables.
4. Provider change? None (no LLM/edge).
5. How do we know it broke? node --check + headless render smoke on the dashboards/reports.
6. Undo? One frontend revert in git.

## Out of scope (Phase 3, separate)
Master-admin belt-independent access toggle (`preceptor_access` grant/revoke); L2/L3
prerequisite enforcement; Gate-3 qualified-confirmer enforcement.
