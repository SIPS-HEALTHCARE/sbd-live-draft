-- #719 (T74) verification — run AFTER applying
-- 20260828120000_719_t74_assessor_scope_remaining_tables.sql.
--
-- Read-only. Every statement is a SELECT; nothing here writes.

\echo '=== 1. No policy in the database still calls the zero-arg (system-wide) assessor gate ==='
select c.relname as table_name, pol.polname, pol.polcmd::text as cmd
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
where coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')      like '%sbd_is_assessor()%'
   or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') like '%sbd_is_assessor()%'
order by table_name, polname;
-- Expect: ZERO rows. Any row here is a table where an assessor's facility list does not bite.
-- (The zero-arg function itself stays — nav visibility and effIsAssessor still need
-- "an assessor at all" — it just must not gate any table.)

\echo '=== 2. Both join helpers exist, definer, stable, search_path pinned ==='
select p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef  as security_definer,
       p.provolatile as volatility,   -- expect 's'
       p.proconfig   as settings      -- expect {search_path=public}
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('sbd_is_assessor_for_staff','sbd_is_assessor_for_observation')
order by p.proname;
-- Expect: both rows, security_definer = t.

\echo '=== 3. Neither helper is executable by anon or public ==='
select p.proname, a.grantee, a.privilege_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
join lateral (select pg_get_userbyid(acl.grantee) as grantee,
                     acl.privilege_type          as privilege_type) a on true
where n.nspname = 'public'
  and p.proname in ('sbd_is_assessor_for_staff','sbd_is_assessor_for_observation')
order by p.proname, a.grantee;
-- Expect: authenticated, service_role and the owner only. 'anon' and 'public' must NOT appear.

\echo '=== 4. The ten rewritten policies carry the scoped branch and kept their others ==='
select c.relname as table_name,
       pol.polname,
       pol.polcmd::text as cmd,
       coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
         || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') as expr
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
where c.relname in ('observation_remediations','observation_audits',
                    'observation_overrides','ps_completion_requests')
order by table_name, polname;
-- Eyeball against the migration:
--   orm_*                     sbd_is_assessor(fid); select keeps own-row + sbd_obs_facility_scope
--   oa_*                      sbd_is_assessor_for_observation(observation_id); select keeps the
--                             sbd_obs_facility_scope EXISTS
--   oo_insert/oo_update       sbd_is_assessor_for_staff(staff_id)
--   oo_select                 UNCHANGED: master + system_admin only (#50/#54 ruling)
--   oo_delete                 UNCHANGED: master only
--   pscr_select/pscr_update   sbd_is_assessor(facility_id); keep own-row, master,
--                             sbd_leads_facility_of(staff_id)
--   pscr_insert               UNCHANGED: staff_id = auth.uid() and status = 'pending'

\echo '=== 5. Predicate spot-check: a scoped grant answers per facility, absent list is system wide ==='
select u.name, u.role,
       u.capabilities->'assessor_facilities' as assessor_facilities
from public.sbd_portal_users u
where coalesce((u.capabilities->>'assessor')::boolean, false)
order by u.name;
-- Holders with a list are now refused writes on all four tables at any facility not in it;
-- a holder with no list (system wide) is unchanged everywhere. Confirm one scoped account by
-- signing in and attempting a remediation write at a non-listed facility: RLS must refuse it.
