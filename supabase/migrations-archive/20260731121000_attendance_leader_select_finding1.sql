-- QA 2026-07-29, finding 1 (server half): a facility leader has no SELECT on sbd_attendance.
--
-- Finding 1 is "the leader portal never loads schedule or attendance from the database". The
-- client half is the missing read call, fixed in ui-views (_loadFacilitySchedule). This is the
-- other half: even with the call wired, a leader's fetch would return zero rows.
--
-- sbd_attendance's only remaining SELECT policy is sbd_attendance_staff_self
-- (20260726235500), `staff_id = auth.uid()` -- a staff member reading their own record. The
-- bootstrap auth_read_all policy that used to cover everyone else was dropped by T32
-- (20260728050000), correctly, but nothing replaced it for the roles that take attendance.
-- So hospital and facility_admin can INSERT and UPDATE attendance (sbd_attendance_leader_write
-- / _leader_update, 20260727000500) and then cannot read back what they wrote.
--
-- Consolidated into one policy the way finding 4 did for sbd_schedule, so there is a single
-- place to reason about who reads this table. The staff_member branch keeps the exact
-- `staff_id = auth.uid()` test rather than becoming facility-scoped -- same rows as before.
-- Leaders are scoped to their own facility via sbd_get_user_facility(), matching the facility_id
-- comparison already used by the write policies. No publish-gate equivalent here: attendance
-- has no draft state.

drop policy if exists sbd_attendance_staff_self on public.sbd_attendance;
drop policy if exists sbd_attendance_select on public.sbd_attendance;

create policy sbd_attendance_select on public.sbd_attendance
for select to authenticated
using (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or (
    public.sbd_get_user_role() in ('hospital','facility_admin')
    and facility_id = public.sbd_get_user_facility()
  )
  or staff_id = auth.uid()
);

comment on table public.sbd_attendance is
  'Per-staff, per-shift attendance marks. Allowed status values: present, absent, late, coverage, pto, excused (finding 3, 2026-07-29). RLS (finding 1, 2026-07-29): staff read their own rows, leaders read their own facility, SIPS admins read all -- leaders could previously write rows they could not read back.';
