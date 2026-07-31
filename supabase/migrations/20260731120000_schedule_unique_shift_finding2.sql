-- QA 2026-07-29, finding 2: T28 (quick-fill) and T28a (CSV import) create duplicate rows
-- instead of overwriting.
--
-- Both paths -- and saveShift/clearShift with them -- decide between create and update by
-- looking the row up in the in-memory DB.schedule array. That array was never hydrated from
-- the database (finding 1), so after any reload the lookup missed and the create branch ran,
-- writing a second row for the same facility/date/shift. sbd_schedule carries only
-- PRIMARY KEY (id), so nothing stopped it.
--
-- The read path is fixed in ui-views (_loadFacilitySchedule), which makes the lookup find the
-- row it means to overwrite. This index is the backstop: one shift per facility per date, and
-- a duplicate insert now fails loudly at the database instead of silently landing.
--
-- Note for whoever applies this: if it errors with "could not create unique index", prod
-- already holds duplicates and Postgres names the offending key in the error. Reconcile those
-- rows by hand before re-running -- this migration deliberately does not delete data.

create unique index if not exists sbd_schedule_facility_date_shift_uniq
  on public.sbd_schedule (facility_id, date, shift);
