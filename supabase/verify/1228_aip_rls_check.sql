-- #1228 read-back: run after 20260912130000 with
--   supabase db query --linked -f supabase/verify/1228_aip_rls_check.sql
-- Asserts, for both aip_question_responses and aip_assessment_attempts: RLS on,
-- no policy with qual/with_check true, the four public policies gone, the admin
-- SELECT policy present, sbd_mfa_gate present and RESTRICTIVE, and anon/
-- authenticated holding SELECT and nothing else. Writes nothing.
do $$
declare
  t text; n int;
begin
  foreach t in array array['aip_question_responses','aip_assessment_attempts'] loop

    if not exists (select 1 from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
                   where ns.nspname = 'public' and c.relname = t and c.relrowsecurity) then
      raise exception '#1228: RLS is not enabled on %', t;
    end if;

    -- no world-open predicate left, whatever the policy is called
    select count(*) into n from pg_policies
     where schemaname = 'public' and tablename = t
       and (btrim(coalesce(qual, '')) = 'true' or btrim(coalesce(with_check, '')) = 'true');
    if n <> 0 then
      raise exception '#1228: % policies on % still read true', n, t;
    end if;

    -- the four named policies are gone
    select count(*) into n from pg_policies
     where schemaname = 'public' and tablename = t
       and policyname in ('aip_responses_public_read','aip_responses_public_insert',
                          'aip_attempts_public_read','aip_attempts_public_insert');
    if n <> 0 then
      raise exception '#1228: % of the public policies survive on %', n, t;
    end if;

    -- admin SELECT, and only SELECT
    select count(*) into n from pg_policies
     where schemaname = 'public' and tablename = t
       and policyname like 'aip_%_admin_read' and cmd = 'SELECT'
       and qual like '%sbd_is_system_admin%';
    if n <> 1 then
      raise exception '#1228: admin SELECT policy missing on %', t;
    end if;

    -- the restrictive MFA gate
    if not exists (select 1 from pg_policies
                   where schemaname = 'public' and tablename = t
                     and policyname = 'sbd_mfa_gate' and permissive = 'RESTRICTIVE'
                     and qual like '%sbd_mfa_satisfied%') then
      raise exception '#1228: sbd_mfa_gate missing or not RESTRICTIVE on %', t;
    end if;

    -- grants: SELECT only for anon and authenticated (TRUNCATE ignores RLS)
    select count(*) into n from information_schema.role_table_grants
     where table_schema = 'public' and table_name = t
       and grantee in ('anon','authenticated') and privilege_type <> 'SELECT';
    if n <> 0 then
      raise exception '#1228: anon/authenticated still hold % non-SELECT privileges on %', n, t;
    end if;

    select count(*) into n from information_schema.role_table_grants
     where table_schema = 'public' and table_name = t
       and grantee in ('anon','authenticated') and privilege_type = 'SELECT';
    if n <> 2 then
      raise exception '#1228: expected SELECT for both anon and authenticated on %, found %', t, n;
    end if;

  end loop;

  raise notice '#1228 OK: both aip tables closed, gated, and read-only to anon/authenticated';
end $$;
