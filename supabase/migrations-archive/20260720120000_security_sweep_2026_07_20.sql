-- ============================================================================
-- SECURITY SWEEP — 2026-07-20 (CONSOLIDATED)
-- Combines the seven 20260720120000..120600 fixes into ONE atomic transaction.
-- Files-only: apply manually (Supabase MCP has no SBD prod access).
-- Runbook:  plans/SECURITY-SWEEP-2026-07-20-APPLY-ORDER.md   (local working doc; plans/ is gitignored)
-- Revert:   scripts/sql-rollback/SECURITY-SWEEP-2026-07-20_REVERT.sql   (manual — NOT in migrations/)
--
-- ⚠ BEFORE PROD — this bundle now includes items that must be smoke-tested on a
--   Supabase PREVIEW BRANCH first (they were previously staged separately):
--     • §5 sbd_assessment_queue / david_facility_access anon-close (logged-in flows)
--     • §6 obi_assessments reads-only  (confirm OBI's public intake form still submits;
--          PostgREST return=representation on POST needs SELECT — see the file header note)
--   And §7 requires the PAIRED edge-fn deploy AFTER this migration:
--     supabase functions deploy sbd-score-assessment
--
-- Why one transaction: DDL + grants + policies are all transactional in Postgres, so a
-- failure anywhere rolls the whole sweep back — no half-applied state.
-- ============================================================================
begin;

-- ── §1 · P0-5a — ROOT CAUSE: stop new functions shipping EXECUTE-to-PUBLIC ────
-- Postgres grants EXECUTE to PUBLIC on every new function by default; that is how
-- exec_sql sat anon-callable for months. Change the default so the §2 sweep is one-time.
-- Forward-looking only: affects functions created AFTER this runs, breaks nothing existing.
alter default privileges in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

-- ── §2 · P0-5b — lock the anon-executable SBD/David SECURITY DEFINER functions ─
-- These run with owner privileges (RLS bypass) yet PUBLIC can call them via PostgREST RPC.
-- The SBD frontend makes ZERO .rpc() calls; the only legit callers are service-role edge
-- functions. Identity PREDICATES (sbd_is_admin, …) are DELIBERATELY EXCLUDED — they run
-- inside RLS policies as the querying role, so revoking their authenticated EXECUTE would
-- break authenticated queries app-wide. Signature-agnostic + idempotent.
do $$
declare
  r record;
  fn_names text[] := array[
    'sbd_approve_registration','sbd_reject_registration','sbd_bulk_insert_staff',
    'sbd_record_assessment_atomic','sbd_mark_belt_test_submitted','sbd_trigger_email_send',
    'sbd_notify_admins_new_registration','rls_auto_enable','search_all_tables',
    'search_all_columns','handle_welcome_email','handle_registration_alert',
    'david_consume_question','david_get_quota','exec_sql'
  ];
begin
  for r in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any (fn_names)
  loop
    execute format('revoke execute on function public.%I(%s) from public, anon, authenticated;', r.proname, r.args);
    execute format('grant execute on function public.%I(%s) to service_role;', r.proname, r.args);
  end loop;
end $$;

-- ── §3 · P1 — drop blanket USING(true) policies on 4 EMPTY scoped tables ──────
-- Each already carries correct facility-scoped RLS that a blanket authenticated policy ORs
-- out. Tables are empty → zero lockout risk. IF EXISTS: a name mismatch is a no-op, not an
-- error (verify with the pg_policies query in the runbook and adjust the name if needed).
drop policy if exists "authenticated_all_attendance"   on public.sbd_attendance;
drop policy if exists "authenticated_all_schedule"      on public.sbd_schedule;
drop policy if exists "authenticated_all_free_agents"   on public.sbd_free_agents;
drop policy if exists "authenticated_all_placement_log" on public.sbd_placement_log;

