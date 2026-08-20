# Nikkia Warfield, placement record as it stands before board item 139

Captured 2026-08-20, read-only, because item 139 says "Export the 28.3 result
before removing it". This is that export. Nothing has been changed.

## The record item 139 refers to

There is **no row for her in `sbd_belt_test_results` and none in
`sbd_belt_tests`**. The result the item calls "the 28.3 percent result
currently showing" is a single `placement_reviews` row:

| field | value |
|---|---|
| review id | `f2a6502c-9ba3-4fb7-b237-6772c68fa6a6` |
| session id | `72d4de65-c2ea-4dd4-b146-c43628464855` |
| type | Initial |
| status | **pending** (never reviewed, never confirmed) |
| tentative_belt | White |
| confirmed_belt | null |
| level_scores | L1 39, L2 33, L3 33, L4 22, L5 17 |
| staff_title | SPD Technician I |
| created_at / submitted_at | 2026-08-14 23:00:00.080013+00 |
| reviewed_at / confirmed_at | null / null |
| review_notes / assessor_note | null / null |
| answers stored on the review | 0 |

Straight average of the five level scores is 28.8.

## Her staff record as it stands

`belt` = White. `cur_comp`, `cur_sim`, `cur_obs` all null. `history` empty.

## The sitting behind it

One session, `72d4de65-c2ea-4dd4-b146-c43628464855`, type `placement`,
status `completed`.

- authorized / created 2026-08-14 21:10:35
- last answer saved 2026-08-14 21:47:01.556
- session expiry 2026-08-14 22:40:35, so 53 minutes 34 seconds were unused
- closed out 2026-08-14 23:00:00 by the recovery sweep, 20 minutes after expiry
- 25 answers saved in the session progress, at question 25

Her account was switched off with `banned_until` set roughly 100 years out and
her portal row inactive. Both still hold as of this capture, so she cannot sit
anything until it is switched back on.

## Why this matters to how 139 is built

The item is written as replacing a completed assessment. There is no completed
assessment to replace. The work is finishing a review that was never closed,
and the 34 responses named on the item come from the recording of the second
sitting, not from this session, which holds 25.

Question raised with the client on the item: finish this 14 August review in
place, or enter the corrected result as its own record dated to the second
sitting. Nothing is entered until that comes back.
