-- QA 2026-07-29, finding 4: pre-publish invisibility was enforced only in the browser.
--
-- getStaffSchedule (utils.js:202) filters DB.schedule on publishedBy before a staff member
-- sees a shift -- published_by is null until a leader presses Publish to Staff (T26). But
-- sbd_schedule_staff_member_select never checked publish state at all, only facility and
-- role. A staff_member session calling the REST endpoint directly (curl, devtools) could
-- read a facility's unpublished draft schedule. Same class of client-trusted-enforcement
-- bug already closed elsewhere on this platform (see T32, T37).
--
-- Leaders (hospital, facility_admin) still need to read their own drafts to edit and
-- publish them, so only the staff_member branch gains the published_by check. SIPS admin
-- roles are untouched. Mirrors the facility_id comparison already used by
-- sbd_schedule_leader_write / sbd_schedule_leader_update (20260727000500), which compares
-- facility_id to sbd_get_user_facility() with no cast.

drop policy if exists sbd_schedule_staff_member_select on public.sbd_schedule;
drop policy if exists sbd_schedule_select on public.sbd_schedule;

create policy sbd_schedule_select on public.sbd_schedule
for select to authenticated
using (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or (
    public.sbd_get_user_role() in ('hospital','facility_admin')
    and facility_id = public.sbd_get_user_facility()
  )
  or (
    public.sbd_get_user_role() = 'staff_member'
    and facility_id = public.sbd_get_user_facility()
    and published_by is not null
  )
);

comment on table public.sbd_schedule is
  'Shift assignments per facility, per day. published_by is null until a leader presses Publish to Staff (T26). RLS (finding 4, 2026-07-29): staff_member reads are scoped to published rows only; leaders and SIPS admins still see drafts.';
