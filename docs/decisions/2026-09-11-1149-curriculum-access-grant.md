# #1149 — Curriculum access grant on the staff profile (board, 11 Sep · ledger T133)

**Status:** design note, awaiting acknowledgement (Standards §4 — this touches the schema).
**Depends on:** #1148 `curriculum_modules` (applied 2026-09-08). This grant reads that registry.

## Problem

Nothing records *which curricula a person may be assigned*. Any leader who can write an
assignment row can assign anybody any module of any curriculum — Foundations, Instruments,
Scripts, Endoscopy — because the only server gate is
`sbd_fi_can_manage_assignments(staff_id)`, which asks "may you assign to this person",
never "may this person hold this curriculum". Preceptor is the one curriculum that already
answers the second question, through its own `preceptor_access` table.

Iggie's decision 9 is to leave the two grant screens (Role Management, the preceptor
apply/approve queue) as they are, so this grant goes on the **staff profile**, next to the
grants already there, and preceptor access stays where it is.

## Options

1. **Per-module grant** — a row per (staff, module). Exact, and 44 checkboxes per person on
   the profile. Every assignment panel already picks modules; a second per-module gate is a
   second place to keep in step.
2. **Per-curriculum grant** — a row per (staff, curriculum), curricula read from the
   registry. Four checkboxes. Which *modules* inside a curriculum someone gets stays the
   assignment panel's job, which is where the client already makes that choice.
3. **A capability on `sbd_portal_users.capabilities`** (the §8A grant bag). Wrong subject:
   capabilities describe what the *logged-in user* may do; this describes what a *staff
   member* may be given, and most staff have no portal user row at all.

## Choice + why

**Option 2.** One new table, `curriculum_access`, one row per (staff, curriculum), holding
`granted_by` and `granted_at`. The profile control lists the curricula the registry knows
(`select distinct curriculum from curriculum_modules where active`), minus `preceptor`,
which keeps its own table and its own control. Grain matches the client's sentence — "which
curricula a person may be assigned" — and matches what the registry can enumerate, so the
control has no list of its own to drift.

Enforcement is **server-side**, in the INSERT policy of each assignment table
(`foundations_assignments`, `instrument_assignments`, `script_assignments`), not in the
buttons. The client checks are for the message, not the gate (Standards B3). A new
`sbd_has_curriculum_access(target_staff uuid, p_module_id text)` maps module → curriculum
**through the registry** and then looks for the grant row, so `foundations_assignments` —
which carries Foundations *and* Endoscopy (`en-%`) rows — is gated correctly per row with
no `module_id` lists in SQL.

**A module the registry does not know is allowed through.** Same principle as
`registryModules()` falling back to the constants: an unseeded or half-seeded registry must
never silently freeze assignment. The gate closes on modules the registry lists.

**Default is deny — and that is a cliff, so the migration backfills.** Read literally, "a
person without the grant cannot be assigned" means that the moment this ships, no leader can
assign anything to anyone until they have granted, including the Foundations rollout that
runs through `hAssignAllFnd` / `assignAllModules` for every new hire. So §2 of the migration
inserts a grant for every (staff, curriculum) **that already holds an assignment in that
curriculum**, stamped `granted_by = '#1149 backfill'` with the earliest assigned date, and
only then swaps the policies. Nobody mid-curriculum stops; the gate applies to the next
person.

**Revoke deletes the row.** No `state` column, no `revoked` tri-state as in
`preceptor_access`. The gate is on *assigning*, so revoking access does not need to lock a
reader or preserve progress — existing assignments and their progress are untouched, which
is also why deletion is safe. It costs the audit trail of a revoke; the ledger of who
granted and when survives on live rows, which is what the card asks for.

**Who may grant:** `sbd_fi_can_manage_assignments(staff_id)` — exactly the people who can
already write an assignment for that person (master admin, the three SIPS emails,
`system_admin`, and the target's facility leaders). The card says "a leader grants", and a
gate stricter than the action it guards would just push leaders to ask a master admin for
every hire. Reads: own row or `sbd_fi_leader_scope(staff_id)`, matching `prc_access_select`.

**T33/#1144:** the name carries neither the `sbd_` nor the `foundations_` prefix the T33 loop
walks, so the restrictive `sbd_mfa_gate` policy is written out explicitly, exactly as #1148
had to for `curriculum_modules`.

## Blast radius

| Touched | What could break |
|---|---|
| **new** `supabase/migrations/20260911130000_1149_curriculum_access.sql` | table + RLS + `sbd_has_curriculum_access()` + backfill + 3 policy swaps. The policy swaps are the risk: a wrong predicate blocks **all** new assignments for all four curricula. Verified by `supabase/verify/1149_curriculum_access_check.sql` before and after. |
| **new** `src/js/curriculum-access.js` (B7 — no new domain in `ui-views.js`) | helpers + the profile control + the setter. Loaded after `endoscopy.js`, before `ui-views.js`. |
| `src/js/api-supabase.js` | `getCurriculumAccess()` / `upsertCurriculumAccess()` / `deleteCurriculumAccess()`. |
| `src/js/auth-init.js` | one more parallel fetch into `DB.curriculumAccess`. A failure here must degrade to "no grants known", never to a blank portal — same `Promise.race` block as the other 24. |
| `src/js/foundations.js`, `instruments.js`, `scripts-module.js`, `endoscopy.js` | one refusal each, in `assignModule` / `assignInstModule` / `assignScriptsModule` / `assignEndoModule` — the single function every panel in that curriculum routes through — plus the Assign button turning into a "no access" hint in the four leader panels. |
| `src/js/ui-views.js` | **one line** in `renderHProfile`, next to the existing `prcAccessControlHTML` call. |
| `index.html` | new `<script>` tag + `?v=` bumps for the five edited files. |
| `TASKS.md` | T133 entry (the #1146 sync). `ARCHITECTURE.md` §7 + a new §16E. |

Not touched: `preceptor_access` and every preceptor path; the two grant screens; the
registry; the progress guard; staff-side readers.

## Rollback

1. Frontend: revert the commit. The helpers fail open when `DB.curriculumAccess` is
   undefined, so an old bundle against the new table still assigns as before — the server
   gate is what holds.
2. Server, in this order:
   ```sql
   -- restore the three pre-#1149 INSERT policies (verbatim in §5 of the migration)
   drop function if exists public.sbd_has_curriculum_access(uuid, text);
   drop table if exists public.curriculum_access;
   ```
   Dropping the table alone is **not** enough — the policies reference the function.

## Verify

- `supabase/verify/1149_curriculum_access_check.sql` — table + 4 policies exist; a granted
  staffer passes and an ungranted one fails `sbd_has_curriculum_access` for a Foundations,
  an Endoscopy and a Scripts module; an off-registry module id passes (fail-open);
  backfill row count equals the distinct (staff, curriculum) pairs already assigned.
- `node scripts/verify-1149-curriculum-access.js` — the four assign functions each carry the
  refusal, the four panels each carry the hint, `preceptor` is absent from the control's
  curriculum list, and the shipped SQL gates all three assignment tables.
