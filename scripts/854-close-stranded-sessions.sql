-- 854-close-stranded-sessions.sql
-- #854 close-out: 22 sessions sit at status 'active' long past expiry, and
-- sbd_recover_placements can never take any of them — each fails at least one of the job's
-- own selection rules (30-day cutoff, person-level dedupe, no-answers guard, no questions,
-- not a placement, or the staff row is gone). Checked person by person on the card: nobody
-- is missing a result. This closes EXACTLY the unreachable ones, as 'expired' — the same
-- status sbd-assessor-pin stamps on expiry — and leaves anything the job can still
-- legitimately recover alone. The 30-day cutoff and the person dedupe are treated as
-- deliberate and are NOT worked around here.
--
-- Staff-row-deleted sessions additionally get a sbd_placement_recovery_log row (reason
-- 'staff_missing') so the deletion leaves a trace; migration 20260826120000 makes the job
-- itself do the same for any new ones. The log insert is dedup-guarded, so running this
-- before or after that migration's sweep double-logs nothing.
--
-- Wrapped in a transaction; read the verification output, then COMMIT or ROLLBACK.

begin;

-- 1. Trace the orphans first, while they are still 'active' (same shape the patched job writes).
insert into sbd_placement_recovery_log (session_id, staff_id, staff_name, tentative_belt, n_knowledge, n_sim, detail)
select s.id, s.staff_id, 'Unknown (staff row deleted)', null,
       (select count(*) from jsonb_array_elements(coalesce(s.progress->'shuffledQuestions','[]'::jsonb)) q where (q->>'type')='knowledge'),
       (select count(*) from jsonb_array_elements(coalesce(s.progress->'shuffledQuestions','[]'::jsonb)) q where (q->>'type')='simulation'),
       jsonb_build_object('source','854-close-stranded-sessions','reason','staff_missing')
from sbd_assessment_sessions s
where s.status = 'active'
  and s.assessment_type = 'placement'
  and s.expires_at < now() - interval '15 minutes'
  and s.staff_id is not null
  and not exists (select 1 from staff st where st.id = s.staff_id)
  and not exists (select 1 from sbd_placement_recovery_log l where l.session_id = s.id);

-- 2. Close every expired-but-still-'active' session the recovery job can never reach.
-- Each disjunct is the negation of one predicate in the job's own selection block.
with closed as (
  update sbd_assessment_sessions s
     set status = 'expired'
   where s.status = 'active'
     and s.expires_at < now() - interval '15 minutes'
     and (
          s.staff_id is null
       or s.assessment_type is distinct from 'placement'
       or not exists (select 1 from staff st where st.id = s.staff_id)
       or s.expires_at <= now() - interval '30 days'
       or jsonb_array_length(coalesce(s.progress->'shuffledQuestions','[]'::jsonb)) = 0
       or (select count(*) from jsonb_object_keys(coalesce(s.progress->'answers','{}'::jsonb))) = 0
       or exists (select 1 from placement_reviews pr where pr.staff_id = s.staff_id)
     )
  returning s.id, s.staff_id, s.assessment_type, s.expires_at, s.progress
)
select c.expires_at::date as expired,
       coalesce(nullif(trim(coalesce(st.first,'') || ' ' || coalesce(st.last,'')), ''),
                '(staff row deleted)') as who,
       (select count(*) from jsonb_object_keys(coalesce(c.progress->'answers','{}'::jsonb))) as answers,
       case
         when c.staff_id is null then 'no staff_id'
         when st.id is null then 'staff row deleted (logged above)'
         when c.assessment_type is distinct from 'placement' then 'not a placement'
         when jsonb_array_length(coalesce(c.progress->'shuffledQuestions','[]'::jsonb)) = 0 then 'no questions'
         when (select count(*) from jsonb_object_keys(coalesce(c.progress->'answers','{}'::jsonb))) = 0 then 'no answers (job never finalizes an untouched session)'
         when exists (select 1 from placement_reviews pr where pr.staff_id = c.staff_id) then 'person already has a placement review (dedupe)'
         else 'past the 30-day recovery window'
       end as why_unreachable
from closed c
left join staff st on st.id = c.staff_id
order by c.expires_at desc;

-- 3. What stays 'active' past expiry: only sessions the job CAN still take (expect these to
-- drain via the normal cron runs; anything real-time, not yet expired, is untouched anyway).
select s.id, s.expires_at,
       (select count(*) from jsonb_object_keys(coalesce(s.progress->'answers','{}'::jsonb))) as answers
from sbd_assessment_sessions s
where s.status = 'active'
  and s.expires_at < now() - interval '15 minutes'
order by s.expires_at desc;

-- COMMIT;   -- run when the output above is right (expect 22 closed, list 3 empty)
-- ROLLBACK; -- otherwise
