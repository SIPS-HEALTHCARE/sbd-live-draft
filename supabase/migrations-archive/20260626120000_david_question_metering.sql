-- Gap 2 / Fix 2 — question-count metering lane (ADDITIVE, no data loss).
-- Companion spec: plans/David_OG_Metering_Dev_Spec_v3.md §3 Gap 2, §6 Fix 2, §7 Throttle.
--
-- usage_tier + questions_allowance already exist (migration 20260624000000). This adds the
-- live monthly counters the throttle reads, plus the period anchor used for the monthly reset.
-- Nothing is dropped or destructively altered. Verify row counts on david_facility_access and
-- david_usage_logs are unchanged before/after applying this migration.

ALTER TABLE public.david_facility_access
  ADD COLUMN IF NOT EXISTS questions_consumed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserve_consumed   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period_start       date    NOT NULL DEFAULT date_trunc('month', now())::date;

-- ── RPCs (SECURITY DEFINER, service_role only) ───────────────────────────────────────────
-- Both bake in a LAZY monthly reset: if the stored period_start is older than the current
-- month, the counters reset to 0 and period_start advances to the 1st. This implements the
-- §7.3 "reset on the 1st of each month" without depending on pg_cron (not enabled in this
-- project). The reset happens on first touch each month — read or write.

-- Read quota for the pre-flight throttle check (no increment).
CREATE OR REPLACE FUNCTION public.david_get_quota(p_facility_id text)
RETURNS public.david_facility_access
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.david_facility_access;
  m   date := date_trunc('month', now())::date;
BEGIN
  SELECT * INTO rec FROM public.david_facility_access
    WHERE facility_id = p_facility_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;                         -- no access row (e.g. master-admin-global) → caller skips metering
  END IF;
  IF rec.period_start IS NULL OR rec.period_start < m THEN
    UPDATE public.david_facility_access
      SET questions_consumed = 0,
          reserve_consumed   = 0,
          period_start       = m,
          updated_at         = now()
      WHERE facility_id = p_facility_id
      RETURNING * INTO rec;
  END IF;
  RETURN rec;
END;
$$;

-- Atomically count one completed chat request (+ optional reserve draw). The FOR UPDATE row
-- lock makes concurrent requests safe. Lazy-resets defensively so a request crossing the
-- month boundary cannot double-count against the prior month.
CREATE OR REPLACE FUNCTION public.david_consume_question(p_facility_id text, p_is_reserve boolean DEFAULT false)
RETURNS public.david_facility_access
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.david_facility_access;
  m   date := date_trunc('month', now())::date;
BEGIN
  SELECT * INTO rec FROM public.david_facility_access
    WHERE facility_id = p_facility_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF rec.period_start IS NULL OR rec.period_start < m THEN
    rec.questions_consumed := 0;
    rec.reserve_consumed   := 0;
    rec.period_start       := m;
  END IF;
  UPDATE public.david_facility_access
    SET questions_consumed = rec.questions_consumed + 1,
        reserve_consumed   = rec.reserve_consumed + (CASE WHEN p_is_reserve THEN 1 ELSE 0 END),
        period_start       = m,
        updated_at         = now()
    WHERE facility_id = p_facility_id
    RETURNING * INTO rec;
  RETURN rec;
END;
$$;

GRANT EXECUTE ON FUNCTION public.david_get_quota(text)                TO service_role;
GRANT EXECUTE ON FUNCTION public.david_consume_question(text, boolean) TO service_role;
