# T108 / #720 — Endoscopy Module Build

**Date:** 2026-08-28 · **Status:** Approved, building · **Origin:** Iggie brief 2026-08-13 Priority 3; content in hand 2026-08-27; build brief same day; plan verdict 2026-08-28.

## Problem
Endoscopy reprocessing training must exist as a leader-assigned-only module (one named person at a time), with no belt trigger and no facility-wide rollout, in the first release. Content is one Self-Study Manual (13 chapters, 18-question Final Assessment with answer key) and one Preceptor Guide (13 SAY/ASK modules, 28-item Competency Verification checklist — the only part the client wants on the platform).

## Options
1. **New standalone tables** (own `endoscopy_assignments`/`endoscopy_progress`), mirroring Preceptor's table pair. Clean separation, but a migration + new CRUD + new hydration for one module.
2. **Ride `foundations_assignments`/`foundations_progress`** with `module_id='en-01'` (free text, no CHECK/FK, `UNIQUE(staff_id,module_id)` already correct RLS). Zero migration, zero new CRUD, zero hydration change — the existing `en-*` filter pattern (proven by T92/T92a's `SCRIPTS_MODULE_ID` filter) keeps it invisible to every N/10 surface.

## Choice + why
**Option 2.** Verified by reading all 8 migrations touching `foundations_assignments`: no CHECK, no FK on `module_id` anywhere. `assignModule()`, `getModuleGates()`, and all four `SB.*Foundations*` CRUD functions are module-id-generic. This is a one-module, first-release feature — a new table pair is design-first-gate-worthy ceremony for zero present benefit. The known tension (T92a moved Scripts OUT of this table because "not bundled inside another track") was about *user-visible* bundling (the N/10 count, the "All 10" button) — the `en-` prefix filter and a separate `ENDOSCOPY_MODULES` constant (never added to `FOUNDATIONS_MODULES`) fully prevent that. No user-visible surface mixes the two.

Two scoring decisions, reviewed and closed 2026-08-28:
- **G1 (knowledge).** 14 items auto-scored: the 8 True/False items plus the 6 fill-in-the-blank items (all single-word or fixed-phrase answers — `immediately`, `removed`, `clean`, `Minimum Effective Concentration`, `dry`, `distal` — normalized-string matched). Only the 4 short-answer questions stay leader-marked, folded into G3 as a sixth group. A fixed 8-item T/F bank passing at "7 of 8" is guessable in ~28 attempts on average with unlimited free retakes; **G1 now requires all 14 correct (100%) to pass** — a one-constant change, not a cooldown or session-limit mechanism, and it closes the guessing math outright since the 6 fill-blank items aren't guessable at all.
- **G2 (simulation).** No scenario bank exists in the content. Endoscopy ships on two gates (Knowledge + Observation); G2 is seeded pre-passed at assignment time and never shown. Reversible in one file if a scenario bank arrives later.

## Blast radius
- **New file:** `src/js/endoscopy.js` (module content, gate engine, staff + leader renderers) — new domain, own file per Standards B7.
- **New file:** `scripts/endoscopy-from-docx.py` (imports shared converter helpers from `foundations-from-docx.py`, never copies them — Standards B6).
- **New file:** `scripts/verify-endoscopy-module.js`.
- **Edited:** `src/js/foundations.js` — two edits: extend the `SCRIPTS_MODULE_ID` filter in `getFoundationsAssignments()` to also exclude `en-*`; add an Endoscopy column to `renderHTraining`'s staff table (both grepped for every caller before editing, per ARCHITECTURE.md §18/Standards DoD).
- **Edited:** `index.html` — hidden staff nav item, view container, new `<script>` tag after `foundations.js`, `?v=` bumps on `foundations.js`/`ui-views.js`.
- **Edited:** `src/js/ui-views.js` — `renderSView` array entry, view-function map entry, `applyEndoscopyNavGate()` call in `enterPortal` (all three grepped first).
- **No migration, no edge function, no new DB table.**

## Rollback
Delete `src/js/endoscopy.js`, revert the three edited files, remove the `<script>` tag and nav item from `index.html`. Any `en-01` rows already written to `foundations_assignments`/`foundations_progress` are inert (filtered out of every Foundations surface) and can be deleted with a plain `DELETE ... WHERE module_id='en-01'` — no cascade, no migration to undo. If the client later insists on physical table separation, migration `20260820120000` (the T92a Scripts move) is the exact template to copy.
