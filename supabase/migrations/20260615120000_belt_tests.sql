-- ============================================================================
-- Dynamic Belt Test (Track A4) — schema
--   sbd_belt_tests          generated, per-learner test (questions + seed)
--   sbd_belt_test_results   persisted AssessmentResult (spec §12, never recomputed)
-- RLS mirrors sbd_assessment_queue / placement_reviews:
--   master_admin: all · staff_admin: assigned_facility_ids · facility_admin/
--   hospital: own facility · staff_member: own staff_id.
-- Test rows are WRITTEN by the service-role edge fn only (no client INSERT).
-- ============================================================================

-- ── Generated tests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sbd_belt_tests (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id       uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    facility_id    uuid REFERENCES public.facilities(id),
    queue_ids      jsonb DEFAULT '[]'::jsonb,        -- approved Competency+Simulation queue rows this test satisfies
    target_belt    text NOT NULL CHECK (target_belt IN ('White','Yellow','Green','Blue','Brown','Black')),
    seed           bigint NOT NULL,                  -- deriveSeed(staff,belt,date) — regeneration is deterministic
    test_date      date NOT NULL DEFAULT CURRENT_DATE,
    questions      jsonb NOT NULL,                   -- { knowledge:[..], simulation:[..] } incl correct/rubric/skeleton_slot/variant_status
    variant_status text NOT NULL DEFAULT 'fallback' CHECK (variant_status IN ('ai','fallback','mixed')),
    status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','submitted','expired','void')),
    created_at     timestamptz NOT NULL DEFAULT now(),
    submitted_at   timestamptz
);

-- One ACTIVE test per (staff, belt) — makes generation idempotent ("reload returns the same test").
CREATE UNIQUE INDEX IF NOT EXISTS sbd_belt_tests_active_uq
    ON public.sbd_belt_tests (staff_id, target_belt)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS sbd_belt_tests_staff_idx ON public.sbd_belt_tests (staff_id);
CREATE INDEX IF NOT EXISTS sbd_belt_tests_fac_idx   ON public.sbd_belt_tests (facility_id);

ALTER TABLE public.sbd_belt_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bt_master_all" ON public.sbd_belt_tests FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'master_admin')
    WITH CHECK (auth.jwt()->>'role' = 'master_admin');
CREATE POLICY "bt_staff_admin_select" ON public.sbd_belt_tests FOR SELECT TO authenticated
    USING (auth.jwt()->>'role' = 'staff_admin'
           AND facility_id = ANY((SELECT assigned_facility_ids FROM public.sbd_portal_users WHERE auth_uid = auth.uid())));
CREATE POLICY "bt_facility_select" ON public.sbd_belt_tests FOR SELECT TO authenticated
    USING (facility_id = (auth.jwt()->>'facility_id')::uuid);
CREATE POLICY "bt_member_self_select" ON public.sbd_belt_tests FOR SELECT TO authenticated
    USING (staff_id = (auth.jwt()->>'staff_id')::uuid);
-- NOTE: no client INSERT/UPDATE policy — the generation edge function uses the
-- service role and bypasses RLS. Candidates can read their own test, not write it.

