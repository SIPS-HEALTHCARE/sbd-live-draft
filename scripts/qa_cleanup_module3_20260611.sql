-- Module 3 QA test-record cleanup (QA run 2026-06-08, live prod).
-- Source: plans/SBD_QA_Staff_Report_2026-06-08 (1).docx — "Cleanup needed" section.
--
-- HOW TO USE: run the PREVIEW selects first in the Supabase SQL editor and eyeball
-- every row. Only then uncomment the DELETE/UPDATE statements one at a time.
-- Nothing here is reachable through the UI (the orphan is invisible due to M5-01
-- on the Jun 1 build).

-- ────────────────────────────────────────────────────────────────────────────
-- PREVIEW 1: bulk-upload leftovers at Alta Bates — Test Staff 4 (x2), Test Staff 5 (x1)
-- ────────────────────────────────────────────────────────────────────────────
select s.id, s.first, s.last, s.belt, s.role, s.since, s.created_at, f.name as facility
from public.staff s
left join public.facilities f on f.id = s.fid
where s.first ilike 'Test' and s.last ilike 'Staff%'
order by s.created_at;

-- ────────────────────────────────────────────────────────────────────────────
-- PREVIEW 2: the orphaned Test Staff 5 (STAFF-F6 / M5-02 — fid stripped, invisible)
-- ────────────────────────────────────────────────────────────────────────────
select id, first, last, belt, role, since, created_at
from public.staff
where fid is null;

-- ────────────────────────────────────────────────────────────────────────────
-- PREVIEW 3: any free_agents row the old edge fn created for Test Staff 5 on Jun 8
-- (it wrote to free_agents; it was only invisible because the Jun 1 frontend read
-- sbd_free_agents — M5-01)
-- ────────────────────────────────────────────────────────────────────────────
select id, staff_id, first, last, belt, from_fac_name, released_at
from public.free_agents
where first ilike 'Test' or last ilike 'Staff%';

-- ────────────────────────────────────────────────────────────────────────────
-- DELETES — uncomment ONLY after confirming the preview rows are exactly the
-- QA test records (names Test Staff 4 / Test Staff 5, created 2026-06-08).
-- Replace the <uuid> placeholders with ids from the previews; id-based deletes
-- are safer than name-based ones.
-- ────────────────────────────────────────────────────────────────────────────

-- 1) Bulk-upload rows at Alta Bates + the orphaned record:
-- delete from public.staff where id in ('<uuid-test-staff-4-a>', '<uuid-test-staff-4-b>', '<uuid-test-staff-5>');
-- delete from public.staff where id = '<uuid-orphaned-test-staff-5>';  -- the fid IS NULL row

-- 2) Stray free_agents row from the Jun 8 release test (if PREVIEW 3 returned one):
-- delete from public.free_agents where id = '<uuid-free-agent-row>';

-- 3) OPTIONAL (confirm with SIPS first): revert the STAFF-08 belt override on the
--    real Test Staff 4 profile if it should go back to White:
-- update public.staff set belt = 'White' where id = '<uuid>';

-- ────────────────────────────────────────────────────────────────────────────
-- VERIFY: re-run PREVIEW 1-3; all should return zero QA test rows.
-- ────────────────────────────────────────────────────────────────────────────
