-- T29a: the two approved-beside-pending pairs T29 deliberately left standing.
--
-- T29 collapsed duplicates only within a status and stopped at these two, because merging a
-- pending row into an approved one would have erased somebody's decision to guess at a
-- question. Both are now answered, and each for a different reason, so they are handled
-- separately rather than by one rule.
--
-- Jake Jacobs, Yellow Competency.
--   Jake is on the Free Agent facility and the client has already identified him as an
--   active test account, which is the same fact T31 was written around. His pair is test
--   traffic, not a question about how the programme runs.
--
-- Jody Mays, Yellow Competency. Boston Children's, Shift Supervisor, a real candidate.
--   Her history, read in order:
--     25 Jun to 15 Jul   repeated Competency requests, all superseded by T29
--     15 Jul             one request approved, resolved_at still null
--     16 Jul             one more request raised, the day after the approval
--   The approval was never acted on. `resolved_at` is null and her belt is still White, so
--   no assessment followed it. The 16 July request is therefore the same person asking again
--   because nothing moved, not a second attempt at a gate she had already sat. It is a
--   repeat of a request that is still open, so it collapses like any other repeat.
--
-- Nothing is hidden by this. The admin queue screen buckets `status = 'approved'` into
-- adminQueue alongside the unrequested items, so Jody's approved Competency stays visible
-- and actionable. That was checked in the view before writing this, not assumed.
--
-- The real finding underneath Jody's row is not the duplicate. It is that a real candidate
-- at a client facility was approved for her Yellow Competency assessment on 15 July and
-- nothing has happened since. That is recorded as T61 rather than being quietly tidied away
-- along with the duplicate.

update public.sbd_assessment_queue q
   set status      = 'superseded',
       resolved_at = now(),
       notes       = trim(both E'\n' from coalesce(q.notes,'') || E'\n' ||
                     'Superseded 2026-07-27 (T29a): duplicates an approved request for the same belt and gate '
                     || 'that is still open. The approved row remains the live one.')
 where q.status = 'pending'
   and exists (
     select 1 from public.sbd_assessment_queue a
      where a.staff_id        = q.staff_id
        and a.target_belt     = q.target_belt
        and a.assessment_type = q.assessment_type
        and a.status          = 'approved'
        and a.resolved_at is null
   );