-- ── §4 · Fix david_audit_logs READ policy (app-role, not JWT Postgres role) ───
-- The prior predicate auth.jwt()->>'role'='master_admin' reads the POSTGRES role
-- ('authenticated'), never an app role → always false. Latent today (frontend reads via
-- the david-admin-api service-role fn), but the policy should encode real intent.
alter table public.david_audit_logs enable row level security;
drop policy if exists "Master Admins can view audit logs" on public.david_audit_logs;
create policy "Master Admins can view audit logs" on public.david_audit_logs
  for select to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role',
             auth.jwt() -> 'user_metadata' ->> 'role') = 'master_admin'
    or exists (
      select 1 from public.sbd_portal_users u
      where (u.id = auth.uid()
             or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
        and u.role = 'master_admin'
    )
    or lower(coalesce(auth.jwt() ->> 'email', '')) in
       ('jjacobs@sipsconsults.com', 'izambrano@sipsconsults.com', 'dpayne@sipsconsults.com')
  );

-- ── §5 · P1 — close anon reads on sbd_assessment_queue + david_facility_access ─
-- ⚠ BRANCH-TEST. Grant-level closure: revoke from anon+public, re-grant authenticated so
-- the logged-in app is unaffected (sbFetch sends the user JWT when logged in). Confirm no
-- genuinely-unauthenticated path reads/submits these before prod.
revoke all on public.sbd_assessment_queue from anon;
revoke all on public.sbd_assessment_queue from public;
grant select, insert, update on public.sbd_assessment_queue to authenticated;
grant all on public.sbd_assessment_queue to service_role;

revoke all on public.david_facility_access from anon;
revoke all on public.david_facility_access from public;
grant select on public.david_facility_access to authenticated;
grant all on public.david_facility_access to service_role;

-- ── §6 · P1 — obi_assessments reads-only lock (Decision A) ────────────────────
-- ⚠ BRANCH-TEST. Revoke anon SELECT (30 people's PII), KEEP anon INSERT (OBI public intake).
-- Risk: PostgREST returns the inserted row on POST by default (needs SELECT) — if OBI's form
-- POSTs without `Prefer: return=minimal`, this breaks it. Test the real intake form on a branch.
revoke select on public.obi_assessments from anon;
revoke select on public.obi_assessments from public;
grant select on public.obi_assessments to authenticated;
grant all on public.obi_assessments to service_role;

-- ── §7 · Anti-abuse — rate-limit backing for sbd-score-assessment (Decision B) ─
-- The scorer stays anon-callable on purpose (stale candidate sessions); the risk is LLM-cost
-- abuse. DB-backed fixed window (holds across Fluid Compute instances). Service-role only.
-- REQUIRES paired deploy after this migration: supabase functions deploy sbd-score-assessment
create table if not exists public.sbd_rate_limit (
  bucket_key   text        primary key,
  window_start timestamptz not null default now(),
  hits         integer     not null default 0
);
alter table public.sbd_rate_limit enable row level security;
revoke all on public.sbd_rate_limit from anon, authenticated, public;
grant all on public.sbd_rate_limit to service_role;

create or replace function public.sbd_rate_limit_check(
  p_key text, p_limit integer, p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now  timestamptz := now();
  v_hits integer;
begin
  insert into public.sbd_rate_limit as rl (bucket_key, window_start, hits)
  values (p_key, v_now, 1)
  on conflict (bucket_key) do update
    set hits = case
                 when rl.window_start < v_now - make_interval(secs => p_window_seconds) then 1
                 else rl.hits + 1
               end,
        window_start = case
                 when rl.window_start < v_now - make_interval(secs => p_window_seconds) then v_now
                 else rl.window_start
               end
  returning rl.hits into v_hits;

  return v_hits <= p_limit;
end;
$$;
revoke execute on function public.sbd_rate_limit_check(text, integer, integer) from public, anon, authenticated;
grant  execute on function public.sbd_rate_limit_check(text, integer, integer) to service_role;

commit;

-- Verification (run after apply) — see each section's original file / the runbook for the
-- exact curl + SQL checks. Quick anon-reach smoke test (expect 401, was 200):
--   for t in obi_assessments sbd_assessment_queue david_facility_access; do
--     curl -s -o /dev/null -w "$t %{http_code}\n" \
--       "$URL/rest/v1/$t?select=*&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--   done
