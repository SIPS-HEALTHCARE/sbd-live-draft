-- T44 and T57: drop the five legacy tables that are writable by anyone and used by nobody.
--
-- T57 turned out to be a subset of T44. T57 named `schedule`, `attendance` and
-- `promotion_approvals`, the duplicate set sitting beside the `sbd_` prefixed tables the
-- application actually uses. T44 named those three plus `assessment_queue` and
-- `assessment_history`. One migration closes both.
--
-- Checked before dropping anything, because a drop does not come back:
--
--   | table                | rows | incoming FKs | browser calls | edge functions |
--   |----------------------|------|--------------|---------------|----------------|
--   | assessment_queue     |    0 |            0 |             0 |              0 |
--   | assessment_history   |    0 |            0 |             0 |              0 |
--   | promotion_approvals  |    0 |            0 |             0 |              0 |
--   | attendance           |    0 |            0 |             0 |              0 |
--   | schedule             |    0 |            0 |             0 |              0 |
--
-- No view, materialised view or function mentions any of them. Their own foreign keys only
-- point outwards, at `facilities` and `staff`, so dropping them orphans nothing. Each still
-- carried two policies, which is the actual problem: five tables that nobody uses and any
-- signed-in account could write to.
--
-- The shapes are written out below so this is recoverable from version control rather than
-- only from a backup. They are the pre-drop definitions, columns and nullability as they
-- stood on 2026-07-27:
--
--   assessment_queue     id uuid not null, staff_id uuid, fid uuid, type text not null,
--                        target_belt text not null, status text not null,
--                        requested_at timestamptz, resolved_at timestamptz, notes text
--   assessment_history   id uuid not null, staff_id uuid, fid uuid,
--                        assessment_type text not null, target_belt text not null,
--                        result text not null, notes text, assessed_by uuid,
--                        assessed_at timestamptz
--   promotion_approvals  id uuid not null, staff_id uuid, fid uuid,
--                        current_role text not null, proposed_role text not null,
--                        submitted_by uuid, status text not null, reviewed_by uuid,
--                        review_notes text, created_at timestamptz, updated_at timestamptz
--   attendance           id uuid not null, fid uuid, date date not null, shift text not null,
--                        staff_id uuid, status text not null, coverage_for uuid,
--                        marked_by uuid, points integer, created_at timestamptz
--   schedule             id uuid not null, fid uuid, date date not null, shift text not null,
--                        assigned_staff uuid[], published_by uuid, notes text,
--                        zone_assignments jsonb, created_at timestamptz, updated_at timestamptz
--
-- Worth recording for whoever reads this later: the duplicate set was typed more correctly
-- than the tables in use. `fid uuid` and `staff_id uuid` here, against `facility_id text`
-- and `staff_id integer` on the `sbd_` prefixed ones, which is exactly the mismatch T55 had
-- to repair. The application was pointed at the weaker pair. Nothing is being lost by
-- dropping these; the note is here so the accident is not repeated.
--
-- `restrict` rather than `cascade` on purpose. If anything unexpected does depend on one of
-- these, the drop fails loudly instead of quietly taking the dependency with it.

drop table if exists public.assessment_queue    restrict;
drop table if exists public.assessment_history  restrict;
drop table if exists public.promotion_approvals restrict;
drop table if exists public.attendance          restrict;
drop table if exists public.schedule            restrict;
