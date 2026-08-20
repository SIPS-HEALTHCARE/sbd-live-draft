# 2026-08-20: Placement reviews that carry no belt value (blocks board 144)

Status:         Finding only. Nothing has been changed. Read-only measurement.
Raised because: board 144 (No Belt as a first-class entry, in red, everywhere a
                belt appears) is proposed for 27 August, and this decides what
                that graph would publish.

## What was measured

26 placement reviews carry **no belt value at all**, neither `tentative_belt`
nor `confirmed_belt`, while their review `status` reads `confirmed` (22) or
`adjusted` (4). Every one of those 26 people reads `None` in `staff.belt`.

    select pr.status, count(*),
           count(*) filter (where pr.confirmed_belt is null) as no_belt_value
    from placement_reviews pr group by pr.status;

    adjusted          32 reviews,  4 with no belt value
    closed_no_person   2 reviews,  2 with no belt value
    confirmed         62 reviews, 22 with no belt value
    pending            3 reviews,  3 with no belt value

Level-score averages across the 26 run from 53.8 to 77.8. The earliest sat on
11 August, the most recent on 20 August, so this is current behaviour and not a
historical batch.

## The contrast that shows the path does work

ITionna Bryant sat on 19 August. Her review carries `tentative_belt = White`
and `confirmed_belt = White`, and her staff record reads `White`. Same code
path, same week, correct outcome. So this is not "the confirm path never
writes a belt", it is that a substantial share of confirmed reviews end with
the value absent.

## Why it cannot be resolved from the data

A genuine No Belt outcome and a review where no decision was recorded are
**byte-identical** in this schema. Both are `confirmed` with two null belt
columns and a staff record reading `None`. There is no reviewer stamp to
separate them either: `reviewed_at` is null on all 26, and `confirmed_at`
carries a date at midnight rather than a timestamp.

Ignacio's own 13 August finding is the near neighbour, not the same thing:
that one was a No Belt decision recorded on the assessment but not on the
person's record, and it was corrected and backfilled. These 26 have no
decision recorded in either place.

## Why this blocks 144 rather than following it

144 makes No Belt a first-class, red, sorted-before-White entry across every
distribution graph, bar, list and selector. If some share of these 26 are in
that band by omission rather than by decision, 144 publishes the omission to
every manager, director and system-level user, in red. Ignacio's own caution
on the item is the same shape one layer down: "Keep `system_suggestion` and
`final_belt` apart in anything built here. The same mix-up inside a
distribution graph would be quieter and much harder to spot."

## The question for the client

Are the 26 genuine No Belt decisions whose value was never written, or
sittings where no decision was made? The answer decides three things: whether
144 ships against the data as it stands, whether a backfill is needed first,
and whether the confirm path needs a guard that refuses to close a review with
no belt on it.

## Not proposed here

No backfill, no schema change, no write of any kind. The count and the names
are reproducible from the query above and were taken read-only.
