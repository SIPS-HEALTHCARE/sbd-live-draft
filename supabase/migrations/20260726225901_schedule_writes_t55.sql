-- T55, part 2 of 2. Both of these came out of probing part 1 rather than from reading the
-- schema, which is the only reason they were found.
--
-- 1. sbd_schedule.assigned_staff is integer[], not uuid[].
--
--    The first probe returned: column "assigned_staff" is of type integer[] but expression
--    is of type uuid[]. Same integer-era lineage as the staff_id columns in part 1. Even a
--    master admin could not write a schedule row. Fixing the mapper's column name alone
--    would have left the feature just as broken, with a different error message.
--
-- 2. Facility leaders have no write policy on the schedule or the attendance record.
--
--    sbd_schedule and sbd_attendance grant writes to master_admin and staff_admin only.
--    Every SELECT policy includes hospital and facility_admin, but no INSERT or UPDATE
--    does, so the second probe returned: new row violates row-level security policy.
--
--    That is backwards for what these screens are. The schedule builder, the shift editor,
--    quick fill, CSV import and the attendance register all live in the facility leader
--    portal (renderHSchedule, renderHAttendance). The leader is the intended author; SIPS
--    admins are the exception, not the rule.
--
--    The grant is scoped to the leader's own facility, matching the shape used for
--    facility_shifts in T25 and for placement_reviews in T22. A leader still cannot touch
--    another facility's schedule or attendance.
--
--    Deleting is deliberately not granted. Clearing a shift is an UPDATE that empties
--    assigned_staff, so nothing the leader screens do needs DELETE, and leaving it out
--    means a mistake cannot remove the record of who was scheduled.
--
-- Both tables are still empty, so neither change can fail on existing data.

-- The column carries a default of '{}'::integer[], which Postgres will not cast for us, so
-- the default is dropped and put back in the new type around the change.
alter table public.sbd_schedule alter column assigned_staff drop default;

alter table public.sbd_schedule
  alter column assigned_staff type uuid[] using assigned_staff::text[]::uuid[];

alter table public.sbd_schedule alter column assigned_staff set default '{}'::uuid[];

comment on column public.sbd_schedule.assigned_staff is
  'staff.id values. Was integer[] until T55, which is why no schedule row could ever be written.';

drop policy if exists sbd_schedule_leader_write  on public.sbd_schedule;
drop policy if exists sbd_schedule_leader_update on public.sbd_schedule;

create policy sbd_schedule_leader_write on public.sbd_schedule
for insert to authenticated
with check (
  public.sbd_get_user_role() in ('hospital','facility_admin')
  and facility_id = public.sbd_get_user_facility()
);

create policy sbd_schedule_leader_update on public.sbd_schedule
for update to authenticated
using      (public.sbd_get_user_role() in ('hospital','facility_admin')
            and facility_id = public.sbd_get_user_facility())
with check (public.sbd_get_user_role() in ('hospital','facility_admin')
            and facility_id = public.sbd_get_user_facility());

drop policy if exists sbd_attendance_leader_write  on public.sbd_attendance;
drop policy if exists sbd_attendance_leader_update on public.sbd_attendance;

create policy sbd_attendance_leader_write on public.sbd_attendance
for insert to authenticated
with check (
  public.sbd_get_user_role() in ('hospital','facility_admin')
  and facility_id = public.sbd_get_user_facility()
);

create policy sbd_attendance_leader_update on public.sbd_attendance
for update to authenticated
using      (public.sbd_get_user_role() in ('hospital','facility_admin')
            and facility_id = public.sbd_get_user_facility())
with check (public.sbd_get_user_role() in ('hospital','facility_admin')
            and facility_id = public.sbd_get_user_facility());

comment on table public.sbd_schedule is
  'Shift assignments per facility, per day. published_by is null until a leader presses Publish to Staff; the staff portal shows only published rows (T26). Facility leaders write their own facility (T55).';
