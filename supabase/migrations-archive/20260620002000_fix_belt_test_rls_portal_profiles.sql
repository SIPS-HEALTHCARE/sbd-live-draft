-- ============================================================================
-- MVP belt-test RLS fix
--
-- The original belt-test policies read app roles/facility/staff IDs from custom
-- JWT claims. Those claims are not guaranteed in this app; the reliable source
-- is sbd_portal_users keyed by auth.uid(). Keep the existing MVP browser-side
-- result submission, but make RLS evaluate against portal profiles.
-- ============================================================================

-- Generated tests: read-only for clients; writes stay service-role edge fn.
DROP POLICY IF EXISTS "bt_master_all" ON public.sbd_belt_tests;
DROP POLICY IF EXISTS "bt_admin_select" ON public.sbd_belt_tests;
DROP POLICY IF EXISTS "bt_staff_admin_select" ON public.sbd_belt_tests;
DROP POLICY IF EXISTS "bt_facility_select" ON public.sbd_belt_tests;
DROP POLICY IF EXISTS "bt_system_select" ON public.sbd_belt_tests;
DROP POLICY IF EXISTS "bt_member_self_select" ON public.sbd_belt_tests;

CREATE POLICY "bt_admin_select" ON public.sbd_belt_tests
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role IN ('master_admin', 'admin')
    )
    OR lower(coalesce(auth.jwt()->>'email', '')) IN
       ('jjacobs@sipsconsults.com', 'izambrano@sipsconsults.com', 'dpayne@sipsconsults.com')
);

CREATE POLICY "bt_staff_admin_select" ON public.sbd_belt_tests
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'staff_admin'
          AND EXISTS (
              SELECT 1
              FROM unnest(u.assigned_facility_ids) AS assigned(fid)
              WHERE assigned.fid::text = sbd_belt_tests.facility_id::text
          )
    )
);

CREATE POLICY "bt_facility_select" ON public.sbd_belt_tests
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role IN ('facility_admin', 'hospital')
          AND u.facility_id::text = sbd_belt_tests.facility_id::text
    )
);

CREATE POLICY "bt_system_select" ON public.sbd_belt_tests
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        JOIN public.facilities f ON f.system_id::text = u.system_id::text
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'system_admin'
          AND f.id::text = sbd_belt_tests.facility_id::text
    )
);

CREATE POLICY "bt_member_self_select" ON public.sbd_belt_tests
FOR SELECT TO authenticated
USING (
    sbd_belt_tests.staff_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.staff_id IS NOT NULL
          AND u.staff_id::text = sbd_belt_tests.staff_id::text
    )
);

-- Persisted results: keep MVP client INSERT, fix profile-based scoping.
DROP POLICY IF EXISTS "btr_master_all" ON public.sbd_belt_test_results;
DROP POLICY IF EXISTS "btr_admin_all" ON public.sbd_belt_test_results;
DROP POLICY IF EXISTS "btr_staff_admin_all" ON public.sbd_belt_test_results;
DROP POLICY IF EXISTS "btr_facility_all" ON public.sbd_belt_test_results;
DROP POLICY IF EXISTS "btr_system_select" ON public.sbd_belt_test_results;
DROP POLICY IF EXISTS "btr_hospital_select" ON public.sbd_belt_test_results;
DROP POLICY IF EXISTS "btr_member_self_insert" ON public.sbd_belt_test_results;
DROP POLICY IF EXISTS "btr_member_self_select" ON public.sbd_belt_test_results;

CREATE POLICY "btr_admin_all" ON public.sbd_belt_test_results
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role IN ('master_admin', 'admin')
    )
    OR lower(coalesce(auth.jwt()->>'email', '')) IN
       ('jjacobs@sipsconsults.com', 'izambrano@sipsconsults.com', 'dpayne@sipsconsults.com')
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role IN ('master_admin', 'admin')
    )
    OR lower(coalesce(auth.jwt()->>'email', '')) IN
       ('jjacobs@sipsconsults.com', 'izambrano@sipsconsults.com', 'dpayne@sipsconsults.com')
);

CREATE POLICY "btr_staff_admin_all" ON public.sbd_belt_test_results
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'staff_admin'
          AND EXISTS (
              SELECT 1
              FROM unnest(u.assigned_facility_ids) AS assigned(fid)
              WHERE assigned.fid::text = sbd_belt_test_results.facility_id::text
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'staff_admin'
          AND EXISTS (
              SELECT 1
              FROM unnest(u.assigned_facility_ids) AS assigned(fid)
              WHERE assigned.fid::text = sbd_belt_test_results.facility_id::text
          )
    )
);

CREATE POLICY "btr_facility_all" ON public.sbd_belt_test_results
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'facility_admin'
          AND u.facility_id::text = sbd_belt_test_results.facility_id::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'facility_admin'
          AND u.facility_id::text = sbd_belt_test_results.facility_id::text
    )
);

CREATE POLICY "btr_hospital_select" ON public.sbd_belt_test_results
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'hospital'
          AND u.facility_id::text = sbd_belt_test_results.facility_id::text
    )
);

CREATE POLICY "btr_system_select" ON public.sbd_belt_test_results
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        JOIN public.facilities f ON f.system_id::text = u.system_id::text
        WHERE u.auth_uid = auth.uid()
          AND u.role = 'system_admin'
          AND f.id::text = sbd_belt_test_results.facility_id::text
    )
);

CREATE POLICY "btr_member_self_insert" ON public.sbd_belt_test_results
FOR INSERT TO authenticated
WITH CHECK (
    sbd_belt_test_results.staff_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.staff_id IS NOT NULL
          AND u.staff_id::text = sbd_belt_test_results.staff_id::text
    )
);

CREATE POLICY "btr_member_self_select" ON public.sbd_belt_test_results
FOR SELECT TO authenticated
USING (
    sbd_belt_test_results.staff_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.sbd_portal_users u
        WHERE u.auth_uid = auth.uid()
          AND u.staff_id IS NOT NULL
          AND u.staff_id::text = sbd_belt_test_results.staff_id::text
    )
);
