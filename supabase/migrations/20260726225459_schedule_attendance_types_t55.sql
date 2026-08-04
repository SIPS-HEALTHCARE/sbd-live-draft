-- T55, part 1 of 2: make the schedule and attendance tables able to hold what the
-- application actually sends.
--
-- Schedule, Attendance and Promotions have never stored a single row. All three tables
-- were empty, and not because the features went unused: the browser sends column names
-- and types these tables do not have, PostgREST rejects the write, and the rejection is
-- swallowed by a catch that only rethrows programmer errors. Nobody ever saw a failure.
--
-- Two separate faults. This migration fixes the ones that live in the database; the
-- matching browser fixes ship in the same change.
--
-- 1. staff_id is `integer` on sbd_attendance and sbd_promotions.
--
--    Staff are identified by staff.id, which is uuid and equals auth.uid(). There is no
--    integer staff identifier anywhere in the running system. The integer columns are
--    left over from an older shape: sbd_portal_users.staff_id is also integer and is
--    null on all 75 rows, which is why the sbd_attendance_staff_self policy below could
--    never match a row either.
--
--    That policy is dropped and rewritten against auth.uid() directly. Rewriting it is
--    not optional, since Postgres refuses to alter the type of a column a policy
--    references, and the old form was dead anyway.
--
--    sbd_portal_users.staff_id is deliberately left alone. It is guarded by the T53
--    trigger and nothing reads it once this policy stops doing so; removing it is a
--    separate decision.
--
-- 2. sbd_attendance is missing arrived_at, left_at and note.
--
--    The attendance mapper has always sent all three. They are added rather than dropped
--    from the mapper because the attendance record is meant to carry a time and a reason,
--    and the leader screens already collect them.
--
-- Every table here is empty, so the type changes cannot fail on existing data and there
-- is nothing to back up or backfill. The `using` clauses are written correctly regardless.
--
-- Known and deliberately not changed here: sbd_promotions requires from_belt and to_belt
-- to be NOT NULL, while the promotion mapper can send to_belt as null. That is a
-- data-shape question about what a promotion without a belt change means, and it is
-- recorded in the ledger rather than guessed at.

-- ── sbd_attendance ───────────────────────────────────────────────────────────

drop policy if exists sbd_attendance_staff_self on public.sbd_attendance;

alter table public.sbd_attendance
  alter column staff_id    type uuid using staff_id::text::uuid,
  alter column coverage_for type uuid using coverage_for::text::uuid;

alter table public.sbd_attendance
  add column if not exists arrived_at timestamptz,
  add column if not exists left_at    timestamptz,
  add column if not exists note       text;

-- A staff member reads their own attendance. staff.id is auth.uid(), so this is direct.
create policy sbd_attendance_staff_self on public.sbd_attendance
for select to authenticated
using (staff_id = auth.uid());

comment on column public.sbd_attendance.staff_id is
  'staff.id, which is the same uuid as auth.uid(). Was integer until T55 and never held a row.';

-- ── sbd_promotions ───────────────────────────────────────────────────────────

alter table public.sbd_promotions
  alter column staff_id type uuid using staff_id::text::uuid;

comment on column public.sbd_promotions.staff_id is
  'staff.id, which is the same uuid as auth.uid(). Was integer until T55 and never held a row.';
