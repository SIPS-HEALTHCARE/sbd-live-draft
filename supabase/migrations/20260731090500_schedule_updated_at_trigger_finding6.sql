-- QA 2026-07-29, finding 6: sbd_schedule.updated_at is never maintained.
--
-- After the publish write in the T26 dry run, updated_at still equalled created_at.
-- Same class as the known staff.updated_at gap -- don't rely on it for recency anywhere
-- until it's wired.
--
-- touch_updated_at is a generic trigger function already live on this project (see the
-- T34 definer-execute review, 20260730140000, which keeps it in the allowlist) but was
-- never attached to sbd_schedule and has no CREATE TRIGGER in any tracked migration.
-- Reusing it here rather than writing a second copy of the same one-liner.

drop trigger if exists sbd_schedule_touch_updated_at on public.sbd_schedule;

create trigger sbd_schedule_touch_updated_at
before update on public.sbd_schedule
for each row execute function public.touch_updated_at();
