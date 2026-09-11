-- ── #1225 / T131 · Take the sbd-emails webhook bearer out of pg_proc, drop the dead approval code (board 156) ──
--
-- Read live 2026-09-12, before this file:
--   • public.handle_welcome_email() and public.handle_registration_alert() have
--     BYTE-IDENTICAL bodies (md5 3f94a074052f14de8745212a9b7fd06b) and both inline
--     the same `Authorization: Bearer <literal>` header for the sbd-emails edge
--     function. Any role that can read pg_proc reads the secret.
--   • Only handle_welcome_email is bound: trigger on_auth_user_created on
--     auth.users, tgenabled 'O'. handle_registration_alert is bound to NOTHING
--     (the one trigger on public.registrations is sbd_registrations_clear_password
--     → sbd_clear_registration_password). It is a dead copy that exists only to
--     hold a second copy of the secret, which is why it goes here rather than in
--     a later pass: after the rotation it would sit on a stale literal forever.
--   • sbd_approve_registration / sbd_reject_registration carry the NOT IN USE
--     comments added 2026-09-10. Both read public.sbd_pending_registrations and
--     sbd_approve_registration also writes public.sbd_facilities; to_regclass says
--     NEITHER TABLE EXISTS, so any call raises undefined_table. EXECUTE is held by
--     service_role only — anon and authenticated cannot reach them.
--
-- What this does:
--   1. Rewrites handle_welcome_email to read the bearer from Vault secret
--      'sbd_emails_webhook_secret' at call time. Nothing else about the call
--      changes: same URL, same body, same headers on the wire.
--   2. Drops handle_registration_alert (unbound, and the second copy of the token).
--   3. Drops the two dead approval functions.
--
-- FAIL OPEN, on purpose. This trigger runs INSIDE the auth.users insert. If the
-- vault secret is missing, raising would fail the signup itself — a broken account
-- creation is strictly worse than a missing notification. A missing secret logs a
-- WARNING and lets the insert through. (The edge function stays fail-CLOSED on its
-- side: sbd-emails/index.ts refuses when WEBHOOK_SECRET is unset or mismatched.)
--
-- Vault read: the function is SECURITY DEFINER owned by postgres, and postgres
-- holds SELECT on vault.decrypted_secrets (checked live 2026-09-12). The view is
-- fully schema-qualified so `set search_path to public` does not reach it.
--
-- NO SECRET VALUE APPEARS IN THIS FILE, and none may be added to it. The vault row
-- is seeded and rotated by hand, outside git:
--
--   -- seed, BEFORE applying this migration, with the value currently in pg_proc:
--   select vault.create_secret('<current value>', 'sbd_emails_webhook_secret',
--            'Bearer token the DB triggers send to the sbd-emails edge function. Must equal its WEBHOOK_SECRET env.');
--   -- rotate, AFTER applying, paired with the edge function env:
--   select vault.update_secret(
--            (select id from vault.secrets where name = 'sbd_emails_webhook_secret'), '<new value>');
--   supabase secrets set WEBHOOK_SECRET='<new value>'   # then redeploy sbd-emails
--
-- Deploy order: seed the vault row FIRST (with the OLD value), then this migration —
-- that pair is a no-op on behaviour and proves the plumbing without rotating
-- anything. Rotate only once the pair reads back clean.
--
-- Rollback: scripts/sql-rollback/1225_WEBHOOK_SECRET_VAULT_REVERT.sql. It recreates
-- the three dropped functions and leaves handle_welcome_email on the vault read —
-- reverting the *rotation* means putting the old value back with vault.update_secret
-- and `supabase secrets set`, not editing a function body.
--
-- Read-back: supabase/verify/1225_webhook_secret_check.sql

begin;

-- ── 1. handle_welcome_email reads the bearer from Vault ───────────────────────
create or replace function public.handle_welcome_email() returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'sbd_emails_webhook_secret';

  if v_secret is null or v_secret = '' then
    raise warning 'handle_welcome_email: vault secret sbd_emails_webhook_secret is missing or empty; sbd-emails not called for auth.users %', new.id;
    return new;
  end if;

  perform net.http_post(
    url     := 'https://mhijaqahbceuahfzezbh.supabase.co/functions/v1/sbd-emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body    := jsonb_build_object(
      'type',   TG_OP,
      'table',  TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(new)
    )
  );

  return new;
end;
$$;

-- create or replace preserves the existing ACL, but this is a SECURITY DEFINER
-- function on auth.users; restate the grant so a reset ACL cannot open it.
revoke all on function public.handle_welcome_email() from public;
grant  all on function public.handle_welcome_email() to service_role;

comment on function public.handle_welcome_email() is
  'Trigger on_auth_user_created on auth.users. Posts the new row to the sbd-emails edge function. The bearer is read from Vault secret sbd_emails_webhook_secret at call time and is never stored in this body; rotating it means vault.update_secret plus the WEBHOOK_SECRET env of sbd-emails, in that order. Secret moved to Vault and rotated 2026-09-12 (#1225 / T131, board 156). Fails open: a missing secret logs a warning and lets the signup through, because this runs inside the auth.users insert.';

-- ── 2. the unbound duplicate that held the second copy of the token ───────────
drop function if exists public.handle_registration_alert();

-- ── 3. the two dead approval functions (board 156) ────────────────────────────
drop function if exists public.sbd_approve_registration(uuid, text, uuid);
drop function if exists public.sbd_reject_registration(uuid, uuid);

commit;
