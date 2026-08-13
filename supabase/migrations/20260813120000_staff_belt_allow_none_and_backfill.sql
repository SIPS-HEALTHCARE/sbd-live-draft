-- T106 follow-up: No Belt approvals half-fail because prod staff_belt_check predates the
-- 'None' sentinel. The placement_reviews PATCH succeeds but the staff PATCH sending
-- belt='None' is rejected 23514, silently losing belt / placement_needed / the Placement
-- history entry. Ten staff are in that half-written state as of 2026-08-13.
--
-- Part 1: widen the constraint so staff.belt can hold 'None' (the unbelted /
-- remediation-path state shipped in PR #197).
alter table public.staff drop constraint if exists staff_belt_check;
alter table public.staff add constraint staff_belt_check
  check (belt = any (array['None','White','Yellow','Green','Blue','Brown','Black']));

-- Part 2: backfill the staff rows whose No Belt decision only landed on placement_reviews.
-- A No Belt decision is identified by confirmed_by set + confirmed_belt null (confirmed_belt
-- stays NULL by design for No Belt — do NOT change that). Idempotent: skips anyone who
-- already carries a Placement history entry. If a staffer somehow has several such reviews,
-- the most recent decision wins.
update public.staff s
set belt = 'None',
    placement_needed = false,
    history = jsonb_build_array(jsonb_build_object(
        'dt',   left(pr.confirmed_at::text, 10),
        'type', 'Placement',
        'belt', 'None',
        'res',  'confirmed',
        'note', coalesce(nullif(pr.assessor_note, ''),
                'Placement decision: No Belt, confirmed by ' || pr.confirmed_by ||
                '. Placed on the remediation path.')
      )) || coalesce(s.history, '[]'::jsonb)
from (
  select distinct on (staff_id) staff_id, confirmed_at, confirmed_by, assessor_note
  from public.placement_reviews
  where confirmed_by is not null
    and confirmed_belt is null
  order by staff_id, confirmed_at desc
) pr
where pr.staff_id = s.id
  and not exists (
    select 1
    from jsonb_array_elements(coalesce(s.history, '[]'::jsonb)) h
    where h->>'type' = 'Placement'
  );

-- Verify (read-only, run after applying):
--   select count(*) filter (where belt = 'None') from staff;              -- expect 10
--   select pr.staff_name, s.belt,
--          (select count(*) from jsonb_array_elements(coalesce(s.history,'[]'::jsonb)) h
--            where h->>'type' = 'Placement') as placement_entries
--   from placement_reviews pr join staff s on s.id = pr.staff_id
--   where pr.confirmed_by is not null and pr.confirmed_belt is null;      -- belt='None', 1 entry each
