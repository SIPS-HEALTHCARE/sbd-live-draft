-- ── T33 follow-up (#623) · Extend the sbd_mfa_gate loop to the belt tables it skipped ──
--
-- 20260904120000 keyed the gate on the sbd_* / david_* / foundations_* /
-- instrument_* prefixes plus an explicit list. Sriman's live read-back (#623,
-- 2026-09-04) found five belt-platform families outside that list:
--   observations + observation_*   (observation_audits/checklists/overrides/remediations)
--   preceptor_*                    (access/assignments/modules/progress)
--   script_*                       (script_assignments)
--   ps_*                           (ps_completion_requests)
--   user_onboarding
-- assistant_memory (david-chat's memory table, no david_ prefix) is added for the
-- same reason. obi_assessments (anon-only legacy reads) and systems (RLS on, zero
-- policies — already unreadable) are left alone on purpose.
--
-- Same restrictive policy, same predicate, same idempotent drop/create. Frontend
-- and the 15 edge functions are already live, so this migration has no ordering
-- constraint. Read-back: supabase/verify/t33_mfa_gate_check.sql §4/§4b.
do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity
      and (c.relname like 'observation%'
           or c.relname like 'preceptor\_%'
           or c.relname like 'script\_%'
           or c.relname like 'ps\_%'
           or c.relname in ('user_onboarding','assistant_memory'))
  loop
    execute format('drop policy if exists sbd_mfa_gate on public.%I', t.relname);
    execute format(
      'create policy sbd_mfa_gate on public.%I as restrictive for all to authenticated '
      || 'using (public.sbd_mfa_satisfied()) with check (public.sbd_mfa_satisfied())',
      t.relname);
  end loop;
end $$;
