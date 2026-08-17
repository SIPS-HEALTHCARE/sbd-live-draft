# Endoscopy Modules — Module List, Gates, and Content Request

**Date:** 2026-08-18 · **Status:** For Iggie — forward to Dr. Jake · **Origin:** Iggie brief 2026-08-13, Priority 3 (T108)

Everything from here to the appendix is the client-facing request. The `.html` sibling of this
file is the copy to send. The appendix at the bottom is internal build notes and stays here.

---

## What this is

You asked for three things so Dr. Jake can start writing: the module list, how each module is
gated, and an exact statement of what content is needed and in what format. This is all three.

The one date that matters: **content in hand by Thursday 21 August holds the Friday 28 August
live date.** Every day it lands after the 21st moves the live date by the same number of days.
Modules can arrive one at a time — sending Module 1 first lets us confirm the format on real
material while the rest are still being written.

## 1. How endoscopy works on the platform

**Assignment only, by name.** A leader assigns each endoscopy module to a named person. There is
no belt trigger, no facility-wide rollout, and it is not part of the new-hire onboarding bundle.
Someone who is never assigned a module never sees it. This is true in the first release because
assignment *is* the mechanism, not a feature added on top: it is the same leader-assignment
machinery that already runs Foundations, Instruments, and Preceptor today. No new architecture.

This is also the clean version of the belt-triggered / leader-assigned split you raised: belt
continues to trigger the belt curriculum; endoscopy is the first content that exists *only* on
the assigned side.

**Once assigned, each module has the standard three gates** (identical mechanics to Foundations):

| Gate | What it is | Pass rule |
|---|---|---|
| 1 · Knowledge | 10 questions drawn at random from the module's bank of 25 | ≥80%, three passing attempts |
| 2 · Simulation | 10 scenario questions drawn from the module's bank of 25 | ≥80%, three passing attempts |
| 3 · Observation | Leader confirms each checklist item in person | Unlocks after Gates 1 and 2; every item confirmed |

A module is complete when all three gates are passed. Because each attempt draws a fresh random
10 from the bank, the three attempts are not the same test three times.

## 2. Proposed module list

Five modules following the reprocessing flow. Dr. Jake owns the titles, the split, and the count —
this is a starting structure, not a constraint. The only cost of changing the count: every module,
however many there are, needs the full content set in section 3.

| # | Working title | Covers |
|---|---|---|
| 1 | Endoscope Fundamentals | Scope types and anatomy, channels and elevators, why flexible scopes are the highest-risk devices in reprocessing, Spaulding classification, IFU as the governing document |
| 2 | Point-of-Use Treatment & Transport | Bedside precleaning, transport containment and labeling, time limits and delayed-reprocessing rules |
| 3 | Leak Testing & Manual Cleaning | Leak test methods (dry/wet, automated), brushing and flushing all channels, cleaning verification, visual inspection incl. borescope |
| 4 | High-Level Disinfection & AER Operation | HLD agents and their handling, MEC testing, AER loading and cycle verification, manual HLD, rinsing |
| 5 | Drying, Storage & Documentation | Drying (incl. forced-air), hang time and storage cabinets, traceability from patient to scope to cycle, quality monitoring and audit trail |

One overlap to be aware of: Foundations Module 8 (HLD) already gives every technician a one-module
overview of this territory — HLD vs. sterilization, endoscope anatomy, leak testing, AER operation,
storage. These five are the working-depth version for people who actually reprocess scopes.
Dr. Jake's call whether they assume Module 8 or stand fully self-contained; self-contained is
safer since not every assigned person will have Foundations behind them.

## 3. Exactly what content each module needs, and in what format

Four things per module. A, the reader, converts into the platform automatically if the format
below is followed — it is the same format as the ten Foundations documents from 4 August, so
this is the format Dr. Jake has already written in once.

**A. Reader document — one Word (.docx) file per module.**

- Filename: `SIPS_Endoscopy_Module1_Fundamentals.docx` (and so on — the `ModuleN_` part matters).
- Each numbered section starts with a **Heading 1** styled paragraph numbered `1.1`, `1.2`, …
  Each Heading 1 becomes one readable section on screen.
