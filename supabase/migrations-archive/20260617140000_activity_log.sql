-- 20260617140000_activity_log.sql
-- P1 (DAVID phased build plan): activity & engagement tracking. Greenfield.
-- Rows are written ONLY by the sbd-log-activity edge function (service role), which stamps
-- user_id / staff_id / facility_id from the verified JWT — clients never write here directly
-- and cannot spoof another identity. The policies below are SELECT-only, for David's
-- engagement serializers + leader dashboards (queried as the authenticated user, RLS-scoped).
--
-- Identity columns are nullable: admins (master/staff_admin) have no staff_id and may have no
-- facility_id; their rows still record user_id for completeness.

CREATE TABLE IF NOT EXISTS public.sbd_activity_log (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid,                       -- sbd_portal_users.id (who)
    staff_id    uuid,                       -- staff.id if a staff member, else null
    facility_id uuid,                       -- facilities.id (scope), nullable
    event_type  text NOT NULL,
    event_meta  jsonb DEFAULT '{}'::jsonb,
    created_at  timestamptz DEFAULT now()
);

-- HEAL: if a `sbd_activity_log` table already exists WITHOUT these columns, CREATE TABLE IF NOT
-- EXISTS no-ops and the index below would fail ("column staff_id does not exist"). These adds are
-- non-destructive (only add missing columns). NOTE: no committed code uses this table other than
-- the new P1 code, so an existing one is an out-of-band remnant. If a SELECT shows it holds data
-- from something else, STOP and rename this feature's table instead (see chat).
ALTER TABLE public.sbd_activity_log ADD COLUMN IF NOT EXISTS user_id     uuid;
ALTER TABLE public.sbd_activity_log ADD COLUMN IF NOT EXISTS staff_id    uuid;
ALTER TABLE public.sbd_activity_log ADD COLUMN IF NOT EXISTS facility_id uuid;
ALTER TABLE public.sbd_activity_log ADD COLUMN IF NOT EXISTS event_type  text;
ALTER TABLE public.sbd_activity_log ADD COLUMN IF NOT EXISTS event_meta  jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.sbd_activity_log ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS sbd_activity_log_staff_idx    ON public.sbd_activity_log (staff_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sbd_activity_log_facility_idx ON public.sbd_activity_log (facility_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sbd_activity_log_user_idx     ON public.sbd_activity_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sbd_activity_log_type_idx     ON public.sbd_activity_log (event_type);

ALTER TABLE public.sbd_activity_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.sbd_activity_log TO service_role;

-- Reads only; inserts go through the service-role edge function. Scoping mirrors assessment_history.
-- RLS grounded in PROVEN prod objects (sbd_portal_users + sbd_is_admin() + auth.uid()), NOT
-- JWT custom claims (unreliable — see 20260611120000_transfer_requests.sql). Reads only;
-- inserts come solely from the service-role sbd-log-activity edge fn. Drop old + new names first.
DROP POLICY IF EXISTS "sal_master_all"          ON public.sbd_activity_log;
DROP POLICY IF EXISTS "sal_staff_admin_select"  ON public.sbd_activity_log;
DROP POLICY IF EXISTS "sal_facility_select"     ON public.sbd_activity_log;
DROP POLICY IF EXISTS "sal_system_admin_select" ON public.sbd_activity_log;
DROP POLICY IF EXISTS "sal_member_self_select"  ON public.sbd_activity_log;
DROP POLICY IF EXISTS "sal_admin_all"           ON public.sbd_activity_log;
DROP POLICY IF EXISTS "sal_system_select"       ON public.sbd_activity_log;

-- Admins (master_admin / staff_admin / admin + hardcoded SIPS emails): full read.
CREATE POLICY "sal_admin_all" ON public.sbd_activity_log FOR SELECT
    TO authenticated
    USING (public.sbd_is_admin());

-- Facility leaders (facility_admin / hospital): their own facility.
CREATE POLICY "sal_facility_select" ON public.sbd_activity_log FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role IN ('facility_admin','hospital')
          AND u.facility_id::text = sbd_activity_log.facility_id::text
    ));

-- System admins: any facility in their system.
CREATE POLICY "sal_system_select" ON public.sbd_activity_log FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sbd_portal_users u
        JOIN public.facilities f ON f.system_id::text = u.system_id::text
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'system_admin'
          AND f.id::text = sbd_activity_log.facility_id::text
    ));

-- Staff member: only their own activity (staff.id = auth uid; also honor an explicit link).
CREATE POLICY "sal_member_self_select" ON public.sbd_activity_log FOR SELECT
    TO authenticated
    USING (
        staff_id = auth.uid()
        OR staff_id::text IN (SELECT u.staff_id::text FROM public.sbd_portal_users u WHERE u.auth_uid = auth.uid() AND u.staff_id IS NOT NULL)
    );
