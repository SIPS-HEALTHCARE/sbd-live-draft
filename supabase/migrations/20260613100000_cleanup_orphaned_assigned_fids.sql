-- Module 7 QA — ADM-F1 data cleanup
-- Strips orphaned facility refs (pointing at deleted/non-existent facilities) from
-- sbd_portal_users.assigned_facility_ids. The UI now renders "Unknown facility" for
-- any remaining orphans, so applying this is cleanup, not a blocker.
--
-- Review before applying: run the SELECT below first to see which rows are affected.
--
--   SELECT id, email, assigned_facility_ids
--   FROM sbd_portal_users u
--   WHERE EXISTS (
--     SELECT 1 FROM unnest(u.assigned_facility_ids) AS fid
--     WHERE fid::text NOT IN (SELECT id::text FROM facilities)
--   );

UPDATE sbd_portal_users u
SET assigned_facility_ids = (
  SELECT COALESCE(array_agg(fid), '{}')
  FROM unnest(u.assigned_facility_ids) AS fid
  WHERE fid::text IN (SELECT id::text FROM facilities)
)
WHERE EXISTS (
  SELECT 1 FROM unnest(u.assigned_facility_ids) AS fid
  WHERE fid::text NOT IN (SELECT id::text FROM facilities)
);
