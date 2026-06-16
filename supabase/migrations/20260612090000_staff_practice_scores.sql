-- ASS-F1 (Module 4 QA, 2026-06-11): practice scores were memory-only and vanished on
-- reload/logout. Adds a dedicated jsonb column mirroring the frontend s.practiceScores
-- shape: { [belt]: { knowledge, simulation, *_date, *_total, assessmentUnlocked, unlockedDate } }.
-- Written via mapStaffToBackend()/narrow PATCH in savePracticeScore (ui-views.js).
--
-- ⚠️ Must be applied BEFORE deploying the frontend that writes practice_scores,
-- otherwise every staff write 400s on the unknown column.

alter table staff add column if not exists practice_scores jsonb default '{}'::jsonb;

comment on column staff.practice_scores is
  'Per-belt practice test results keyed by belt name; managed by the staff Study & Practice portal (savePracticeScore).';
