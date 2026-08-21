-- #718 verification — run BEFORE applying 20260822120000_718_bucket_a_unassessed_correction.sql.
-- (Write-up §7, docs/decisions/2026-08-17-unassessed-entry-state.md on work/unassessed-belt-writeup.)
--
-- Read-only. Every statement is a SELECT; nothing here writes.
--
-- (A) Column defaults the pre-#718 code relied on. The write-up predicts
--     placement_needed defaults true — verify before trusting the bucket split.
select column_name, column_default, is_nullable
from information_schema.columns
where table_name = 'staff'
  and column_name in ('belt', 'placement_needed');

-- (B) Bucket sizes + names.
--     Bucket A ("flagged, no evidence") is corrected by the migration.
--     Bucket B ("unflagged, no evidence") is Iggie's named review list — NOTHING moves it
--     automatically; possibly genuine off-system White, possibly hand-added with the flag cleared.
select s.id, s.first, s.last, s.fid, s.belt, s.since, s.placement_needed,
       case
         when s.placement_needed then 'A: flagged, no evidence'
         else 'B: unflagged, no evidence'
       end as bucket
from staff s
where s.belt = 'White'
  and s.cur_comp is null and s.cur_sim is null and s.cur_obs is null
  and jsonb_array_length(coalesce(s.history, '[]'::jsonb)) = 0
  and not exists (select 1 from placement_reviews pr
                  where pr.staff_id = s.id and pr.confirmed_by is not null)
order by bucket, s.last;

-- (C) The NULL-belt shape left by sbd-reset-test-assessment (separate follow-up; the
--     migration does not touch these).
select count(*) as null_belt_rows from staff where belt is null;

-- After the migration: re-run (B) — expect zero 'A' rows; Bucket B unchanged.
