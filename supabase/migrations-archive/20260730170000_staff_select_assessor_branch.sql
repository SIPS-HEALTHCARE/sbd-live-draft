-- Staff read policy: add an assessor branch (Part 1 of the client's 2026-07-30 report).
--
-- T73/T77 put the Assessment Queue into the staff portal for capability-granted
-- assessors (Kirti Chaudhary, Amy Cooper) and widened aq_select on
-- sbd_assessment_queue to include sbd_is_assessor(facility_id). Nobody widened staff
-- reads to match. A granted assessor's session (base role staff_member) can only read
-- its own row plus its own facility, so every cross-facility queue row's staff lookup
-- misses. RLS fails silently by returning fewer rows, so nothing errors -- the queue
-- just renders STAFF MEMBER as "Unknown" and CURRENT BELT as "--"
-- (renderAAssessments, ui-views.js ~14644/14679, getStaff() miss). Verified live: every
-- queue row joins a real named staff record. The gap is RLS, not the fetch, so the fix
-- belongs here, not in a client-side widen of the staff fetch.
--
-- Uses the facility-scoped overload from 20260730060000 (sbd_is_assessor(p_fid uuid)),
-- not the zero-arg gate, so the moment an admin assigns an assessor_facilities list
-- under T74, this branch narrows in lockstep with the queue's own branch. Today all
-- three grant holders carry no list, so the overload reads system wide for them --
-- matching what aq_select already returns them and changing nobody's reach the day
-- this lands.
--
-- Every existing branch is copied across verbatim; only the assessor branch is new.
-- A plain staff_member with no assessor grant is unaffected: sbd_is_assessor(fid)
-- returns false for them same as it always has.

drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff
for select
using (
  id = auth.uid()
  or get_user_role() = any (array['master_admin','staff_admin','system_admin'])
  or (
    get_user_role() = any (array['facility_admin','hospital','staff_member'])
    and fid = get_user_fid()
  )
  or sbd_is_assessor(fid)
);
