-- T79 verification — run AFTER applying 20260812120000_t79_split_assessment_grants.sql
-- and AFTER redeploying sbd-assessor-pin and sbd-record-assessment.
--
-- Read-only. Every statement is a SELECT; nothing here writes.
--
-- Why this file exists: the T79 design note could only verify against the migration files, because
-- the Supabase MCP has no access to this project. These queries confirm the same facts against the
-- live database, including the one claim the repo cannot prove on its own — that a 'sips_admin'
-- row reaches nothing.

\echo '=== 1. Both grant helpers exist, with the right signature and posture ==='
select p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef                               as security_definer,
       p.provolatile                             as volatility,   -- expect 's' (stable)
       p.proconfig                               as settings      -- expect {search_path=public}
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('sbd_can_issue_pin','sbd_can_approve_assessment','sbd_is_assessor')
order by p.proname, args;
-- Expect: sbd_can_approve_assessment(p_fid uuid), sbd_can_issue_pin(p_fid uuid),
--         sbd_is_assessor() and sbd_is_assessor(p_fid uuid). All security_definer = t.

\echo '=== 2. Neither helper is executable by anon or public ==='
select p.proname, a.grantee, a.privilege_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
join lateral (select pg_get_userbyid(acl.grantee) as grantee,
                     acl.privilege_type          as privilege_type) a on true
where n.nspname = 'public'
  and p.proname in ('sbd_can_issue_pin','sbd_can_approve_assessment')
order by p.proname, a.grantee;
-- Expect: authenticated, service_role and the owner only. 'anon' and 'public' must NOT appear.

\echo '=== 3. The queue policies carry the approve grant and NOT the PIN grant ==='
select polname,
       cmd,
       qual   like '%sbd_can_approve_assessment%' as honours_approve_grant,
       qual   like '%sbd_can_issue_pin%'          as wrongly_honours_pin_grant,
       qual   like '%sbd_is_assessor%'            as keeps_assessor_branch,
       qual   like '%staff_admin%'                as keeps_role_branch
from (
  select pol.polname,
         pol.polcmd::text as cmd,
         pg_get_expr(pol.polqual, pol.polrelid) as qual
  from pg_policy pol
  where pol.polrelid = 'public.sbd_assessment_queue'::regclass
) t
order by polname;
-- Expect for aq_select and aq_update: honours_approve_grant = t,
--   wrongly_honours_pin_grant = f, keeps_assessor_branch = t, keeps_role_branch = t.
-- wrongly_honours_pin_grant = t on EITHER policy means the two permissions have re-bundled.

\echo '=== 3b. staff_select lets both grants READ, and kept its pre-T79 branches ==='
select polname,
       cmd,
       qual like '%sbd_can_issue_pin%'          as pin_grant_can_read,
       qual like '%sbd_can_approve_assessment%' as approve_grant_can_read,
       qual like '%sbd_is_assessor(fid)%'       as keeps_assessor_branch,
       qual like '%id = auth.uid()%'            as keeps_own_row_branch,
       qual like '%get_user_fid%'               as keeps_own_facility_branch
from (
  select pol.polname,
         pol.polcmd::text as cmd,
         pg_get_expr(pol.polqual, pol.polrelid) as qual
  from pg_policy pol
  where pol.polrelid = 'public.staff'::regclass
    and pol.polname = 'staff_select'
) t;
-- Expect: cmd = r (select), and every column above = t. A grant that can write but not read is
-- half-shipped: RLS returns fewer rows silently, so the candidate list just looks empty.
-- If keeps_* goes false, a branch was dropped while re-creating the policy — restore from
-- 20260730170000 immediately.

\echo '=== 4. No policy anywhere in the database mentions sips_admin ==='
select c.relname as table_name, pol.polname, pol.polcmd::text as cmd
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
where coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')      like '%sips_admin%'
   or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') like '%sips_admin%'
order by table_name, polname;
-- Expect: ZERO rows. Any row here is a SIPS admin that does not start empty.

\echo '=== 5. No function body mentions sips_admin either (covers sbd_get_user_role et al) ==='
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and pg_get_functiondef(p.oid) like '%sips_admin%'
order by p.proname;
-- Expect: ZERO rows. Note sbd_get_user_role() exists in no migration file (a pre-existing B2
-- violation) so this is the only way to see what it actually does with an unknown role.

\echo '=== 6. Who holds what today ==='
select u.email,
       u.role,
       u.active,
       coalesce((u.capabilities->>'assessor')::boolean, false)           as assessor,
       coalesce((u.capabilities->>'issue_pin')::boolean, false)          as can_issue_pin,
       coalesce((u.capabilities->>'approve_assessment')::boolean, false) as can_approve,
       u.capabilities->'issue_pin_facilities'                            as pin_facilities,
       u.capabilities->'approve_assessment_facilities'                   as approve_facilities
from public.sbd_portal_users u
where u.role = 'sips_admin'
   or u.capabilities ? 'issue_pin'
   or u.capabilities ? 'approve_assessment'
   or u.capabilities ? 'assessor'
order by u.role, u.email;
-- Immediately after applying: no row should show can_issue_pin or can_approve, because nothing
-- has been granted yet. The pre-existing capabilities.assessor holders are expected and unchanged.
-- A NULL facilities column means the grant is system wide — that is the documented semantic, not
-- a missing value.

\echo '=== 7. Any sips_admin account with no grants at all (should reach nothing) ==='
select u.email, u.active, u.capabilities
from public.sbd_portal_users u
where u.role = 'sips_admin'
  and coalesce((u.capabilities->>'issue_pin')::boolean, false) = false
  and coalesce((u.capabilities->>'approve_assessment')::boolean, false) = false
  and coalesce((u.capabilities->>'assessor')::boolean, false) = false
order by u.email;
-- These accounts can log in and see Settings. Every assessment screen and every write is refused
-- server side. Confirm by signing in as one before handing it to the client.
