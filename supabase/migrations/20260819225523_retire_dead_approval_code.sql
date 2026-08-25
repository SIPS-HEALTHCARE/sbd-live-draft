-- Board item 143 (2026-08-19): retire the dead and duplicate approval-era code.
--
-- Three objects, each verified against pg_trigger/pg_proc on 2026-08-18 and
-- re-verified 2026-08-19 before this file was written.
--
-- 1. trg_password_reset_created + sbd_on_password_reset_created(). The legacy
--    credential path: an insert into sbd_password_resets queued a "temporary
--    reset token" email that no screen in the application can consume (sign-in
--    and set-password both run on GoTrue). Nothing in the application inserts
--    into that table; the only real-world use was the hand-run bulk insert of
--    2026-08-18 03:35 UTC that mailed 118 people a token with nowhere to type
--    it. Dropping the trigger makes that class of accident impossible while
--    keeping the table and its rows as history. The table itself is NOT
--    dropped.
--
-- 2. trg_registrations_null_password + registrations_null_password(). One of
--    two triggers doing the identical job of nulling registrations.password on
--    every write. sbd_registrations_clear_password stays and keeps the
--    guarantee; the duplicate goes.
--
-- 3. sbd_on_registration_approved(). Written during the incident night as a
--    token-minting attempt, never bound to any table (confirmed in pg_trigger
--    twice, and by the client's own incident handover: "It is NOT bound as a
--    trigger to any table and never has been"). Dead weight with a misleading
--    name; whoever greps approval code finds it and wastes an hour, which is
--    exactly what happened on 2026-08-18.

-- 1. The 118-email path.
drop trigger if exists trg_password_reset_created on public.sbd_password_resets;
drop function if exists public.sbd_on_password_reset_created();

comment on table public.sbd_password_resets is
  'RETIRED 2026-08-19 (board 143). Legacy reset tokens nothing in the app consumes; kept as history only. The notify trigger is dropped so an insert can no longer mass-mail tokens (see 2026-08-18, 118 emails). Password flows run on GoTrue.';

-- 2. The duplicate null-password guard. sbd_registrations_clear_password remains.
drop trigger if exists trg_registrations_null_password on public.registrations;
drop function if exists public.registrations_null_password();

-- 3. The unbound function from the incident night.
drop function if exists public.sbd_on_registration_approved();
