-- ============================================================================
-- REVERT — Security sweep 2026-07-20  (manual rollback of the consolidated migration
--          supabase/migrations/20260720120000_security_sweep_2026_07_20.sql)
--
-- ⚠⚠ DO NOT PLACE THIS FILE IN supabase/migrations/ ⚠⚠
--   Every .sql there is auto-applied in timestamp order. A revert sitting next to the
--   up-migration would run right after it and silently undo the entire sweep. This file
--   lives OUTSIDE migrations/ ON PURPOSE — run it BY HAND only when you intend to roll back.
--
-- Effect: restores the PRE-sweep state, i.e. RE-OPENS every hole the sweep closed
-- (anon-executable functions, anon PII reads, blanket policies, the always-false audit
-- policy, the open function default). Reverse order of the up-migration's sections.
--
-- Edge function: the sbd-score-assessment code change is NOT reverted here — roll it back
-- via git + redeploy. Dropping sbd_rate_limit_check (§7) is safe against the still-deployed
-- function: its rate-limit call FAILS OPEN when the function is missing, so grading keeps
-- working (unthrottled) until you redeploy the old code.
-- ============================================================================
begin;

-- ── revert §7 · drop the rate-limit function + table ──────────────────────────
drop function if exists public.sbd_rate_limit_check(text, integer, integer);
drop table    if exists public.sbd_rate_limit;

-- ── revert §6 · obi_assessments — restore anon read (re-opens the PII exposure) ─
grant select on public.obi_assessments to anon;

-- ── revert §5 · restore anon reads on assessment_queue + facility_access ───────
grant select on public.sbd_assessment_queue to anon;
grant select on public.david_facility_access to anon;

-- ── revert §4 · restore the (always-false) audit-log READ policy ───────────────
drop policy if exists "Master Admins can view audit logs" on public.david_audit_logs;
create policy "Master Admins can view audit logs" on public.david_audit_logs
  for select to authenticated using (auth.jwt() ->> 'role' = 'master_admin');

-- ── revert §3 · restore the blanket USING(true) policies on the 4 tables ───────
create policy "authenticated_all_attendance"   on public.sbd_attendance   for all to authenticated using (true) with check (true);
create policy "authenticated_all_schedule"      on public.sbd_schedule      for all to authenticated using (true) with check (true);
create policy "authenticated_all_free_agents"   on public.sbd_free_agents   for all to authenticated using (true) with check (true);
create policy "authenticated_all_placement_log" on public.sbd_placement_log for all to authenticated using (true) with check (true);

-- ── revert §2 · re-grant PUBLIC EXECUTE on the swept functions ─────────────────
-- (anon + authenticated regain it via PUBLIC membership; the extra service_role grant left
--  by the up-migration is harmless — service_role also holds it via PUBLIC.)
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
    execute format('grant execute on function public.%I(%s) to public;', r.proname, r.args);
  end loop;
end $$;

-- ── revert §1 · restore the OPEN default privilege for new functions ───────────
alter default privileges in schema public grant execute on functions to public;
alter default privileges for role postgres in schema public grant execute on functions to public;

commit;
