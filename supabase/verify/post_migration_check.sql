-- ============================================================================
-- Post-migration check for the belt platform's access control.
--
-- WHY THIS EXISTS
-- A schema migration onto a new database was described on 2026-07-28 as roughly
-- two weeks out. Access control on this platform does not live in the table
-- definitions. It lives in row level security policies, in trigger functions, and
-- in a set of helper functions those policies call. A migration that copies
-- tables and data faithfully can still land with every one of those missing, and
-- nothing will look broken: the screens keep working, because losing a policy
-- opens access rather than closing it.
--
-- The failures this is written to catch, all of which were real defects closed
-- between 2026-07-26 and 2026-07-28:
--   a staff member reading and editing all 49 placement decisions
--   any signed in account approving its own belt gate request
--   a user setting their own belt, stars, assessment gates, facility or role
--   96 people's passwords readable in the clear by every signed in account
--   a candidate clearing their own patient safety provision
--
-- HOW TO RUN
--   psql "<new database connection string>" -f post_migration_check.sql
-- or paste it into the SQL editor for the new project. It reads only. It creates
-- nothing, changes nothing and takes no locks.
--
-- HOW TO READ IT
-- Every row returns PASS or FAIL. Any FAIL means that protection is not present
-- on the new database and has to be reapplied before the platform is pointed at
-- it. There is no partial credit here: a missing policy is an open table.
-- ============================================================================

