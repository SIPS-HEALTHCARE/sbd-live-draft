# 2026-08-20: the 26 No Belt records are decisions, not gaps (withdrawn finding)

Status:         **WITHDRAWN the same day it was raised.** Kept rather than deleted
                because the wrong version reached a draft report before it was
                checked, and because the reason it was wrong is worth not
                repeating.

## What was claimed

That 26 placement reviews close with no belt value on them (`tentative_belt`
and `confirmed_belt` both null, status `confirmed` or `adjusted`), that all 26
of those people read `None` in `staff.belt`, and that a genuine No Belt
decision was therefore indistinguishable from a review where no decision was
ever made. The conclusion drawn was that board 144 should be held, because
making No Belt first-class and red would publish an omission in front of every
manager and director.

## Why it is wrong

The claim was built from `placement_reviews` and `staff.belt` without reading
`staff.history`, which is where the decision actually lives. The client's own
144 write-up says so in plain terms, quoting the 13 August EOD: the backfilled
records "each now shows No Belt with the decision and who made it in their
history". That write-up was on the More details tab and had not been read.

Checked properly:

    select count(*) filter (where h->>'belt' = 'None')      as says_none,
           count(*) filter (where h->>'res'  = 'confirmed') as says_confirmed,
           count(*) filter (where h->>'note' <> '')         as has_decider
    from staff s cross join lateral jsonb_array_elements(s.history) h
    where s.belt = 'None';

    26 / 26 / 26

Every one of the 26 carries exactly one history entry, every entry reads
`belt: None, res: confirmed`, and every entry names the decider. Five spellings
of the same assessor note span 12 to 20 August, one of them explicit:
"Placement decision: No Belt, confirmed by J. Jacobs. Placed on the remediation
path."

So all 26 are recorded, attributed decisions, and the 13 August write path is
confirmed working on live data rather than merely believed to be.

## What survives, and it answers a question the item asks

The 144 write-up says of the stored No Belt value: "Do not guess it. Read it,"
and asks for the mid-August count of 13 to be re-read rather than quoted.

Read 2026-08-20. The stored value is the literal string `'None'`. The live
distribution of `staff.belt`:

| Belt | Count |
|---|---|
| White | 66 |
| **None** | **26** |
| Green | 13 |
| Yellow | 10 |
| Brown | 5 |
| Blue | 1 |

26, not 13. That is the number 144 builds against.

## The smaller true thing, split out as T120a

`placement_reviews.confirmed_belt` is null on those 26 rows even though the
decision exists on the staff record. Not user-visible and not a correctness
bug, because the authoritative record is right. It does mean the review table
alone cannot answer what someone was placed at, so anything built to read
belts from `placement_reviews` rather than `staff` will undercount.

## The process lesson

Read the write-up behind an item before reporting a finding against that item.
The answer was already written down.
