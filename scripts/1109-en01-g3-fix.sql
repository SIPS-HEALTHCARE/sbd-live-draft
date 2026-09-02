-- 1109-en01-g3-fix.sql
-- #1109 (ledger T108 / #720 data follow-up): Jake Jacobs' first endoscopy chapter
-- can never complete. One UPDATE, service role, no DDL, no code change.
--
-- SITUATION (prod, read 2026-09-03): staff c280aa16 holds all 14 en- chapters.
-- en-01 was assigned 2026-08-28, before #1073 turned endoscopy into chapters, and
-- still carries the old seed g3 = {"status":"open","items":[]}. en-02..en-13 were
-- assigned 2026-09-02 by the new code, whose _endoNewProgress() (endoscopy.js)
-- seeds a reading chapter's g3 as an explicit not-applicable pass, because a
-- chapter carries no observation list and there is nothing to confirm. en-14 is
-- the capstone that owns the 28 competency items; its g3 is open and MUST stay so.
--
-- WHY NO SCREEN CAN FIX IT: the leader panel renders "nothing to confirm here"
-- for a reading chapter, so the only g3 writer never renders for en-01. complete
-- is server-derived from all three gates (sbd_fi_progress_guard, #720 body), so
-- when chapter 1's question bank lands and Jake passes it, en-01 stays false and
-- its assignment sits at 'assigned' forever while en-02..en-13 complete.
--
-- FIX: set g3 to the exact shape the new code seeds, on every en- row except the
-- capstone whose g3 is not already pass. Today that is exactly one row. Runs as
-- service role (auth.uid() null) so the guard's actor branch is skipped, no g1/g2
-- is touched, the revoke cascade sees no unconfirmed items (items is []), and
-- `complete` is recomputed on the way through: g1 is still open, so it stays
-- false and trg_fi_fnd_prog_status_sync leaves the assignment at 'assigned'.
-- Same mechanics as the #720 §2 backfill.
--
-- SAFE TO RE-RUN: the WHERE excludes rows already at pass, so a second run
-- updates 0 rows.
-- ROLLBACK (only the row(s) this touched):
--   update public.foundations_progress set g3 = '{"status":"open","items":[]}'
--    where module_id like 'en-%' and module_id <> 'en-14' and (g3->>'na') = 'true'
--      and staff_id = 'c280aa16-7f97-40f1-8b7c-c2822463b5ed' and module_id = 'en-01';
--
-- APPLIED TO PROD 2026-09-03 (2026-09-02 21:09:05 UTC) via the RUN line below.
-- RETURNING: c280aa16-7f97-40f1-8b7c-c2822463b5ed | en-01 | g1 open | g2 pass |
--   g3 {"na":true,"items":[],"score":100,"status":"pass"} | complete false.
-- Post-checks: non-capstone en- rows with g3 not pass = 0; en-14 g3 still
-- {"items":[],"status":"open"}; en-01 assignment still 'assigned'; re-run would
-- update 0 rows.
--
-- RUN: source .env.local && supabase db query --linked -o table -f scripts/1109-en01-g3-fix.sql
-- (Management API, one atomic call; the RETURNING rows are the last result set.)
--
-- PRE-CHECK (read-only, expected 1):
--   select count(*) from public.foundations_progress
--    where module_id like 'en-%' and module_id <> 'en-14'
--      and (g3->>'status') is distinct from 'pass';
--
-- POST-CHECKS (read-only):
--   1. select count(*) from public.foundations_progress
--       where module_id like 'en-%' and module_id <> 'en-14'
--         and (g3->>'status') is distinct from 'pass';                  -- 0
--   2. select g3 from public.foundations_progress where module_id = 'en-14'
--       and staff_id = 'c280aa16-7f97-40f1-8b7c-c2822463b5ed';            -- still {"items":[],"status":"open"}
--   3. select p.complete, a.status from public.foundations_progress p
--       join public.foundations_assignments a using (staff_id, module_id)
--      where p.module_id = 'en-01'
--        and p.staff_id = 'c280aa16-7f97-40f1-8b7c-c2822463b5ed';         -- false, 'assigned'

begin;

update public.foundations_progress
   set g3 = '{"status":"pass","score":100,"items":[],"na":true}'::jsonb
 where module_id like 'en-%'
   and module_id <> 'en-14'
   and (g3->>'status') is distinct from 'pass'
returning staff_id, module_id, g1->>'status' as g1, g2->>'status' as g2, g3, complete, updated_at;

commit;