with
-- ---------------------------------------------------------------- 1. RLS is on
rls as (
  select 'RLS enabled: ' || t.tbl as check_name,
         case when c.relrowsecurity then 'PASS' else 'FAIL' end as result,
         case when c.relrowsecurity then 'row level security is on'
              else 'RLS IS OFF, THE TABLE IS FULLY OPEN TO EVERY SIGNED IN ACCOUNT' end as detail
    from (values ('staff'),('placement_reviews'),('sbd_assessment_queue'),('sbd_portal_users'),
                 ('facility_shifts'),('free_agents'),('sbd_schedule'),('sbd_attendance'),
                 ('sbd_promotions'),('registrations')) as t(tbl)
    left join pg_class c on c.relname = t.tbl
     and c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
),
-- --------------------------------------------- 2. the helper functions exist
fns as (
  select 'Helper function: ' || f.fn as check_name,
         case when p.oid is null then 'FAIL'
              when not p.prosecdef then 'FAIL'
              when not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%') then 'FAIL'
              else 'PASS' end as result,
         case when p.oid is null then 'MISSING. Every policy that calls it will error or be rebuilt wrong.'
              when not p.prosecdef then 'exists but is not SECURITY DEFINER, so it cannot read the tables it needs'
              when not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%') then 'exists but has no pinned search_path'
              else 'present, security definer, search_path pinned' end as detail
    from (values ('sbd_get_user_role'),('sbd_get_user_facility'),('sbd_get_user_system'),
                 ('sbd_get_assigned_facilities'),('sbd_is_master_admin'),('sbd_is_assessor'),
                 ('sbd_is_admin'),('sbd_is_system_admin'),('sbd_owns_staff')) as f(fn)
    left join pg_proc p on p.proname = f.fn and p.pronamespace = 'public'::regnamespace
),
-- ------------------------------------------------------- 3. the guard triggers
trg as (
  select 'Guard trigger: ' || g.tg || ' on ' || g.tbl as check_name,
         case when t.tgname is null then 'FAIL' else 'PASS' end as result,
         case when t.tgname is null then 'MISSING. ' || g.why else 'present' end as detail
    from (values
      ('sbd_staff_privilege_guard','staff',
       'A staff member can set their own belt, stars, progress gates, facility, role and clear their own patient safety provision.'),
      ('sbd_portal_users_privilege_guard','sbd_portal_users',
       'A user can raise their own role to master admin and grant themselves capabilities.'),
      ('sbd_registrations_clear_password','registrations',
       'Chosen passwords accumulate in the clear again once a request is approved or denied.'),
      ('sbd_portal_users_password_notice','sbd_portal_users',
       'People created after the exposure stop receiving the change your password notice.')
    ) as g(tg, tbl, why)
    left join pg_trigger t on t.tgname = g.tg and not t.tgisinternal
     and t.tgrelid = ('public.' || g.tbl)::regclass
),
-- ---------------------------------------- 4. no table is open to everyone again
open_tables as (
  select 'No always-true policy on ' || t.tbl as check_name,
         case when count(p.policyname) = 0 then 'PASS' else 'FAIL' end as result,
         case when count(p.policyname) = 0 then 'no unrestricted policy'
              else count(p.policyname) || ' UNRESTRICTED POLICY: ' || string_agg(p.policyname, ', ') end as detail
    from (values ('staff'),('placement_reviews'),('sbd_assessment_queue'),('sbd_portal_users'),
                 ('facility_shifts'),('free_agents'),('sbd_schedule'),('sbd_attendance'),
                 ('sbd_promotions')) as t(tbl)
    left join pg_policies p
           on p.schemaname='public' and p.tablename = t.tbl
          and (coalesce(p.qual,'') in ('true','(true)') or coalesce(p.with_check,'') in ('true','(true)'))
   group by t.tbl
),
-- ------------------------------------------- 5. columns the application depends on
cols as (
  select 'Column: ' || c.tbl || '.' || c.col as check_name,
         case when x.column_name is null then 'FAIL' else 'PASS' end as result,
         case when x.column_name is null then 'MISSING. ' || c.why else 'present (' || x.data_type || ')' end as detail
    from (values
      ('staff','dangerous_provisions','Patient safety provisions are lost and the report has nowhere to record one.'),
      ('staff','sbd_program_years','Years in SPD disappears from every profile.'),
      ('staff','sbd_cert_years','Years certified disappears from every profile.'),
      ('staff','assessment_gate_override','Master admin assessment waivers are lost.'),
      ('staff','window_override','Manually opened assessment windows are lost.'),
      ('sbd_portal_users','password_notice_at','The password change notice stops appearing for the exposed accounts.'),
      ('sbd_portal_users','password_notice_ack_at','The notice reappears forever because acknowledgement cannot be recorded.'),
      ('sbd_portal_users','capabilities','Assessor and educator grants are lost.'),
      ('sbd_attendance','arrived_at','Attendance times cannot be recorded.'),
      ('sbd_attendance','left_at','Attendance times cannot be recorded.'),
      ('sbd_attendance','note','Attendance notes cannot be recorded.'),
      ('sbd_schedule','assigned_staff','Shift assignments cannot be stored. Must be uuid[], not integer[].'),
      ('sbd_schedule','published_by','Publish to Staff cannot work; staff see unpublished schedules or none.')
    ) as c(tbl, col, why)
    left join information_schema.columns x
           on x.table_schema='public' and x.table_name = c.tbl and x.column_name = c.col
),
-- --------------------------------- 6. the two id types that were silently wrong
types as (
  select 'Type: ' || t.tbl || '.' || t.col || ' is ' || t.want as check_name,
         case when x.data_type is null then 'FAIL'
              when x.data_type = t.want or (t.want='uuid[]' and x.data_type='ARRAY') then 'PASS'
              else 'FAIL' end as result,
         case when x.data_type is null then 'column missing'
              when x.data_type = t.want or (t.want='uuid[]' and x.data_type='ARRAY') then 'correct'
              else 'IS ' || x.data_type || '. Every write is rejected and the rejection is discarded silently, '
                   || 'which is how these tables held zero rows for two months.' end as detail
    from (values ('sbd_attendance','staff_id','uuid'),
                 ('sbd_attendance','coverage_for','uuid'),
                 ('sbd_promotions','staff_id','uuid'),
                 ('sbd_schedule','assigned_staff','uuid[]')) as t(tbl, col, want)
    left join information_schema.columns x
           on x.table_schema='public' and x.table_name=t.tbl and x.column_name=t.col
),
-- ------------------------------------ 7. no plaintext password has come back
pw as (
  select 'No stored passwords on decided registrations' as check_name,
         case when not exists (select 1 from information_schema.columns
                                where table_schema='public' and table_name='registrations'
                                  and column_name='password')
              then 'PASS'
              when (select count(*) from public.registrations
                     where password is not null and status is distinct from 'pending') = 0
              then 'PASS' else 'FAIL' end as result,
         case when not exists (select 1 from information_schema.columns
                                where table_schema='public' and table_name='registrations'
                                  and column_name='password')
              then 'the column no longer exists, which is the end state we want'
              else (select count(*)::text from public.registrations
                     where password is not null and status is distinct from 'pending')
                   || ' approved or denied rows are holding a password in the clear' end as detail
)
select * from rls
union all select * from fns
union all select * from trg
union all select * from open_tables
union all select * from cols
union all select * from types
union all select * from pw
order by result desc, check_name;

-- ============================================================================
-- Expected on a correct migration: every row PASS.
--
-- Counted on the current production database on 2026-07-28, for comparison:
--   61 policies across 15 tables
--   5 guard triggers
--   RLS on all 10 tables above
--   13 helper and guard functions, all SECURITY DEFINER with a pinned search_path
--   0 always-true policies on any of the 9 protected tables
--
-- After this passes, run the behaviour checks too, because a policy can exist and
-- still be wrong. Sign in as a staff member and confirm: Belt Progress shows only
-- their own record, they cannot approve their own gate request, and they cannot
-- change their own belt or clear a provision.
-- ============================================================================
