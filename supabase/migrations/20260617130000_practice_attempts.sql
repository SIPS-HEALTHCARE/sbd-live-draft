-- 20260617130000_practice_attempts.sql
-- P0.3 (DAVID phased build plan): per-attempt practice history + wrong-question log.
-- Today only the BEST % per belt/mode is kept (staff.practice_scores jsonb). This append-only
-- table preserves every attempt so David can coach from real misses and P2 can compute trends.
--
-- NOTE: staff.id is UUID (src/data/schema.sql), so staff_id is uuid + FK (the plan draft said
-- int — that was wrong). `fid` is denormalized so RLS can mirror assessment_history exactly.
-- CAVEAT (logic): FULL_QUESTION_BANKS practice is SELF-GRADED (the learner clicks correct/incorrect),
-- so wrong_questions is self-reported, not machine-verified — hence the self_graded flag. David
-- and P2 must treat this as self-assessment data, preferring keyed sources where available.

CREATE TABLE IF NOT EXISTS public.sbd_practice_attempts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id        uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    fid             uuid REFERENCES public.facilities(id),
    belt            text,
    mode            text,
    score           int,
    total           int,
    pct             int,
    wrong_questions jsonb DEFAULT '[]'::jsonb,
    source          text DEFAULT 'practice_bank',
    self_graded     boolean DEFAULT true,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sbd_practice_attempts_staff_idx
    ON public.sbd_practice_attempts (staff_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sbd_practice_attempts_fid_idx
    ON public.sbd_practice_attempts (fid);

ALTER TABLE public.sbd_practice_attempts ENABLE ROW LEVEL SECURITY;

-- RLS grounded in PROVEN prod objects: sbd_portal_users (the real portal table — NOT the
-- doc-only user_profiles), the sbd_is_admin() helper (20260611120000), and auth.uid().
-- NOT JWT custom claims: a stock Supabase JWT's role is just 'authenticated' (see
-- 20260611120000_transfer_requests.sql), so role/facility_id/staff_id claims are unreliable.
-- staff.id IS the auth uid (sbd-sync-user-claims sets staff.id = the auth user id), so
-- staff_id = auth.uid() is the reliable self-scope. ids compared as text to dodge uuid/text drift.

-- Drop any policies left from a prior partial run (old names + new names).
DROP POLICY IF EXISTS "spa_master_all"          ON public.sbd_practice_attempts;
DROP POLICY IF EXISTS "spa_staff_admin_all"     ON public.sbd_practice_attempts;
DROP POLICY IF EXISTS "spa_hospital_select"     ON public.sbd_practice_attempts;
DROP POLICY IF EXISTS "spa_facility_admin_all"  ON public.sbd_practice_attempts;
DROP POLICY IF EXISTS "spa_system_admin_select" ON public.sbd_practice_attempts;
DROP POLICY IF EXISTS "spa_admin_all"           ON public.sbd_practice_attempts;
DROP POLICY IF EXISTS "spa_facility_select"     ON public.sbd_practice_attempts;
DROP POLICY IF EXISTS "spa_system_select"       ON public.sbd_practice_attempts;
DROP POLICY IF EXISTS "spa_member_self_insert"  ON public.sbd_practice_attempts;
DROP POLICY IF EXISTS "spa_member_self_select"  ON public.sbd_practice_attempts;

-- Admins (master_admin / staff_admin / admin + hardcoded SIPS emails): full access.
CREATE POLICY "spa_admin_all" ON public.sbd_practice_attempts FOR ALL
    TO authenticated
    USING (public.sbd_is_admin())
    WITH CHECK (public.sbd_is_admin());

-- Facility leaders (facility_admin / hospital): rows for their own facility.
CREATE POLICY "spa_facility_select" ON public.sbd_practice_attempts FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role IN ('facility_admin','hospital')
          AND u.facility_id::text = sbd_practice_attempts.fid::text
    ));

-- System admins: rows for any facility in their system.
CREATE POLICY "spa_system_select" ON public.sbd_practice_attempts FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.sbd_portal_users u
        JOIN public.facilities f ON f.system_id::text = u.system_id::text
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'system_admin'
          AND f.id::text = sbd_practice_attempts.fid::text
    ));

-- Staff member: only their own attempts. staff.id = auth uid, and we also honor an explicit
-- sbd_portal_users.staff_id link if one exists.
CREATE POLICY "spa_member_self_select" ON public.sbd_practice_attempts FOR SELECT
    TO authenticated
    USING (
        staff_id = auth.uid()
        OR staff_id::text IN (SELECT u.staff_id::text FROM public.sbd_portal_users u WHERE u.auth_uid = auth.uid() AND u.staff_id IS NOT NULL)
    );

CREATE POLICY "spa_member_self_insert" ON public.sbd_practice_attempts FOR INSERT
    TO authenticated
    WITH CHECK (
        staff_id = auth.uid()
        OR staff_id::text IN (SELECT u.staff_id::text FROM public.sbd_portal_users u WHERE u.auth_uid = auth.uid() AND u.staff_id IS NOT NULL)
    );

GRANT ALL ON public.sbd_practice_attempts TO service_role;
