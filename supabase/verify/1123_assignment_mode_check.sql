-- #1123 verification — run AFTER applying 20260908150000_1123_assignment_mode_read_take.sql
-- Read-only. Every statement is a SELECT; nothing here writes.
-- Run one numbered block at a time with `supabase db query --linked` (it returns the last result set only).

-- === 1. mode column on both assignment tables: text, not null, default take ===
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('foundations_assignments','instrument_assignments')
  and column_name = 'mode'
order by table_name;
-- Expect 2 rows, is_nullable = NO, column_default = 'take'::text

-- === 2. check constraints restrict mode to read|take ===
select conrelid::regclass as tbl, conname, pg_get_constraintdef(oid) as def
from pg_constraint
where conname in ('foundations_assignments_mode_check','instrument_assignments_mode_check')
order by 1;
-- Expect 2 rows, each CHECK (mode = ANY (ARRAY['read','take']))

-- === 3. guard carries the #1123 blocks, still definer + pinned search_path ===
select p.prosecdef as security_definer, p.proconfig as settings,
       position('#1123' in pg_get_functiondef(p.oid)) > 0 as has_1123,
       position('#720'  in pg_get_functiondef(p.oid)) > 0 as still_has_720
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'sbd_fi_progress_guard';
-- Expect 1 row: t, {search_path=public}, t, t

-- === 4. both progress triggers still bound ===
select tgrelid::regclass as tbl, tgname
from pg_trigger where tgname in ('trg_fi_fnd_prog_guard','trg_fi_inst_prog_guard');
-- Expect 2 rows

-- === 5. every existing row defaulted to take (no read rows before the frontend ships) ===
select 'foundations' as t, mode, count(*) from public.foundations_assignments group by mode
union all
select 'instruments', mode, count(*) from public.instrument_assignments group by mode
order by 1,2;
-- Expect only mode = take on first run

-- === 6. status/complete drift the guard now closes (informational) ===
select 'foundations' as t, count(*) as rows_where_status_lags_complete
from public.foundations_assignments a
join public.foundations_progress p using (staff_id, module_id)
where (p.complete and a.status <> 'completed') or (not p.complete and a.status = 'completed')
union all
select 'instruments', count(*)
from public.instrument_assignments a
join public.instrument_progress p using (staff_id, module_id)
where (p.complete and a.status <> 'completed') or (not p.complete and a.status = 'completed');
-- Rows counted here converge on the next progress write for that (staff, module).
