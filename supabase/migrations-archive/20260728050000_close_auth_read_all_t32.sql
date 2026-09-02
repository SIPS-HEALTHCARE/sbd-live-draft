-- T32: drop the bootstrap auth_read_all SELECT policy on sbd_schedule, sbd_attendance
-- and sbd_promotions. All three still carried it alongside their scoped SELECT policies
-- added later; permissive policies OR together, so the scoped ones never constrained
-- anything and any signed-in account could read every facility's rows over REST. Writes
-- were already scoped (T25/T55). All three tables are empty today, so this is a structural
-- fix, not a data incident.
--
-- Verified before shipping (2026-07-28):
--
--   system_admin has no scoped SELECT on any of the three. renderXSchedule (ui-views.js)
--   reads local DB.schedule/DB.attendance cache only, never SB.getSchedule/SB.getAttendance
--   (those are called only from the staff-only renderSReport/renderSSchedule), so
--   system_admin never network-reads sbd_schedule/sbd_attendance. system_admin does trigger
--   SB.getPromotionApprovals() during initAppData's hydration, but the result
--   (DB.promotionApprovals) is only consumed inside the prefix==='a' branch of
--   checkAttentionItems (auth-init.js:820-825) — master_admin/staff_admin only. The call is
--   already wrapped in .catch(()=>[]) (auth-init.js:2050), so an empty result is silent and
--   unused for system_admin.
--
--   staff_member: same blind initAppData hydration hits sbd_promotions, but renderAPromoQueue
--   (ui-views.js) gates the approval queue UI to master_admin/staff_admin and shows "Access
--   Restricted" otherwise — no staff_member screen renders promotion queue data.
--
-- Both roles losing this read is therefore silent and correct, not a regression.

drop policy if exists auth_read_all on public.sbd_schedule;
drop policy if exists auth_read_all on public.sbd_attendance;
drop policy if exists auth_read_all on public.sbd_promotions;

comment on table public.sbd_schedule is
  'Facility schedule blocks. RLS (T32): the auth_read_all bootstrap policy (USING true) was dropped; reads are scoped to master_admin/staff_admin (assigned facilities), hospital/facility_admin/staff_member on their own facility.';

comment on table public.sbd_attendance is
  'Attendance records. RLS (T32): the auth_read_all bootstrap policy (USING true) was dropped; reads are scoped to master_admin/staff_admin, hospital/facility on their own facility, and staff_self (staff_id = auth.uid()).';

comment on table public.sbd_promotions is
  'Promotion records. RLS (T32): the auth_read_all bootstrap policy (USING true) was dropped; reads are scoped to master_admin/staff_admin (ALL) and hospital on their own facility.';
