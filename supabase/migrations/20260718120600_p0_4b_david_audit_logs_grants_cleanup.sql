-- P0-4b (2026-07-18) · david_audit_logs — grant cleanup (follow-up to P0-4).
-- Finding (from P0_verify_READONLY output after applying 20260718120300): P0-4 revoked only
-- INSERT. anon AND authenticated still hold the pre-existing SELECT/UPDATE/DELETE/TRUNCATE/
-- REFERENCES/TRIGGER grants inherited from table creation (20260422161200).
--
-- Not currently exploitable via the API — RLS is enabled and enforced for anon/authenticated:
-- SELECT is masked by the master-admin-only policy, UPDATE/DELETE have no permitting policy,
-- and TRUNCATE/REFERENCES/TRIGGER are not reachable through PostgREST. BUT it is least-privilege
-- debt: RLS becomes the SOLE barrier, so if RLS is ever disabled the audit log is wide open to
-- anon (incl. TRUNCATE — which bypasses RLS entirely). This aligns the actual grants with the
-- sweep's stated principle: revoke the over-broad grant AND keep a tight positive policy.
--
-- Fix: REVOKE ALL from anon/authenticated/PUBLIC, then GRANT BACK only authenticated SELECT
-- (required so the existing master-admin SELECT *policy* can evaluate — RLS needs the role to
-- hold the privilege), and service_role ALL. Mirrors the P0-1/P0-2 pattern.
begin;

-- Idempotent: safe to re-run. RLS already enabled by 20260718120300; assert it here too.
alter table public.david_audit_logs enable row level security;

revoke all on public.david_audit_logs from anon;
revoke all on public.david_audit_logs from authenticated;
revoke all on public.david_audit_logs from public;

-- authenticated keeps SELECT only; the "Master Admins can view audit logs" policy
-- (for select to authenticated using auth.jwt()->>'role' = 'master_admin') then narrows
-- actual visibility to master admins. Non-master authenticated: grant present, RLS returns 0 rows.
grant select on public.david_audit_logs to authenticated;

-- Writers are service-role edge functions (david-anomaly-detector, david-admin-api), which
-- bypass RLS. No INSERT/UPDATE/DELETE grant to anon/authenticated by design.
grant all on public.david_audit_logs to service_role;

commit;

-- Verify (expect: anon → no rows; authenticated → SELECT only; service_role → ALL):
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema='public' and table_name='david_audit_logs'
--     and grantee in ('anon','authenticated','public','service_role')
--   order by grantee, privilege_type;
--
-- Rollback (restores the loose inherited grants — revert only):
--   grant select, update, delete, truncate, references, trigger
--     on public.david_audit_logs to anon, authenticated;
