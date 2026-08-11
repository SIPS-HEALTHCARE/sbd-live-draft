-- Enforce max_monthly_tokens (Team-Tasks-2026-07-29: enforce-monthly-token-cap).
-- max_monthly_tokens has existed since 20260422110000 but nothing reads it for enforcement.
-- This extends the Gap 2 question-metering RPCs (20260626120000) with a maintained
-- tokens_consumed counter, updated in the same lazy-monthly-reset transaction as
-- questions_consumed, so david-chat's existing pre-flight can check both without a
-- second mechanism or a per-request SUM over david_usage_logs.

ALTER TABLE public.david_facility_access
  ADD COLUMN IF NOT EXISTS tokens_consumed bigint NOT NULL DEFAULT 0;

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
          tokens_consumed    = 0,
          period_start       = m,
          updated_at         = now()
      WHERE facility_id = p_facility_id
      RETURNING * INTO rec;
  END IF;
  RETURN rec;
END;
$$;

-- Signature grows by one arg (p_tokens). DROP first: CREATE OR REPLACE cannot change a
-- function's argument list, and leaving the old 2-arg overload in place alongside a new
-- 3-arg-with-default one would leave david-chat's 2-arg calls resolving to the stale
-- version that never touches tokens_consumed.
DROP FUNCTION IF EXISTS public.david_consume_question(text, boolean);

CREATE FUNCTION public.david_consume_question(p_facility_id text, p_is_reserve boolean DEFAULT false, p_tokens integer DEFAULT 0)
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
    rec.tokens_consumed    := 0;
    rec.period_start       := m;
  END IF;
  UPDATE public.david_facility_access
    SET questions_consumed = rec.questions_consumed + 1,
        reserve_consumed   = rec.reserve_consumed + (CASE WHEN p_is_reserve THEN 1 ELSE 0 END),
        tokens_consumed    = rec.tokens_consumed + GREATEST(p_tokens, 0),
        period_start       = m,
        updated_at         = now()
    WHERE facility_id = p_facility_id
    RETURNING * INTO rec;
  RETURN rec;
END;
$$;

GRANT EXECUTE ON FUNCTION public.david_get_quota(text)                          TO service_role;
GRANT EXECUTE ON FUNCTION public.david_consume_question(text, boolean, integer) TO service_role;
