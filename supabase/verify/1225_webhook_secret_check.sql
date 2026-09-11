-- #1225 read-back: run after 20260912150000 with
--   supabase db query --linked -f supabase/verify/1225_webhook_secret_check.sql
-- Asserts: no literal bearer left in pg_proc, handle_welcome_email reads Vault,
-- the vault secret exists and is non-empty, on_auth_user_created is still bound
-- and enabled, and the three dead functions are gone. Writes nothing, and never
-- prints a secret value.
do $$
declare
  n int;
begin
  -- 1. The live secret appears in NO function body anywhere in public. Exact, not
  --    name-scoped and not shape-scoped, so it also catches a future copy. The
  --    value is compared, never selected out.
  select count(*) into n
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public'
     and p.prosrc like '%' || (select decrypted_secret
                                 from vault.decrypted_secrets
                                where name = 'sbd_emails_webhook_secret') || '%';
  if n <> 0 then
    raise exception '#1225: the webhook secret is inlined in % function body/bodies in public', n;
  end if;

  -- 1b. No non-JWT bearer literal left in the two functions this card owns.
  --     The JWT exclusion is deliberate: public.sbd_trigger_email_send inlines the
  --     project ANON key, which is public (it ships in index.html) and is a
  --     separate question, not this card's secret.
  select count(*) into n
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public'
     and p.proname in ('handle_welcome_email', 'handle_registration_alert')
     and p.prosrc ~ 'Bearer [A-Za-z0-9_]{10,}';
  if n <> 0 then
    raise exception '#1225: % of the trigger functions still inline a bearer literal', n;
  end if;

  -- 2. handle_welcome_email exists and reads the vault secret by name.
  select count(*) into n
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'handle_welcome_email'
     and p.prosecdef
     and p.prosrc like '%vault.decrypted_secrets%'
     and p.prosrc like '%sbd_emails_webhook_secret%';
  if n <> 1 then
    raise exception '#1225: handle_welcome_email is not a SECURITY DEFINER vault reader (matched %)', n;
  end if;

  -- 3. the vault row exists and decrypts to something non-empty (value not shown).
  select count(*) into n
    from vault.decrypted_secrets
   where name = 'sbd_emails_webhook_secret'
     and coalesce(decrypted_secret, '') <> '';
  if n <> 1 then
    raise exception '#1225: vault secret sbd_emails_webhook_secret is missing or empty (matched %)', n;
  end if;

  -- 4. the trigger is still bound to auth.users and still enabled.
  select count(*) into n
    from pg_trigger t
    join pg_class c  on c.oid = t.tgrelid
    join pg_namespace ns on ns.oid = c.relnamespace
    join pg_proc p   on p.oid = t.tgfoid
   where not t.tgisinternal
     and t.tgname = 'on_auth_user_created'
     and ns.nspname = 'auth' and c.relname = 'users'
     and p.proname = 'handle_welcome_email'
     and t.tgenabled = 'O';
  if n <> 1 then
    raise exception '#1225: on_auth_user_created is not bound-and-enabled on auth.users (matched %)', n;
  end if;

  -- 5. the three dropped functions are gone.
  select count(*) into n
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public'
     and p.proname in ('handle_registration_alert',
                       'sbd_approve_registration',
                       'sbd_reject_registration');
  if n <> 0 then
    raise exception '#1225: % of the 3 retired functions still exist', n;
  end if;

  raise notice '#1225 read-back: all 5 checks pass';
end $$;
