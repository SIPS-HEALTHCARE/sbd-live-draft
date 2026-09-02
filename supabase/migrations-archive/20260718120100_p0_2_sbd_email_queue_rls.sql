-- P0-2 (2026-07-18) · sbd_email_queue — queued mail was readable AND injectable by anyone.
-- Finding: ALL=true for PUBLIC. Anon could read queued messages and INSERT arbitrary rows
-- (spam / phishing through the templated sender). All server writers already use the service
-- role (sbd-emails, sbd-send-emails, sbd-approve-registration, sbd-assessment-notifications,
-- sbd-assessor-pin, sbd-sync-user-claims). The ONE client writer was denyReg() in ui-views.js,
-- which inserted directly from the browser — that path is moved server-side into the
-- sbd-emails function (type: 'registration_denied') in this same change set.
--
-- ⚠ DEPLOY ORDER (paired change):
--   1. Deploy updated edge function:  supabase functions deploy sbd-emails
--   2. Deploy frontend (index.html loads ui-views.js?v=159)
--   3. Apply THIS migration
--   If the migration is applied before step 1-2, registration-denial emails are silently
--   skipped (denyReg already .catch()es the failure) until the frontend deploys. The denial
--   itself (a PATCH to registrations) is unaffected — only the notification email is delayed.
--
-- Fix: enable RLS, drop all existing policies, revoke grants from anon/authenticated/PUBLIC,
-- grant to service_role. No authenticated policy — by design.
begin;

alter table public.sbd_email_queue enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'sbd_email_queue'
  loop
    execute format('drop policy if exists %I on public.sbd_email_queue', pol.policyname);
  end loop;
end $$;

revoke all on public.sbd_email_queue from anon, authenticated;
revoke all on public.sbd_email_queue from public;
grant all on public.sbd_email_queue to service_role;

commit;

-- Rollback (restores the read+inject hole — revert only):
--   create policy sbd_email_queue_all_all on public.sbd_email_queue
--     for all using (true) with check (true);
--   grant all on public.sbd_email_queue to anon, authenticated;