- Subheadings use **Heading 2** and **Heading 3** styles.
- Bullet points as real Word lists (not typed dashes).
- Tabular information as real multi-column Word tables — these render as tables on screen.
- Callout boxes: a **single-cell table** whose text starts with one of three symbols, which sets
  the color and is then removed: `⚠` warning (red), `💡` tip / SBD standard (green), `📚` key
  point (blue).

**B. Knowledge question bank — 25 multiple-choice questions per module.** Four options each, correct
answer marked. 25 matches the Foundations standard; if time is short, 15 by the 21st is workable
and the rest can follow after go-live.

**C. Simulation bank — 25 scenario questions per module.** A short workplace situation, four
possible responses, the best response marked. Same 15-now-10-later fallback as B.

**D. Observation checklist — 5 to 7 items per module.** Each item one observable statement a
leader can confirm by watching the person work, e.g. "Performs a leak test per the scope's IFU
before manual cleaning." These are the Gate 3 items.

B, C, and D can sit at the end of each module's Word document or arrive as a separate document or
spreadsheet — whatever is easiest to write, as long as each is clearly labeled with its module,
questions are numbered, and the correct answer is marked.

If any module should carry video: send links or embed codes only — hosting stays on your side, as
agreed previously. The platform surface for embedding is a separate piece of work and not required
for the 28 August release.

## 4. Dates, restated

- **Thu 21 Aug** — content in hand (Module 1 earlier if possible, as a format check).
- **Fri 28 Aug** — endoscopy live: a leader assigns a module to a named person, that person sees
  it and works the gates, nobody unassigned sees anything.
- Content after the 21st moves the live date day for day.

---

## Appendix — internal build notes (not for sending)

- **Assignment mechanism:** ride the existing pattern. Per the T92 Scripts decision
  (`docs/decisions/2026-08-06-t92-scripts-standalone-module.md`), `foundations_assignments.module_id`
  is free text with no FK/CHECK and `UNIQUE(staff_id, module_id)`, correct RLS already in place —
  `module_id='en-01'…'en-05'` rows are the zero-migration path. Note the TASKS.md T92a entry
  ("fourth table of the same shape") contradicts the shipped design; §16B of ARCHITECTURE.md and
  `src/js/scripts-module.js` confirm reuse won, so follow reuse.
- **Two traps inherited from §16B:** (1) `getFoundationsAssignments()` filters `'scripts'` out so
  the N/10 Foundations count stays right — `en-*` rows need the same filter. (2) `assignAllModules()`
  iterates `FOUNDATIONS_MODULES`; endoscopy modules must NOT go into that array or the onboarding
  "All 10" button becomes exactly the facility-wide trigger T108's done-when forbids. Endoscopy
  gets its own content constant (e.g. `ENDOSCOPY_MODULES` in a new `src/js/endoscopy.js`, reusing
  the foundations 3-gate helpers the way `instruments.js` does).
- **Content ingestion:** extend `scripts/foundations-from-docx.py` (it currently hard-exits unless
  exactly 10 `Module(\d+)_` files are present — needs a target-set flag). Question/sim banks and
  observation checklists are hand-authored into the constant, never converter-written, same as
  Foundations.
- **Who can assign:** enforcement is `sbd_fi_can_manage_assignments()` — master admin, the three
  SIPS emails, `system_admin`, and facility leaders via `sbd_leads_facility_of()`. `staff_admin`
  and plain staff are blocked (task #55). This already implements "leader assigns by name."
- **Unassigned visibility:** Foundations renders unassigned modules "visible but locked."
  T108's done-when says nobody unassigned sees endoscopy — so the endoscopy surface renders only
  for staff holding at least one `en-*` assignment (and for leaders/admins on the assign side).
- **Brief bookkeeping:** the 13 Aug brief's Priority 1 is recorded nowhere in TASKS.md (T92a=P2,
  T108=P3, T109=P4, T110=P5) — worth asking Iggie what Priority 1 was.
