-- T33 verification — run AFTER applying 20260904120000_t33_admin_mfa_aal2_gate.sql
-- and its follow-up 20260904130000_t33_mfa_gate_extend_tables.sql
-- (which itself runs AFTER the frontend + edge-function deploys — see the deploy
-- order in docs/decisions/2026-08-12-t33-admin-mfa-retention-interface-gate.md).
--
-- Read-only. Every statement is a SELECT; nothing here writes.
--
-- T33's done-when says the per-role interface restrictions are "applied and read
-- back". §1–§4 read the applied state back from the live catalog. §5 is the
-- real-session read-back procedure (run by hand — it needs a real admin login).

\echo '=== 1. The predicate exists, definer, stable, pinned search_path ==='
select p.proname,
       p.prosecdef   as security_definer,   -- expect t
       p.provolatile as volatility,         -- expect 's' (stable)
       p.proconfig   as settings            -- expect {search_path=public}
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'sbd_mfa_satisfied';
-- Expect exactly one row.

\echo '=== 2. sbd_mfa_satisfied is not executable by anon or public ==='
select p.proname, pg_get_userbyid(acl.grantee) as grantee, acl.privilege_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
where n.nspname = 'public' and p.proname = 'sbd_mfa_satisfied'
order by grantee;
-- Expect: authenticated, service_role and the owner only. 'anon'/'public' must NOT appear.

\echo '=== 3. sbd_is_admin() now requires the MFA predicate ==='
select p.proname, p.prosrc like '%sbd_mfa_satisfied%' as gated_on_mfa
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'sbd_is_admin';
-- Expect: gated_on_mfa = t.

\echo '=== 4. Every belt-platform table carries the RESTRICTIVE sbd_mfa_gate ==='
select tablename, policyname, permissive, cmd, roles
from pg_policies
where schemaname = 'public' and policyname like 'sbd_mfa_gate%'
order by tablename, policyname;
-- Expect: permissive = 'RESTRICTIVE' on EVERY row; roles = {authenticated}.
-- Expect sbd_portal_users to appear four times (select/insert/update/delete),
-- everything else once with cmd = ALL.

\echo '=== 4b. RLS-enabled belt tables that are MISSING the gate (expect zero rows) ==='
select c.relname as ungated_table
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and (c.relname like 'sbd\_%' or c.relname like 'david\_%'
       or c.relname like 'foundations\_%' or c.relname like 'instrument\_%'
       or c.relname like 'observation%' or c.relname like 'preceptor\_%'
       or c.relname like 'script\_%' or c.relname like 'ps\_%'
       or c.relname in ('facilities','staff','assessment_history','registrations',
                        'placement_reviews','hospital_systems','transfer_requests',
                        'practice_scores','practice_attempts','activity_log',
                        'assessment_pin_attempts','staff_history',
                        'schedule','attendance','promotion_approvals','user_profiles',
                        'free_agents','facility_shifts','assessment_queue',
                        'user_onboarding','assistant_memory'))
  and not exists (
    select 1 from pg_policy pol
    where pol.polrelid = c.oid and pol.polname like 'sbd_mfa_gate%');
-- Expect: zero rows. Any row here is a belt table the gate loop missed
-- (e.g. created after 2026-09-04 — add it to a follow-up migration's list, as
-- 20260904130000 did for observation*/preceptor_*/script_*/ps_*/user_onboarding).

-- ═══ 5. Real-session read-back (manual — needs a real admin sign-in) ═══════════
-- a) Sign in at belt.sterilebydesign.ai as an admin WITHOUT completing the TOTP
--    step (possible only by scripting the password grant):
--      curl -s '$SB_URL/auth/v1/token?grant_type=password' -H 'apikey: $ANON' \
--        -H 'Content-Type: application/json' -d '{"email":"...","password":"..."}'
--    With that aal1 access_token:
--      curl -s '$SB_URL/rest/v1/staff?select=id&limit=5' \
--        -H 'apikey: $ANON' -H 'Authorization: Bearer <aal1 token>'
--    Expect: [] (empty — the gate holds).
-- b) Sign in through the app, complete the TOTP challenge, copy the session's
--    access_token from localStorage.sbd_session, repeat the staff read.
--    Expect: rows (normal admin scope restored at aal2).
-- c) Sign in as a staff_member (no MFA prompt expected) and confirm their own
--    dashboard still loads — non-admin roles are untouched.