-- ── Persisted results (spec §12) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sbd_belt_test_results (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                 uuid REFERENCES public.sbd_belt_tests(id) ON DELETE SET NULL,
    staff_id                uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    facility_id             uuid REFERENCES public.facilities(id),
    target_belt             text NOT NULL,
    submitted_at            timestamptz NOT NULL DEFAULT now(),
    scored_at               timestamptz NOT NULL DEFAULT now(),
    -- Knowledge
    k_level_scores          jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { L1..L5 }
    k_overall               numeric,
    k_floor_results         jsonb NOT NULL DEFAULT '[]'::jsonb,
    k_overall_passed        boolean,
    -- Simulation
    sim_responses           jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ question_id, level, score }]
    sim_level_avgs          jsonb NOT NULL DEFAULT '{}'::jsonb,
    sim_overall             numeric,
    sim_floor_results       jsonb NOT NULL DEFAULT '[]'::jsonb,
    sim_individual_min      numeric,
    sim_overall_passed      boolean,
    -- Blended
    blended_score           numeric,
    blended_passed          boolean,
    -- Suggestion
    system_suggestion       text,
    outcome                 text CHECK (outcome IN ('PASS','CONDITIONAL_PASS','REMEDIATION')),
    suggestion_reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
    conditions              jsonb NOT NULL DEFAULT '[]'::jsonb,
    watch_flags             jsonb NOT NULL DEFAULT '[]'::jsonb,
    remediation_flags       jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- Final / override (present-but-unused at v1; assessor surface populates later)
    final_belt              text,
    override_applied        boolean NOT NULL DEFAULT false,
    override_by             uuid,
    override_justification  text,
    override_at             timestamptz,
    status                  text NOT NULL DEFAULT 'PENDING_REVIEW'
                              CHECK (status IN ('PENDING_REVIEW','ACCEPTED','OVERRIDDEN','REMEDIATION_REQUIRED')),
    created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sbd_btr_staff_idx  ON public.sbd_belt_test_results (staff_id);
CREATE INDEX IF NOT EXISTS sbd_btr_fac_idx    ON public.sbd_belt_test_results (facility_id);
CREATE INDEX IF NOT EXISTS sbd_btr_status_idx ON public.sbd_belt_test_results (status);

ALTER TABLE public.sbd_belt_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "btr_master_all" ON public.sbd_belt_test_results FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'master_admin')
    WITH CHECK (auth.jwt()->>'role' = 'master_admin');
CREATE POLICY "btr_staff_admin_all" ON public.sbd_belt_test_results FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'staff_admin'
           AND facility_id = ANY((SELECT assigned_facility_ids FROM public.sbd_portal_users WHERE auth_uid = auth.uid())))
    WITH CHECK (auth.jwt()->>'role' = 'staff_admin'
           AND facility_id = ANY((SELECT assigned_facility_ids FROM public.sbd_portal_users WHERE auth_uid = auth.uid())));
CREATE POLICY "btr_facility_all" ON public.sbd_belt_test_results FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'facility_admin' AND facility_id = (auth.jwt()->>'facility_id')::uuid)
    WITH CHECK (auth.jwt()->>'role' = 'facility_admin' AND facility_id = (auth.jwt()->>'facility_id')::uuid);
CREATE POLICY "btr_hospital_select" ON public.sbd_belt_test_results FOR SELECT TO authenticated
    USING (facility_id = (auth.jwt()->>'facility_id')::uuid);
-- Candidate may submit (INSERT) and read their own result; they may NOT update it
-- (acceptance/override is an assessor action — spec §11).
CREATE POLICY "btr_member_self_insert" ON public.sbd_belt_test_results FOR INSERT TO authenticated
    WITH CHECK (staff_id = (auth.jwt()->>'staff_id')::uuid);
CREATE POLICY "btr_member_self_select" ON public.sbd_belt_test_results FOR SELECT TO authenticated
    USING (staff_id = (auth.jwt()->>'staff_id')::uuid);

-- Close the generated active test when the candidate submits a persisted result.
-- This preserves the "one active test" invariant without granting client UPDATE
-- access on the stored question row.
CREATE OR REPLACE FUNCTION public.sbd_mark_belt_test_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.test_id IS NOT NULL THEN
        UPDATE public.sbd_belt_tests
        SET status = 'submitted',
            submitted_at = COALESCE(NEW.submitted_at, now())
        WHERE id = NEW.test_id
          AND staff_id = NEW.staff_id
          AND status = 'active';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sbd_btr_mark_test_submitted ON public.sbd_belt_test_results;
CREATE TRIGGER sbd_btr_mark_test_submitted
AFTER INSERT ON public.sbd_belt_test_results
FOR EACH ROW
EXECUTE FUNCTION public.sbd_mark_belt_test_submitted();
