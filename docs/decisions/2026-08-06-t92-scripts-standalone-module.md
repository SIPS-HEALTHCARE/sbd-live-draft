# T92 — Scripts as a standalone assignable module

**Date:** 2026-08-06 · **Ledger:** TASKS.md T92 (est 2d) · **Client ask:** 3 August call

**Problem:** The communication scripts only exist inside belt curriculum content. If somebody
has passed their belts but their scripts are weak, a leader has no way to send them back to
just the scripts — the only assignable units are whole belts and whole Foundations modules.
The client's words: *"if somebody passes belts but they need to refine their scripts, we want
to be able to assign them just that module so they can go back and work over just that part."*
He also said the scripts stay where they are: *"it's going to stay here, but also be here."*
So this is a **second surface over the same content**, not a move.

**Options:**

1. New `sbd_script_assignments` table + its own assign/track surface.
2. Reuse `foundations_assignments` with `module_id='scripts'`; derive the content at render
   time from the existing `FULL_CURRICULUM_DATA.belts` sections. No migration.
3. Add scripts as an 11th entry in `FOUNDATIONS_MODULES`.

**Choice + why:** Option 2. `foundations_assignments.module_id` is free text — no FK, no CHECK
(`20260625181543_foundations_backend.sql`) — the table already carries `UNIQUE(staff_id,
module_id)`, an audit trail (`assigned_by`/`assigned_date`/`type`/`trigger`), a `status`
column for completion, and RLS that is already exactly what this feature needs: leaders
write, assessors are blocked (#55 / `20260707120000`), DELETE is master_admin only
(`20260703120000`), reads are own-or-leader. Hydration into `DB.foundationsAssignments` is
already wired at login. So option 2 ships with **zero migrations** — which matters, because
several migrations are already sitting in the queue waiting to be applied to production, and
a new table would gate this client ask behind that queue.

Option 3 is rejected: `assignAllModules()` iterates `FOUNDATIONS_MODULES`, so the existing
"All 10" onboarding button would silently auto-assign scripts to every new hire — the exact
opposite of "appears for that person only" — and every Foundations rollup percentage would
change meaning. Option 1 is rejected as a second table that duplicates one that already fits.

The scripts content is **never copied**. `scriptSectionsForBelt(belt)` selects the script
sections out of `FULL_CURRICULUM_DATA.belts[belt]` at render time, and the existing Study &
Practice → Scripts tab is switched over to that same function, so there is one definition of
"which sections are the scripts" instead of two (B6).

Completion is leader-confirmed, not gated. Scripts are spoken language with no question bank;
there is nothing to auto-score, and the leader is the one judging whether the delivery has
been refined. The assignment's own `status` column carries it (`assigned` → `completed`).

**Blast radius:**

| File | Change |
|---|---|
| `src/js/scripts-module.js` | **new** (B7: new domain → new file, not `ui-views.js`) |
| `src/js/foundations.js` | `getFoundationsAssignments()` filters the scripts row out — the one shared accessor every Foundations consumer routes through; `renderHTraining()` gains one Scripts column |
| `src/js/ui-views.js` | `renderSView` route + hide-list, `enterPortal` nav gate, Study Scripts tab switched to the shared extractor (net deletion there) |
| `index.html` | nav item, view container, script tag, cache-bust bumps |

No new tables, no edge functions, no writes to `staff` (so B11 cannot apply), no schema change.

**Known risk:** any *future* Foundations code that reads `DB.foundationsAssignments` directly
instead of through `getFoundationsAssignments()` would count the scripts row as an 11th
module. Today every consumer routes through the accessor (grepped: only `foundations.js`
uses it, and `assignModule`'s own dedupe check, which is keyed on module id anyway).

**Rollback:** remove the nav item + `<script>` tag, then
`delete from public.foundations_assignments where module_id = 'scripts';`
No schema to unwind.

**Verify:** `node scripts/verify-scripts-module.js` — asserts every belt yields at least one
script section, that the belt curriculum arrays are unchanged by this feature, and that the
scripts assignment row is invisible to the Foundations accessor.
