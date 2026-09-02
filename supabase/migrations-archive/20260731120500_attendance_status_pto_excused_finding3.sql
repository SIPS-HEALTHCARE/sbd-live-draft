-- QA 2026-07-29, finding 3: the PTO and Excused attendance buttons can never save.
--
-- sbd_attendance_status_check allows only present/absent/late/coverage, while the attendance
-- row renders five buttons plus coverage. Marking PTO or Excused sent a value the constraint
-- rejected; the write is fire-and-forget with the error routed to handleSyncError, so the mark
-- appeared to take and was gone on the next load.
--
-- Widening the constraint rather than removing the buttons: both statuses are first-class
-- everywhere else in the app already -- ATTEND_POINTS (0 pts, no penalty), ATTEND_LABELS,
-- ATTEND_COLORS, the P/T/U/PTO/E/C abbreviations and legend on the annual record, and the
-- worst-status priority list. The constraint is the one place that never learned about them.
--
-- The table's own DDL is not in any tracked migration (same undocumented-DDL pattern as the
-- sbd_schedule policy in finding 4), so this drops the constraint by name if present and
-- restates the full allowed set rather than assuming what is currently there.

alter table public.sbd_attendance
  drop constraint if exists sbd_attendance_status_check;

alter table public.sbd_attendance
  add constraint sbd_attendance_status_check
  check (status in ('present','absent','late','coverage','pto','excused'));
