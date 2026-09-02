-- #718 Bucket A correction: hand-added staff recorded as White Belt with zero evidence
-- and still flagged for a placement they never took. These rows are the Add Staff form's
-- own output (White preselected + placement_needed defaulted true), not decisions.
--
-- ⚠️ Apply ONLY after:
--   1. supabase/verify/unassessed_entry_check.sql has been run and the Bucket A/B lists
--      reviewed with Iggie (Bucket B — unflagged, no evidence — is his call; this
--      migration deliberately never touches it).
--   2. The frontend + edge functions from this branch are deployed, or the form will
--      keep refilling Bucket A.
--
-- Effect per corrected person: belt White → None ("Not Yet Certified"), earn date
-- cleared, −100 unearned points, the fake Yellow assessment window disappears, and they
-- remain exactly once in the placement queue (placement_needed stays true). Facility
-- belt averages and certified counts will visibly drop — Iggie decides the comms (Q4).
--
-- Criteria mirror the verification query exactly: no gate results, empty history, no
-- confirmed placement review. Evidence of any kind (Bucket C) excludes the row.

begin;

update staff s
set belt = 'None',
    since = null
where s.belt = 'White'
  and s.placement_needed = true
  and s.cur_comp is null and s.cur_sim is null and s.cur_obs is null
  and jsonb_array_length(coalesce(s.history, '[]'::jsonb)) = 0
  and not exists (select 1 from placement_reviews pr
                  where pr.staff_id = s.id and pr.confirmed_by is not null);

commit;
