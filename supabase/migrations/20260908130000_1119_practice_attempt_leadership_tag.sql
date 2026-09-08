-- #1119 (Shawn board 138): tag practice attempts made by leadership-belt staff.
--
-- Nullable so the 11 pre-tag rows stay distinguishable (null = never evaluated) from
-- rows written after this ships (true/false). The client writes it at insert from the
-- staffer's CURRENT belt via isLeadershipBelt() in logic.js (Blue/Brown/Black — Blue is the
-- leadership entry point per onboarding). No RLS change: existing spa_* policies already
-- cover the row.
--
-- Verify (read back from prod):
--   select column_name, data_type, is_nullable from information_schema.columns
--    where table_name = 'sbd_practice_attempts' and column_name = 'leadership';
--   select leadership, count(*) from public.sbd_practice_attempts group by 1;

alter table public.sbd_practice_attempts
  add column if not exists leadership boolean;

comment on column public.sbd_practice_attempts.leadership is
  '#1119: true when the staffer held a leadership belt (Blue/Brown/Black) at attempt time; false otherwise; null = row predates the tag.';
