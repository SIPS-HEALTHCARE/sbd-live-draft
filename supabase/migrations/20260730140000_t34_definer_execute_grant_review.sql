-- 20260730140000_t34_definer_execute_grant_review.sql
-- T34 — every SECURITY DEFINER function in public is executable by anon and authenticated
-- by Postgres's default (EXECUTE granted to PUBLIC on CREATE FUNCTION, never revoked, nobody
-- granted it on purpose). Advisor counts ~55 authenticated-executable / ~53 anon-executable.
-- Measured 29 July via:
--   select p.oid::regprocedure::text as fn,
--          has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed_exec
--   from pg_proc p
--   where p.pronamespace = 'public'::regnamespace and p.prosecdef
--     and (has_function_privilege('anon', p.oid, 'EXECUTE')
--          or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
--   order by fn;
-- -> 58 signatures. 28 are aip_* (a different property sharing this database) -- NOT ours,
-- untouched by this migration, flagged to Shawn as a separate matter. The remaining 30 are
-- ours and are reviewed below, one by one, keep-or-revoke with a recorded reason.
--
-- IMPORTANT Postgres semantics this migration depends on: has_function_privilege() reports
-- EFFECTIVE privilege, which is satisfied by the implicit PUBLIC grant every function gets on
-- creation. `revoke execute ... from anon, authenticated` alone is a no-op here -- neither role
-- ever received a direct grant, the access comes entirely through PUBLIC membership. The actual
-- fix is `revoke ... from public`, then `grant ... to authenticated` explicitly for the keepers.
-- (`create or replace function` does not reset grants once set -- confirmed by
-- 20260717130000's note on david_usage_by_app_mtd -- so this migration's grants are durable
-- against later body edits to the same functions.)
--
-- Several of the 30 (noted per-function below) predate this repo's migration history --
-- dashboard-created objects, the same class of gap already documented for sbd_is_master_admin,
-- get_user_fid/get_user_role, david_usage_by_app_mtd, sbd_network_stats and sbd_calc_points
-- (20260717120000, 20260717130000, 20260728060000). Their exact argument signatures are not
-- recoverable from this repo, so both passes below resolve functions by NAME against the live
-- pg_proc catalog (mirrors 20260728060000's search_path loop) rather than hardcoding arg lists
-- that could be wrong.
--
-- ── Category 1 — RLS policy helpers. REVOKING AUTHENTICATED BREAKS THE PLATFORM: these run
-- inside RLS USING/WITH CHECK clauses with the querying user's own privileges, so every
-- signed-in session needs EXECUTE just to load a page. All 16 below keep authenticated.
--   sbd_get_user_role           -- role gate on reg_select/pr_select and others (20260726210000, 20260727004500, ...)
--   sbd_get_user_facility       -- facility-scoped read policies (20260726234500, 20260727000500, ...)
--   sbd_get_user_system         -- system_admin facility-scoping (live policy, not in tracked migrations)
--   sbd_get_assigned_facilities -- staff_admin assigned-facility scoping (live policy, not in tracked migrations)
--   sbd_is_admin                -- write gate: transfer_requests/hospital_systems/practice_attempts/activity_log/pin_attempts
--   sbd_is_assessor              -- #73 assessor-capability gate; observation write-lockdown (20260723140000)
--   sbd_is_master_admin         -- master-admin branch on ~15 tracked policies (observations, preceptor, registrations, placement_reviews, ...)
--   sbd_is_system_admin         -- F&I assignment-write gate (20260707120000)
--   sbd_owns_staff               -- self-row ownership check (live policy, not in tracked migrations)
--   sbd_obs_facility_scope       -- observation facility-scoping RLS (20260703140000)
--   sbd_fi_can_manage_assignments -- F&I assignment write gate (20260707120000)
--   sbd_fi_leader_scope          -- F&I leader-scope RLS (20260702130000, 20260703120000, 20260722140000)
--   sbd_fi_actor_role            -- F&I actor-role helper (20260702130000)
--   sbd_leads_facility_of        -- #73 educator-capability facility scoping (20260722140000)
--   get_user_fid                 -- legacy helper; T22 (20260726210000) and T45 (20260728060000) both treat it as
--                                    still live outside this repo's tracked migrations -- not proven dead, kept
--   get_user_role                -- legacy helper; same evidence/treatment as get_user_fid
--
-- ANON is deliberately NOT re-granted on any of the 16 above. The only anon-reachable write
-- path in this schema is the public registration submission INSERT (table `registrations`,
-- policy "Allow public registration submission" per 20260727004500's own account of it -- a
-- live, dashboard-created, unconditional allow that predates this repo's tracked history the
-- same way sbd_is_master_admin does). It runs before any sbd_portal_users row exists for the
-- visitor, so an identity/role/facility lookup can't do anything useful for that caller, and
-- none of the 16 helpers above read anything but auth.uid()/sbd_portal_users. This can't be
-- re-verified against the live policy text from this repo (no prod DB access here) -- BEFORE
-- applying, confirm with:
--   select polname, pg_get_expr(polqual,polrelid), pg_get_expr(polwithcheck,polrelid)
--   from pg_policy where polrelid = 'public.registrations'::regclass;
-- and check the anon-facing policy's check does not reference any function in the list above.
-- If it does, add that one function's name to the anon-grant loop below before applying.
--
-- ── Category 2 — trigger functions. Triggers fire as the table owner; callers never need
-- EXECUTE. Revoking from both roles is pure attack-surface reduction (today an anon caller can
-- invoke e.g. sbd_guard_staff_privileged_columns() directly via RPC, which does nothing useful
-- but is needlessly open). No re-grant to anyone.
--   sbd_guard_portal_user_privileges       -- trigger on sbd_portal_users (20260726214500)
--   sbd_guard_staff_privileged_columns     -- trigger on staff (20260726230000)
--   sbd_on_password_reset_created          -- password-reset trigger (live, not in tracked migrations)
--   sbd_on_registration_approved           -- registration-approval trigger (live, not in tracked migrations)
--   sbd_on_registration_submitted          -- registration-submission trigger (live, not in tracked migrations)
--   sbd_set_password_notice_on_new_account -- trigger on sbd_portal_users (20260727030000)
--   sbd_fi_progress_guard                  -- trigger on foundations/instrument progress (20260702130000)
--   sbd_fi_progress_status_sync            -- trigger on foundations/instrument progress (20260702130000)
--   sbd_fi_assignment_fill                 -- trigger on foundations/instrument assignments (20260702130000)
--   touch_updated_at                       -- generic updated_at trigger (live, not in tracked migrations)
--
-- ── Category 3 — RPCs called from the app. Keep for actual callers only.
--   sbd_set_user_capabilities(uuid,jsonb) -- KEEP authenticated: the ONE browser-called function
--     (api-supabase.js setUserCapabilities via /rest/v1/rpc/sbd_set_user_capabilities); already
--     authenticated-only (no anon), does its own master-admin check in-body (20260722140000).
--   david_usage_by_app_mtd()               -- KEEP authenticated: called from
--     david-command-center.html with the signed-in user's own Bearer token (not anon); does its
--     own master-admin check in-body (20260717130000).
--   sbd_network_stats(text[])              -- REVOKE, no re-grant: grepped ui-views.js,
--     api-supabase.js, every src/js/*.js and supabase/functions/*/index.ts, and the whole repo
--     for the literal name -- zero callers.
--   sbd_calc_points(integer)               -- REVOKE, no re-grant: same repo-wide grep, zero
--     callers. (Not to be confused with the client-side calcAttendancePoints() in
--     logic.js/utils.js -- unrelated, not a DB function.)
--
-- aip_* (28 functions, incl. aip_admin_login and friends being anon-executable) belong to a
-- different property on this shared database. NOT touched here -- flagged to Shawn per the
-- ticket, his call whether/how to remediate on that side.

begin;

-- Step 1: revoke the implicit PUBLIC grant from every one of our 30 reviewed functions.
-- Name-driven (not signature-driven) for the reason above -- several have no migration file
-- in this repo to read an exact arg list from.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prosecdef
      and p.proname in (
        'sbd_get_user_role','sbd_get_user_facility','sbd_get_user_system',
        'sbd_get_assigned_facilities','sbd_is_admin','sbd_is_assessor','sbd_is_master_admin',
        'sbd_is_system_admin','sbd_owns_staff','sbd_obs_facility_scope',
        'sbd_fi_can_manage_assignments','sbd_fi_leader_scope','sbd_fi_actor_role',
        'sbd_leads_facility_of','get_user_fid','get_user_role',
        'sbd_guard_portal_user_privileges','sbd_guard_staff_privileged_columns',
        'sbd_on_password_reset_created','sbd_on_registration_approved',
        'sbd_on_registration_submitted','sbd_set_password_notice_on_new_account',
        'sbd_fi_progress_guard','sbd_fi_progress_status_sync','sbd_fi_assignment_fill',
        'touch_updated_at',
        'sbd_set_user_capabilities','david_usage_by_app_mtd','sbd_network_stats','sbd_calc_points'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;

-- Step 2: re-grant authenticated EXECUTE to exactly the 18 functions with a caller that needs
-- it (category 1's 16 policy helpers + category 3's 2 used RPCs). The other 12 (category 2's
-- 10 triggers + category 3's 2 unused RPCs) get nothing back -- see the comments above for why,
-- per function.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prosecdef
      and p.proname in (
        'sbd_get_user_role','sbd_get_user_facility','sbd_get_user_system',
        'sbd_get_assigned_facilities','sbd_is_admin','sbd_is_assessor','sbd_is_master_admin',
        'sbd_is_system_admin','sbd_owns_staff','sbd_obs_facility_scope',
        'sbd_fi_can_manage_assignments','sbd_fi_leader_scope','sbd_fi_actor_role',
        'sbd_leads_facility_of','get_user_fid','get_user_role',
        'sbd_set_user_capabilities','david_usage_by_app_mtd'
      )
  loop
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;

commit;

-- Verification (done-when):
-- 1. Re-run the measurement query at the top of this file. For every one of our 30 functions:
--      authed_exec = true  only for the 18 named in step 2 above.
--      anon_exec   = false for all 30 (nothing in this batch needed anon; see the anon-trace
--                    note above -- re-check it if that assumption turns out wrong).
--    The aip_* 28 are untouched and will still show up in the raw measurement -- that's
--    expected, they're out of scope for this migration.
-- 2. Advisor's exposed-function count drops by the 12 revoked-with-no-regrant + whatever
--    portion of the 30 previously had anon access.
-- 3. Full click-through: sign in as staff, leader (hospital/facility_admin) and admin --
--    dashboards, schedule, attendance, observations, placement all load (proves no policy
--    helper lost its authenticated grant). Anonymous registration submit still works (proves
--    the anon trace above was right; if it breaks, the registration policy references one of
--    the 16 helpers after all -- add it to the anon-grant list and re-apply).
-- 4. The aip_* list stays flagged to Shawn, untouched by this migration.
