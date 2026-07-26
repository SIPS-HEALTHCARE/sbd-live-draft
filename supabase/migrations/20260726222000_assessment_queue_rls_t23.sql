-- T23 / finding S2: a candidate could approve their own belt gate request.
--
-- sbd_assessment_queue carried:
--   "Allow all select"          SELECT USING (true)
--   "Allow authenticated insert" INSERT WITH CHECK (auth.role() = 'authenticated')
--   "Allow authenticated update" UPDATE USING (auth.role() = 'authenticated')
--
-- auth.role() is 'authenticated' for every signed-in user regardless of who they are, so
-- the update rule was not a check at all. Over 56 live rows, any signed-in account could
-- set any request to approved, including their own, and could read every request on the
-- platform.
--
-- Who actually needs what, read out of the application:
--   * A candidate raises a request (ui-views.js submitAssessmentQueue, two call sites) and
--     needs to see their own to know it is pending. So: self insert, self read.
--   * Approve and Deny live in the admin portal, on the Assessment Queue and Staff
--     Progression screens (renderAAssessments, renderAProgression). So: SIPS admins decide.
--   * A granted assessor records the result. All four resolveAssessmentQueue call sites sit
--     directly beside SB.recordAssessment, which is the assessor closing out a gate, never
--     the candidate. So assessors need update, candidates do not.
--   * Facility leaders get a facility-scoped read so their own people's requests are
--     visible, matching how placement_reviews and sbd_schedule already scope reads.
--   * DELETE stays master admin only. The reset path runs through an edge function on the
--     service role and bypasses RLS.
--
-- The candidate keeps INSERT but loses UPDATE entirely, which is the whole point: raising a
-- request and deciding one are different acts.

alter table public.sbd_assessment_queue enable row level security;

drop policy if exists "Allow all select"           on public.sbd_assessment_queue;
drop policy if exists "Allow authenticated insert" on public.sbd_assessment_queue;
drop policy if exists "Allow authenticated update" on public.sbd_assessment_queue;
drop policy if exists aq_select on public.sbd_assessment_queue;
drop policy if exists aq_insert on public.sbd_assessment_queue;
drop policy if exists aq_update on public.sbd_assessment_queue;
drop policy if exists aq_delete on public.sbd_assessment_queue;

create policy aq_select on public.sbd_assessment_queue
for select to authenticated
using (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or public.sbd_is_assessor()
  or staff_id = auth.uid()
  or (
    public.sbd_get_user_role() in ('hospital','facility_admin')
    and facility_id is not null
    and facility_id::text = public.sbd_get_user_facility()
  )
);

-- A candidate's own insert is pinned to status 'pending'. Without that clause the first
-- version of this policy checked only WHOSE row it was and not WHAT it said, so a candidate
-- could insert a row already marked 'approved' and skip the approval step entirely. That was
-- caught by probing this migration before ticking it. Both submit paths in the application
-- send 'pending' (mapQueueToBackend defaults to it, and the second call site sets it
-- explicitly), so pinning it changes nothing about normal use.
create policy aq_insert on public.sbd_assessment_queue
for insert to authenticated
with check (
  (staff_id = auth.uid() and coalesce(status,'pending') = 'pending')
  or public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
);

create policy aq_update on public.sbd_assessment_queue
for update to authenticated
using (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or public.sbd_is_assessor()
)
with check (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or public.sbd_is_assessor()
);

create policy aq_delete on public.sbd_assessment_queue
for delete to authenticated
using (public.sbd_is_master_admin());

comment on table public.sbd_assessment_queue is
  'Belt gate requests. RLS (T23): a candidate raises and reads their own request but cannot decide it; SIPS admins and granted assessors decide; facility leaders read their own facility.';
