-- #1148 read-back: run after 20260908140000 with
--   supabase db query --linked -f supabase/verify/1148_curriculum_modules_check.sql
-- Raises if the table is missing a row or carries one the constants do not have.
-- Expected counts come from the shipped constants on 2026-09-08
-- (node scripts/verify-1148-curriculum-registry.js prints the same numbers).
do $$
declare
  expected jsonb := '{"foundations":10,"instruments":4,"scripts":1,"endoscopy":14,"preceptor":15}';
  k text; n int;
begin
  for k in select jsonb_object_keys(expected) loop
    select count(*) into n from public.curriculum_modules where curriculum = k and active;
    if n <> (expected->>k)::int then
      raise exception '#1148 curriculum_modules: % has % active rows, constants have %', k, n, expected->>k;
    end if;
  end loop;
  select count(*) into n from public.curriculum_modules;
  if n <> 44 then
    raise exception '#1148 curriculum_modules: % rows total, expected 44', n;
  end if;
  if not exists (select 1 from pg_policies where tablename = 'curriculum_modules' and policyname = 'sbd_mfa_gate') then
    raise exception '#1148 curriculum_modules: sbd_mfa_gate policy missing';
  end if;
  raise notice '#1148 curriculum_modules: 44 rows, 5 curricula, counts match the constants';
end $$;

select curriculum, count(*) filter (where active) as active, count(*) as total
from public.curriculum_modules group by curriculum order by curriculum;
