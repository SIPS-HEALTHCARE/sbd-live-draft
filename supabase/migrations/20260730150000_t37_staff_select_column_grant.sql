-- 20260730150000_t37_staff_select_column_grant.sql
-- T37 (S12) follow-up. 20260730120000 revoked column-level SELECT on
-- observation_pin, but that was a no-op: Postgres only consults column-level
-- privileges when a role lacks a broader grant, and authenticated/anon both
-- hold TABLE-level SELECT on public.staff (inherited from table creation).
-- Table-level SELECT covers every column regardless of a column-specific
-- revoke, so has_column_privilege(authenticated, 'staff', 'observation_pin',
-- 'select') still returned true and PostgREST kept serving the column on
-- staff?select=*. Confirmed live 2026-07-30.
--
-- Fix: revoke the table-level SELECT entirely, then grant SELECT back to
-- authenticated on an explicit column list that omits observation_pin.
-- SELECT only -- INSERT/UPDATE/DELETE grants on staff are untouched.
-- service_role (every edge function, RLS-bypassing) is not revoked and keeps
-- full column access, including observation_pin, for sbd-observation-unlock
-- and the sbd_get_observer_pin() master-admin RPC.
--
-- anon gets no re-grant: no policy on staff permits anon anything today, so
-- there is nothing for it to legitimately read here. If a future anon-facing
-- flow needs a staff column, grant it deliberately rather than restoring the
-- table-level grant.
--
-- The column list below is computed from information_schema at apply time
-- instead of typed by hand -- the live schema is the source of truth, this
-- migration's author is not. LOUD CAVEAT: the price of an explicit column
-- grant is that a future `alter table staff add column ...` is NOT readable
-- by authenticated until a follow-up migration grants it. That's deliberate
-- (new columns default closed, not open) but it WILL look like a bug the
-- first time someone adds a column and the frontend can't see it.
do $$
declare
  v_cols text;
begin
  select string_agg(quote_ident(column_name), ', ')
    into v_cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'staff'
     and column_name <> 'observation_pin';

  if v_cols is null then
    raise exception 'public.staff has no columns other than observation_pin -- refusing to touch SELECT grants';
  end if;

  revoke select on public.staff from authenticated, anon;

  execute format('grant select (%s) on public.staff to authenticated', v_cols);
end $$;

-- Verify (run all three live):
--   select has_column_privilege('authenticated', 'public.staff', 'observation_pin', 'select');
--     -> expect false
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='staff' and column_name <> 'observation_pin'
--      and not has_column_privilege('authenticated', 'public.staff', column_name, 'select');
--     -> expect zero rows (every other column still readable)
--   select public.sbd_get_observer_pin('<a staff id>'::uuid) as master_admin_pin_readback;
--     -> expect the PIN, called as a master admin
--
-- Then click through as master admin, facility leader, and a staff member:
-- profiles, schedule, and the assessor queue must all still render (they all
-- select=* against staff).
