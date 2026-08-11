-- 20260723162412_assessment_pin_attempts.sql
-- #60: assessor-PIN rate limiting. A dedicated failed-attempt ledger for the
-- sbd-assessor-pin `validate_pin` action. Rows are written ONLY by that
-- service-role edge function; clients never write here and cannot spoof identity.
--
-- Why a dedicated table (not sbd_activity_log): activity_log is engagement
-- telemetry whose RLS exposes rows to facility leaders/system admins. PIN
-- brute-force attempts are a security signal that should stay admin-only, and
-- keeping them in their own table means the lockout count query is a clean,
-- indexed lookup that can't be diluted by unrelated events.
--
-- outcome:
--   'failed'     — a wrong PIN was submitted for an existing pending PIN.
--   'locked_out' — an attempt arrived while the account was already locked
--                  (audit trail of the lockout actually biting; NOT counted
--                  toward the threshold, so a locked account can't self-extend
--                  its lock indefinitely by retrying).

CREATE TABLE IF NOT EXISTS public.sbd_assessment_pin_attempts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id        uuid NOT NULL,
    facility_id     uuid,
    assessment_type text,
    outcome         text NOT NULL,
    created_at      timestamptz DEFAULT now()
);

-- HEAL: non-destructive column adds in case an out-of-band table already exists.
ALTER TABLE public.sbd_assessment_pin_attempts ADD COLUMN IF NOT EXISTS staff_id        uuid;
ALTER TABLE public.sbd_assessment_pin_attempts ADD COLUMN IF NOT EXISTS facility_id     uuid;
ALTER TABLE public.sbd_assessment_pin_attempts ADD COLUMN IF NOT EXISTS assessment_type text;
ALTER TABLE public.sbd_assessment_pin_attempts ADD COLUMN IF NOT EXISTS outcome         text;
ALTER TABLE public.sbd_assessment_pin_attempts ADD COLUMN IF NOT EXISTS created_at      timestamptz DEFAULT now();

-- The hot path is "failed attempts for this staff since T" — index staff_id + time.
CREATE INDEX IF NOT EXISTS sbd_pin_attempts_staff_idx
    ON public.sbd_assessment_pin_attempts (staff_id, created_at DESC);

ALTER TABLE public.sbd_assessment_pin_attempts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.sbd_assessment_pin_attempts TO service_role;

-- Reads: admins only (security signal). Inserts come solely from the service-role
-- edge function, which bypasses RLS — so there is intentionally no INSERT policy.
DROP POLICY IF EXISTS "spa_admin_select" ON public.sbd_assessment_pin_attempts;
CREATE POLICY "spa_admin_select" ON public.sbd_assessment_pin_attempts FOR SELECT
    TO authenticated
    USING (public.sbd_is_admin());
