-- #1208 read-back: run after 20260912140000 with
--   supabase db query --linked -f supabase/verify/1208_gate_responses_check.sql
-- Asserts the table, the three policies, the ABSENCE of update/delete policies,
-- and that anon holds no grant. Writes nothing.
do $$
declare
  pol text; n int;
begin
  -- ── table ─────────────────────────────────────────────────────────────────
  if not exists (select 1 from pg_tables where tablename = 'module_gate_responses') then
    raise exception '#1208: module_gate_responses does not exist';
  end if;
  if not exists (select 1 from pg_tables
                 where tablename = 'module_gate_responses' and rowsecurity) then
    raise exception '#1208: RLS is not enabled on module_gate_responses';
  end if;

  -- ── the three policies that must exist ────────────────────────────────────
  foreach pol in array array['mgr_self_insert','mgr_select','sbd_mfa_gate'] loop
    if not exists (select 1 from pg_policies
                   where tablename = 'module_gate_responses' and policyname = pol) then
      raise exception '#1208: policy % missing on module_gate_responses', pol;
    end if;
  end loop;
  if not exists (select 1 from pg_policies
                 where tablename = 'module_gate_responses' and policyname = 'sbd_mfa_gate'
                   and permissive = 'RESTRICTIVE') then
    raise exception '#1208: sbd_mfa_gate on module_gate_responses is not RESTRICTIVE';
  end if;

  -- ── append-only: no policy may permit UPDATE or DELETE ────────────────────
  -- The point of the table is evidence of what a candidate wrote. A permissive
  -- UPDATE/DELETE policy appearing here later is a regression, not a feature.
  select count(*) into n from pg_policies
   where tablename = 'module_gate_responses'
     and permissive = 'PERMISSIVE'
     and cmd in ('UPDATE','DELETE','ALL');
  if n > 0 then
    raise exception '#1208: module_gate_responses is no longer append-only (% permissive UPDATE/DELETE/ALL policies)', n;
  end if;

  -- ── grants: authenticated reads + appends, anon holds nothing ─────────────
  select count(*) into n from information_schema.role_table_grants
   where table_name = 'module_gate_responses' and grantee = 'anon';
  if n > 0 then
    raise exception '#1208: anon still holds % grant(s) on module_gate_responses', n;
  end if;
  foreach pol in array array['SELECT','INSERT'] loop
    if not exists (select 1 from information_schema.role_table_grants
                   where table_name = 'module_gate_responses'
                     and grantee = 'authenticated' and privilege_type = pol) then
      raise exception '#1208: authenticated is missing the % grant', pol;
    end if;
  end loop;
  select count(*) into n from information_schema.role_table_grants
   where table_name = 'module_gate_responses' and grantee = 'authenticated'
     and privilege_type in ('UPDATE','DELETE','TRUNCATE');
  if n > 0 then
    raise exception '#1208: authenticated holds % write grant(s) beyond INSERT', n;
  end if;

  raise notice '#1208 OK: module_gate_responses present, RLS on, append-only, anon revoked.';
end $$;
