# 2026-09-08: Curriculum registry for Foundations and Instruments (#1148, Shawn board 134, ledger T129)

Problem:        Every curriculum is a constant in its own file (FOUNDATIONS_MODULES,
                INSTRUMENT_MODULES, PRECEPTOR_MODULES, ENDOSCOPY_MODULES, the Scripts
                module) and each assignment panel reads its own list. Board 134 asks
                for one registry so grants and assignment read from one place. Live
                9/4: no curriculum_modules or curriculum_access table exists.

Options:        1. One table, curriculum_modules, holding identity/order/gate shape/
                   active for all 44 modules, seeded from the constants by a script.
                   Panels switch to it one curriculum at a time.
                2. Move the constants' content (sections, banks, checklists) into the
                   table too. Five converters, 400+ KB of HTML in rows, and every
                   renderer changes at once.
                3. Widen preceptor_modules into the registry. It is per-level Preceptor
                   metadata (thresholds), nothing reads it, and its name says one
                   curriculum.

Choice + why:   Option 1. The table carries what a leader panel needs to list and
                assign a module (id, title, sequence, gate shape, on/off); content stays
                where the renderers already read it. `scripts/curriculum-registry-seed.js`
                lifts the real constants and prints an idempotent upsert; that output is
                the seed block in the migration, so the constants remain the source
                until each panel switches. In the client, `registryModules(curriculum,
                constants)` (foundations.js) joins active registry rows onto the constant
                by id, in registry order, and falls back to the constant when the
                registry is empty. Foundations and Instruments leader panels
                (renderHTraining / hFndStaffDetail / hAssignFndModal / hAssignAllFnd /
                assignAllModules and the Instruments mirrors) read it now; staff-side
                views, reporting, Scripts, Endoscopy and Preceptor keep their constants
                for later steps. A registry row with no constant behind it is dropped:
                the registry can retitle, reorder or deactivate, it cannot add content.

Not done:       No curriculum_access table (board 134 mentions grants; the assignment
                tables already carry them). No admin UI to edit rows; admins write via
                SQL for now. Scripts/Endoscopy/Preceptor panels not switched.

Blast radius:   migration 20260908140000 (new table, 3 policies, 44 rows; no existing
                table touched), api-supabase.js (+1 SB method, resetDB key), auth-init.js
                (+1 hydration slot), foundations.js (+2 functions, 5 panel edits),
                instruments.js (+1 function, 5 panel edits), index.html cache-busts.
                A leader sees the same lists and the same "All 10" / "All 4" buttons
                because the seed mirrors the constants row for row. If the registry
                deactivates a module, the leader panel hides it and its detail card
                while a staffer already assigned still sees it on their side.

Rollback:       `drop table public.curriculum_modules;` — the frontend falls back to the
                constants on the next login. Or revert the four frontend files.

Deploy order:   Any. Migration first is tidier (`supabase db query --linked -f
                supabase/migrations/20260908140000_1148_curriculum_modules.sql`, then
                record it in the ledger); the frontend degrades to constants if it
                lands first. Read-back: `supabase/verify/1148_curriculum_modules_check.sql`.

Verification:   node scripts/verify-1148-curriculum-registry.js (constants vs seed row
                for row, per-curriculum counts, panel wiring, fallback + identity
                rendering). verify-scripts-module.js and verify-endoscopy-module.js stay
                green (they lift foundations.js).
