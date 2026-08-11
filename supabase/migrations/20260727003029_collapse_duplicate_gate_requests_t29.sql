-- T29: one open gate request per person, per belt, per gate.
--
-- 27 open rows stand for 6 real decisions. The worst case is one person with 11 pending
-- copies of the same Yellow Competency request, first asked 25 June and re-asked until
-- 16 July. Whoever works this queue is reading the same request over and over.
--
-- The cause is `submitApply` in ui-views.js, which inserts with no duplicate check at all.
-- The other submit path, in the study view, does check, but only against the copy of the
-- queue held in the browser, so it cannot see a row that RLS filtered out or that another
-- device created. A database constraint is the only place this can actually be settled, so
-- that is where it is settled, with the browser check kept as the thing that produces a
-- friendly message instead of an error.
--
-- Where this stops short, deliberately:
--
-- Two people have an `approved` row and a `pending` row for the same belt and gate at once.
-- Jake Jacobs: 6 approved and 3 pending on Yellow Competency. Jody Mays: 1 approved on
-- 15 July and 11 pending spanning 25 June to 16 July, so some of the pending ones were
-- raised after the approval.
--
-- Whether a pending request raised after an approval is a duplicate or a genuine second
-- attempt is a question about how the programme works, not a data-cleaning question.
-- Collapsing across statuses would erase somebody's decision to guess at it. So this
-- migration never merges a pending row into an approved one or the other way round: it
-- collapses only within the same status, and the pending-beside-approved pairs are left
-- standing for a human to decide.
--
-- Nothing is deleted. The older copies become `superseded`, which takes them out of the
-- queue while keeping the history of how often somebody asked. That is worth keeping: eleven
-- requests in three weeks says something about the person's experience of this feature.
--
-- Expected effect: 27 open rows to 8, with 19 marked superseded and no decision touched.

-- 1. Collapse. Keep the newest row in each (person, belt, gate, status) group.
with ranked as (
  select id,
         row_number() over (
           partition by staff_id, target_belt, assessment_type, status
           order by requested_at desc, id desc
         ) as rn
    from public.sbd_assessment_queue
   where status in ('pending','approved')
)
update public.sbd_assessment_queue q
   set status      = 'superseded',
       resolved_at = now(),
       notes       = trim(both E'\n' from coalesce(q.notes,'') || E'\n' ||
                     'Superseded 2026-07-27 by the most recent request for the same belt and gate (T29). '
                     || 'Kept rather than deleted so the number of times this was asked is not lost.')
  from ranked r
 where q.id = r.id
   and r.rn > 1;

-- 2. Make it impossible to stack another one. Only `pending` is constrained: a pending row
--    sitting beside an approved one is the open question above, and a constraint spanning
--    both statuses would force an answer to it.
drop index if exists sbd_assessment_queue_one_open_request;

create unique index sbd_assessment_queue_one_open_request
  on public.sbd_assessment_queue (staff_id, target_belt, assessment_type)
  where status = 'pending';

comment on index public.sbd_assessment_queue_one_open_request is
  'T29: one pending gate request per person, per belt, per gate. The browser checks first so the candidate gets a message rather than an error, but this is what actually holds, across devices and regardless of which submit path is used.';
