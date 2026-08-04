-- ============================================================================
-- T37 (S12) — observer PIN relocation check.
--
-- Run after 20260804120000 (part 1) and again after 20260804130000 (part 2). It
-- reads only: no writes, no DDL, no locks. Paste into the SQL editor or
--   psql "<connection string>" -f supabase/verify/t37_observer_pins_check.sql
--
-- Every row is PASS, FAIL, or PENDING. PENDING means "expected until part 2 is
-- applied" and is only acceptable before that point. Any FAIL means stop.
--
-- The two checks that are not about the new table:
--   * "staff update still works" is the canary for the trigger landmine.
--     sbd_guard_staff_privileged_columns() names observation_pin, and plpgsql
--     resolves record fields at runtime, so dropping the column without
--     rebuilding the function leaves every staff UPDATE in the product failing
--     with `record "new" has no field "observation_pin"`. This proves the guard
--     recompiled against the current column set.
--   * "no PIN exists only on staff" proves nothing was lost in transit.
-- ============================================================================

with
part2 as (
  select not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'staff'
       and column_name = 'observation_pin'
  ) as applied
),

checks as (

  -- 1. The table exists.
  select 1 as ord,
         'sbd_observer_pins exists' as check_name,
         case when to_regclass('public.sbd_observer_pins') is not null then 'PASS' else 'FAIL' end as result,
         coalesce(to_regclass('public.sbd_observer_pins')::text, 'MISSING — part 1 did not apply') as detail

  -- 2. RLS is on. With no policies this is what denies every client.
  union all
  select 2,
         'sbd_observer_pins RLS enabled',
         case when coalesce((select relrowsecurity from pg_class
                              where oid = to_regclass('public.sbd_observer_pins')), false)
              then 'PASS' else 'FAIL' end,
         case when coalesce((select relrowsecurity from pg_class
                              where oid = to_regclass('public.sbd_observer_pins')), false)
              then 'on, and with no policies that denies every client'
              else 'RLS IS OFF — check 4 is then the only thing standing between this table and every signed-in account' end

  -- 3. Zero policies. A policy here would be a way in.
  union all
  select 3,
         'sbd_observer_pins has no policies',
         case when (select count(*) from pg_policy
                     where polrelid = to_regclass('public.sbd_observer_pins')) = 0
              then 'PASS' else 'FAIL' end,
         'policies found: ' || coalesce((select string_agg(polname, ', ') from pg_policy
                                          where polrelid = to_regclass('public.sbd_observer_pins')), 'none')

  -- 4. No table privileges for the client roles — the second lock, so that a future
  --    `disable row level security` on this table is not instantly an exposure.
  union all
  select 4,
         'authenticated/anon hold no privilege on sbd_observer_pins',
         case when not (
                has_table_privilege('authenticated', 'public.sbd_observer_pins', 'select')
             or has_table_privilege('authenticated', 'public.sbd_observer_pins', 'insert')
             or has_table_privilege('authenticated', 'public.sbd_observer_pins', 'update')
             or has_table_privilege('anon',          'public.sbd_observer_pins', 'select'))
              then 'PASS' else 'FAIL' end,
         'authenticated select=' || has_table_privilege('authenticated', 'public.sbd_observer_pins', 'select')::text ||
         ', anon select='        || has_table_privilege('anon',          'public.sbd_observer_pins', 'select')::text

  -- 5. service_role can still read it, or both edge functions are dead.
  union all
  select 5,
         'service_role can read sbd_observer_pins',
         case when has_table_privilege('service_role', 'public.sbd_observer_pins', 'select')
              then 'PASS' else 'FAIL' end,
         'sbd-observer-pin and sbd-observation-unlock both read this table as service_role'

  -- 6. PINs are unique, or the observer identity is unresolvable at unlock time.
  union all
  select 6,
         'observer PINs are unique',
         case when exists (select 1 from pg_index
                            where indrelid = to_regclass('public.sbd_observer_pins')
                              and indisunique
                              and indkey::text = (select attnum::text from pg_attribute
                                                   where attrelid = to_regclass('public.sbd_observer_pins')
                                                     and attname = 'pin'))
              then 'PASS' else 'FAIL' end,
         'a unique index on pin is what makes "one PIN, one person" true'

  -- 7. Nothing was lost: no PIN exists only in the old column.
  --    Trivially PASS once part 2 has dropped the column.
  --    The column is read as `to_jsonb(s) ->> 'observation_pin'` rather than by name on
  --    purpose: a bare s.observation_pin fails to PARSE once the column is dropped, which
  --    would take the whole script down with it — CASE branches are only skipped at
  --    runtime, never at parse time.
  union all
  select 7,
         'no PIN exists only on staff',
         case when (select applied from part2) then 'PASS'
              when (select count(*) from public.staff s
                     where btrim(coalesce(to_jsonb(s) ->> 'observation_pin', '')) <> ''
                       and not exists (select 1 from public.sbd_observer_pins p
                                        where p.staff_id = s.id
                                          and p.pin = to_jsonb(s) ->> 'observation_pin')) = 0
              then 'PASS' else 'FAIL' end,
         case when (select applied from part2) then 'column is gone; sbd_observer_pins is the only home'
              else 'unmirrored PINs: ' || (select count(*) from public.staff s
                                            where btrim(coalesce(to_jsonb(s) ->> 'observation_pin', '')) <> ''
                                              and not exists (select 1 from public.sbd_observer_pins p
                                                               where p.staff_id = s.id
                                                                 and p.pin = to_jsonb(s) ->> 'observation_pin'))::text end

  -- 8. The flag the interface reads agrees with the table.
  union all
  select 8,
         'observer_pin_set matches sbd_observer_pins',
         case when (select count(*) from public.staff s
                     where s.observer_pin_set
                       is distinct from exists (select 1 from public.sbd_observer_pins p
                                                 where p.staff_id = s.id)) = 0
              then 'PASS' else 'FAIL' end,
         'staff rows disagreeing with the table: ' ||
         (select count(*) from public.staff s
           where s.observer_pin_set
             is distinct from exists (select 1 from public.sbd_observer_pins p where p.staff_id = s.id))::text ||
         ' (a mismatch only mis-labels the button, it does not expose or lose a PIN)'

  -- 9. THE EXPOSURE. PENDING until part 2, FAIL never.
  union all
  select 9,
         'authenticated cannot read the observer PIN',
         case when (select applied from part2) then 'PASS' else 'PENDING' end,
         case when (select applied from part2)
              then 'staff.observation_pin is gone; the PIN is only in sbd_observer_pins'
              else 'staff.observation_pin still present (expected between part 1 and part 2) — readable=' ||
                   has_column_privilege('authenticated', 'public.staff', 'observation_pin', 'select')::text ||
                   '. Apply 20260804130000 to close it.' end

  -- 10. The guard function must not reference a record field that no longer exists.
  --     A text check on the compiled body, because plpgsql resolves record fields only
  --     when the trigger actually fires. It matches `new.observation_pin` /
  --     `old.observation_pin` specifically, not the bare column name, which appears in
  --     the function's own comments. The footer canary is the authoritative test; this
  --     row is the one that shows up without anyone having to run a write.
  union all
  select 10,
         'guard function does not reference a dropped field',
         case when not (select applied from part2) then 'PASS'
              when (select prosrc from pg_proc
                     where oid = to_regprocedure('public.sbd_guard_staff_privileged_columns()'))
                   ~* '\m(new|old)\s*\.\s*observation_pin\M' then 'FAIL'
              else 'PASS' end,
         case when not (select applied from part2)
              then 'staff.observation_pin still exists, so referencing it is correct here'
              when (select prosrc from pg_proc
                     where oid = to_regprocedure('public.sbd_guard_staff_privileged_columns()'))
                   ~* '\m(new|old)\s*\.\s*observation_pin\M'
              then 'STOP: the guard still reads new/old.observation_pin, which is dropped. ' ||
                   'EVERY staff write in the product is failing with `record "new" has no ' ||
                   'field "observation_pin"`. Re-run 20260804130000''s function block.'
              else 'rebuilt against the current column set' end

  -- 11. Part 2 housekeeping.
  union all
  select 11,
         'sbd_get_observer_pin retired',
         case when (select applied from part2) then
                case when to_regprocedure('public.sbd_get_observer_pin(uuid)') is null
                     then 'PASS' else 'FAIL' end
              else 'PENDING' end,
         'the RPC is superseded by the sbd-observer-pin function; part 2 drops it'

  union all
  select 12,
         'write mirror retired',
         case when (select applied from part2) then
                case when to_regprocedure('public.sbd_mirror_observation_pin()') is null
                     then 'PASS' else 'FAIL' end
              else 'PENDING' end,
         'the mirror trigger only covers the gap between part 1 and the frontend deploy'
)

select result, check_name, detail
  from checks
 order by case result when 'FAIL' then 0 when 'PENDING' then 1 else 2 end, ord;

-- ---------------------------------------------------------------------------
-- LIVE CANARY — run this separately, straight after applying 20260804130000.
-- Check 10 above reads the guard's source; this proves it actually fires. A plain
-- SELECT cannot run an UPDATE, so it is three statements rather than a row:
--
--   begin;
--     update public.staff set stars = stars where id = (select id from public.staff limit 1);
--   rollback;
--
-- It sets a column to its own value and is rolled back either way, so nothing
-- changes. A successful UPDATE is the pass. The failure it exists to catch is
--   ERROR: record "new" has no field "observation_pin"
-- which means the guard was not rebuilt and every staff write in the product —
-- placements, belts, gates, Position School, provisions — is failing. Fix by
-- re-running 20260804130000's function block; nothing needs reverting.
-- ---------------------------------------------------------------------------
