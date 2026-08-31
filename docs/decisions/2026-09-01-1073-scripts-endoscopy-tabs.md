# 2026-09-01 — #1073: Scripts and Endoscopy as their own leader tabs; endoscopy split into 14 chapter modules

**Ledger:** #1073 (follows T108 / #720)
**Status:** built, pending client answers on two content questions (§Open questions)

## Problem

Two things, from the client on 31 Aug (via Sriman):

1. Scripts and Endoscopy are both assigned from one column each inside the Foundations
   Training table (`renderHTraining`, foundations.js). The client does not want to enter
   Foundations to assign either. He wants each to be a side-panel tab of its own, the way
   SBD Foundations and SBD Instruments already are.
2. Endoscopy is one module (`en-01`) holding 14 reading sections and a single 18-question
   final assessment. He wants **14 modules, one per chapter of the manual**, each assignable
   by name and each with its own questions.

Assignment stays by name only — no belt trigger, no facility-wide rollout. #720's completion
fix must cover every endoscopy module id.

## What the source documents actually contain

Read in full before deciding (`plans/…Self_Study_Manual (1).docx`,
`plans/…Preceptor_Guide (1).docx`, `plans/endoscopy-build-brief.txt`):

- The Self-Study Manual has **thirteen** chapters (1 Why It Matters … 13 Troubleshooting),
  then Final Assessment, Answer Key, Quick Reference, completion sign-off. There is no
  fourteenth chapter. The app's current 14th section is the Quick Reference, which
  `scripts/endoscopy-from-docx.py` appended.
- The Preceptor Guide's own **module 13 is "REVIEW & COMPETENCY VERIFICATION"**, not
  Troubleshooting. Its 28-item competency list sits once, at the bottom, after every module.
- **No per-chapter question bank exists in either document.** The manual's 49 KNOWLEDGE CHECK
  items are self-attestation (`☐ I understand that…`) and cannot be scored. The Preceptor
  Guide's 24 `ASK:`/`WAIT FOR:` pairs are oral prompts, 0–2 per chapter, and chapter 9
  (Rinsing) has none.

## Options

1. **14 chapter modules, empty banks throughout.** Retires the whole-manual assessment and
   the 28 competency items. Nothing invented — but nothing completes either, and a working
   certification path is thrown away for no gain.
2. **14 chapter modules, existing items distributed by topic.** Route the 18 questions and 28
   observations to the chapter each plainly tests. Some modules become completable today, but
   the allocation is our judgement, contradicts how both documents organise the material
   (competency verification is one sit-down, not thirteen), and the client's incoming banks
   may duplicate or contradict it.
3. **13 chapter modules + the capstone the Preceptor Guide already defines.** ← chosen

## Choice + why

`en-01`…`en-13` are the thirteen manual chapters, one module each, content verbatim, each with
its own Knowledge gate awaiting the client's bank. `en-14` is **Review & Competency
Verification** — the capstone, carrying today's 18-item Final Assessment (14 auto-scored + 4
leader-marked) and the 28-item competency list unchanged.

That is fourteen modules made of the client's own material, in the shape both his documents
already use. Nothing is reallocated by our judgement, the existing certification path keeps
working from day one, and each chapter's gate switches on the moment a bank lands in
`ENDO_CHAPTER_QUESTIONS[i]` — no other code change anywhere.

Two supporting decisions:

- **Chapter modules carry no observation list.** Competency verification is one hands-on
  sit-down over the whole workflow; thirteen copies of it is not what the guide describes.
  `_endoNewProgress()` therefore seeds `g3` as an explicit `na:true` pass for a module with no
  observations, so completion reduces to Knowledge alone. This survives the write:
  `sbd_fi_progress_guard` resets `g3` on INSERT only when the actor is **not** a leader
  (`20260901120000`, line `if not is_leader then new.g3 := …`), and #1073 is leader-assign-only.
  Same shape and same reasoning as #720 having the server force `g2`.
- **A chapter with no bank renders a "questions being finalised" panel and no Submit button.**
  A zero-question quiz would otherwise submit and "pass" 0 of 0.

## Blast radius

| File | Change |
|---|---|
| `src/js/endoscopy.js` | content lifted into `ENDO_SECTIONS` / `ENDO_SECTION_CONTENT` / `ENDO_FINAL_QUESTIONS` / `ENDO_COMPETENCY_ITEMS` / `ENDO_WRITTEN_ANSWERS`; `ENDOSCOPY_MODULES` derived from them; `endoHasQuiz`/`endoHasObs`/`_endoNewProgress` added; `endoscopyCellHTML` **replaced** by `renderHEndoscopy()` |
| `src/js/scripts-module.js` | `renderHScripts()` added; `scriptsCellHTML` kept, now rendered inside that tab |
| `src/js/foundations.js` | Scripts + Endoscopy columns removed from `renderHTraining` |
| `index.html` | 4 nav items, 4 view containers, `?v=` bumps (foundations 22, scripts-module 4, endoscopy 2, ui-views 226) |
| `src/js/ui-views.js` | 4 view ids added to the hide-sweeps and dispatch maps |
| `scripts/verify-endoscopy-module.js` | retargeted at the capstone; §12–14 added (79 assertions) |

**No migration, no edge function, no schema change.** Module ids keep the `en-` prefix, so
`getFoundationsAssignments()`'s filter and #720's `module_id like 'en-%'` guard already cover
`en-02`…`en-14`.

**What could break:** the staff-facing `s-endoscopy` view now lists up to 14 cards instead of
1 — it already iterated, so this is volume, not shape. `hEndoStaffDetail` renders into
`h-endoscopy`/`a-endoscopy` instead of the Foundations container; any bookmark into the old
container shows Foundations, which is correct.

**Live data:** one `en-01` assignment exists in production (J. Jacobs, 2026-08-28, `g1` open,
`g3` open, 0 confirmed items). Under the new numbering it reads as chapter 1. Zero progress is
lost. Unassign it from the Endoscopy tab rather than shipping a delete migration for one row.

## Rollback

Frontend-only: revert the five source files and drop the `?v=` bumps. No database state
changes, so nothing to undo server-side. Assignments written against `en-02`…`en-14` would
become orphaned ids in `foundations_assignments` — harmless (the column is free text and
`getFoundationsAssignments()` filters `en-` out), but they would need deleting to keep the
Endoscopy tab's counters honest.

## Open questions (client)

1. **The manual has 13 chapters, not 14.** Confirm 13 chapters + capstone is the fourteen he
   means, or say which chapter he intends to split. Relabel, not a rebuild, either way.
2. **Per-chapter question banks.** How many items per chapter, and of what type? Only
   True/False and fill-in-the-blank auto-score today; short answer is leader-marked (D1,
   2026-08-28). Until they arrive, 13 of 14 modules are reading-only.
3. **Scripts question bank** — separate card, per the ticket.
