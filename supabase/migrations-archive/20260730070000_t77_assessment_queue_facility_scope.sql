-- T77 server side: scope the assessment queue's assessor branch to the granted facilities.
--
-- Depends on 20260730060000_t74_assessor_facility_scope_overload.sql, which adds
-- sbd_is_assessor(p_fid uuid). This is the FIRST policy migration to adopt that overload, and
-- sbd_assessment_queue is deliberately first because it carries its own facility_id column, so
-- it scopes directly with no join inside the policy.
--
-- Why this table first. The client reported on 2026-07-30 at 6:54 AM, from Kirti's own account,
-- that a granted assessor has observations and observation reviews but no assessment queue. The
-- screen genuinely does not exist in the staff portal. Before adding it, the server gate has to
-- narrow, because today aq_select gives any assessor the entire table: 57 rows across 8
-- facilities as measured on 2026-07-30. Adding the screen against the current policy would put
-- the whole organisation in front of a facility-level assessor.
--
-- WHAT CHANGES FOR WHOM. Only the assessor branch of two policies. Every other branch is copied
-- across verbatim: the four admin roles, the person's own row on select, and the
-- hospital/facility_admin own-facility branch.
--
--   master_admin, admin, staff_admin, system_admin  unchanged, they match on the role branch
--     before the assessor branch is ever evaluated. Avery Henderson is staff_admin, so her
--     reach does not move.
--   hospital, facility_admin                        unchanged, own-facility branch untouched.
--   the requesting staff member                     unchanged, staff_id = auth.uid() on select.
--   a capability assessor WITHOUT assessor_facilities  unchanged, still the whole table. The
--     overload treats an absent or empty list as system wide, which is what Kirti Chaudhary and
--     Amy Cooper have today, so this migration moves nobody's reach on the day it lands.
--   a capability assessor WITH assessor_facilities     narrowed to those facilities. This is the
--     new capability, and it only takes effect once an admin actually picks facilities in Role
--     Management.
--
-- So this is safe to apply before anyone's facilities are chosen, and it starts enforcing the
-- moment they are. Reverting is a plain re-create of the two policies with the zero-arg call.
--
-- Verified read-only before writing this file: aq_select and aq_update are the only two policies
-- on this table that reference sbd_is_assessor, aq_insert and aq_delete do not, and
-- sbd_assessment_queue.facility_id is uuid, matching the overload's parameter type.

drop policy if exists aq_select on public.sbd_assessment_queue;
create policy aq_select on public.sbd_assessment_queue
for select
using (
  sbd_get_user_role() = any (array['master_admin','admin','staff_admin','system_admin'])
  or sbd_is_assessor(facility_id)
  or staff_id = auth.uid()
  or (
    sbd_get_user_role() = any (array['hospital','facility_admin'])
    and facility_id is not null
    and facility_id::text = sbd_get_user_facility()
  )
);

drop policy if exists aq_update on public.sbd_assessment_queue;
create policy aq_update on public.sbd_assessment_queue
for update
using (
  sbd_get_user_role() = any (array['master_admin','admin','staff_admin','system_admin'])
  or sbd_is_assessor(facility_id)
);
