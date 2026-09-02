-- T45 — re-close the advisor's one ERROR + pin search_path on every flagged function.
--
-- PART 1: david_analytics_summary SECURITY DEFINER (advisor ERROR)
-- -----------------------------------------------------------------------------------
-- This was already fixed once: 20260718120500_p0_7_david_analytics_summary_invoker.sql
-- set security_invoker=on. It silently came back because Postgres resets any reloption
-- not explicitly restated by a later `CREATE OR REPLACE VIEW` back to its default (off).
-- 20260723120000_david_usage_caching_split.sql did exactly that — it re-ran
-- `create or replace view ... as select ...` to add two trailing columns and never
-- mentioned security_invoker, so the view silently reverted to SECURITY DEFINER.
--
-- Re-applying `alter view ... set (security_invoker = on)` fixes it again, but the same
-- regression will happen the next time this view's SELECT list changes via
-- `create or replace view` unless that statement also carries `WITH (security_invoker
-- = true)`. The `comment on view` below is the durable guardrail: it's part of the DB
-- schema itself, so it survives independent of this migration file.
--
-- Only repo consumer: supabase/functions/david-admin-api/index.ts, which queries with
-- the service-role client (RLS/security_invoker is a no-op for service_role either way),
-- so this flip changes nothing for that caller — confirmed by reading the fetch there.
--
-- PART 2: function_search_path_mutable (36 WARNs)
-- -----------------------------------------------------------------------------------
-- The flagged functions span 5 repo-migrated functions plus ~31 dashboard-created ones
-- (the aip_* content-quiz functions incl. 3 overloads of aip_submit_quiz, get_user_fid,
-- get_user_role, handle_registration_alert, handle_welcome_email,
-- sbd_clear_registration_password, exec_sql, search_all_columns, search_all_tables) that
-- have no migration file in this repo to hand-edit (dashboard drift, same class of gap
-- documented in 20260717130000). Rather than hand-enumerate signatures this repo can't
-- see (and silently miss whichever one the advisor added between 35 and 36), this loops
-- every public function missing a pinned search_path and pins it via its own oid, so it
-- is correct regardless of exact count, overloads, or future additions of the same kind.
--
-- No behavior change expected: none of these functions relied on search_path resolving
-- outside `public` (that's the point of the warning).

begin;

alter view public.david_analytics_summary set (security_invoker = on);

comment on view public.david_analytics_summary is
  'Chat-only (source=''chat'') usage aggregate read by david-admin-api. MUST stay '
  'security_invoker=on (T45/P0-7) — Postgres resets this option on any bare '
  '`create or replace view`, so any future edit to this view''s SELECT list must '
  'either add `WITH (security_invoker = true)` to that CREATE OR REPLACE, or be '
  'immediately followed by `alter view public.david_analytics_summary set '
  '(security_invoker = on);` in the same migration.';

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'                          -- functions only, not aggregates/procedures
      and not exists (                              -- skip extension-owned fns (pgcrypto etc.)
        select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e'
      )
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}')) cfg
        where cfg like 'search_path=%'
      )
  loop
    execute format('alter function %s set search_path = public', r.sig);
  end loop;
end $$;

commit;

-- Verification:
--   select relname, reloptions from pg_class where relname = 'david_analytics_summary';
--     -> reloptions should include security_invoker=on
--   select p.proname, p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--     where n.nspname='public' and p.prokind='f'
--     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
--     -> 0 rows
--   Advisor: security_definer_view ERROR gone, function_search_path_mutable WARN count 0.
--   Command Center analytics still render (david-admin-api uses service_role, unaffected).
--
-- Rollback (not expected to be needed — this only pins existing behavior, doesn't change it):
--   alter view public.david_analytics_summary set (security_invoker = off);
--   -- there is no single rollback for the DO block (it touches an unknown-in-advance set
--   -- of functions); re-running `alter function <fn> reset search_path;` per function would
--   -- undo it if ever necessary.
