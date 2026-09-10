-- #1149 read-back: run after 20260911130000 with
--   supabase db query --linked -f supabase/verify/1149_curriculum_access_check.sql
-- Asserts the table, its three policies, the gate's three answers (granted /
-- not granted / off-registry) and that the backfill covers every already-
-- assigned pair. Writes nothing.
do $$
declare
  n int; m int; pol text;
  s_granted uuid; s_plain uuid;
  fnd_mod text; endo_mod text;
begin
  -- ── table + policies ──────────────────────────────────────────────────────
  if not exists (select 1 from pg_tables where tablename = 'curriculum_access') then
    raise exception '#1149: curriculum_access does not exist';
  end if;
  foreach pol in array array['ca_select','ca_write','sbd_mfa_gate'] loop
    if not exists (select 1 from pg_policies
                   where tablename = 'curriculum_access' and policyname = pol) then
      raise exception '#1149: policy % missing on curriculum_access', pol;
    end if;
  end loop;
  if not exists (select 1 from pg_policies
                 where tablename = 'curriculum_access' and policyname = 'sbd_mfa_gate'
                   and permissive = 'RESTRICTIVE') then
    raise exception '#1149: sbd_mfa_gate on curriculum_access is not RESTRICTIVE';
  end if;

  -- ── the three assignment INSERT policies carry the gate ───────────────────
  select count(*) into n from pg_policies
   where policyname in ('fnd_assign_insert','inst_assign_insert','scr_assign_insert')
     and with_check like '%sbd_has_curriculum_access%';
  if n <> 3 then
    raise exception '#1149: % of 3 assignment INSERT policies gated (expected 3)', n;
  end if;
  -- and still carry the pre-existing leader gate
  select count(*) into n from pg_policies
   where policyname in ('fnd_assign_insert','inst_assign_insert','scr_assign_insert')
     and with_check like '%sbd_fi_can_manage_assignments%';
  if n <> 3 then
    raise exception '#1149: % of 3 assignment INSERT policies still check sbd_fi_can_manage_assignments (expected 3)', n;
  end if;

  -- ── the gate's answers ────────────────────────────────────────────────────
  select module_id into fnd_mod  from public.curriculum_modules where curriculum = 'foundations' order by sequence limit 1;
  select module_id into endo_mod from public.curriculum_modules where curriculum = 'endoscopy'   order by sequence limit 1;
  if fnd_mod is null or endo_mod is null then
    raise exception '#1149: registry has no foundations/endoscopy module — apply 20260908140000 first';
  end if;

  -- an off-registry module id fails open, in both directions
  if not public.sbd_has_curriculum_access(gen_random_uuid(), '#1149-no-such-module') then
    raise exception '#1149: an off-registry module id must fail OPEN';
  end if;
  -- a preceptor module is not this gate's business
  if exists (select 1 from public.curriculum_modules where curriculum = 'preceptor')
     and not public.sbd_has_curriculum_access(
       gen_random_uuid(),
       (select module_id from public.curriculum_modules where curriculum = 'preceptor' order by sequence limit 1)) then
    raise exception '#1149: a preceptor module must fail OPEN (preceptor_access owns those)';
  end if;

  -- a staffer with no grant is refused; one with the grant passes
  select staff_id into s_plain from public.curriculum_access
   where curriculum <> 'foundations'
     and staff_id not in (select staff_id from public.curriculum_access where curriculum = 'foundations')
   limit 1;
  if s_plain is null then
    select id into s_plain from public.staff
     where id not in (select staff_id from public.curriculum_access where curriculum = 'foundations') limit 1;
  end if;
  if s_plain is not null and public.sbd_has_curriculum_access(s_plain, fnd_mod) then
    raise exception '#1149: staff % holds no foundations grant but the gate passed them', s_plain;
  end if;
  select staff_id into s_granted from public.curriculum_access where curriculum = 'foundations' limit 1;
  if s_granted is not null and not public.sbd_has_curriculum_access(s_granted, fnd_mod) then
    raise exception '#1149: staff % holds the foundations grant but the gate refused them', s_granted;
  end if;
  -- the foundations grant must NOT carry endoscopy, though both ride foundations_assignments
  if s_granted is not null
     and not exists (select 1 from public.curriculum_access where staff_id = s_granted and curriculum = 'endoscopy')
     and public.sbd_has_curriculum_access(s_granted, endo_mod) then
    raise exception '#1149: the foundations grant leaked into endoscopy for staff %', s_granted;
  end if;

  -- ── backfill covers every already-assigned pair ───────────────────────────
  select count(*) into m from (
    select distinct x.staff_id, r.curriculum
    from (
      select staff_id, module_id from public.foundations_assignments
      union all select staff_id, module_id from public.instrument_assignments
      union all select staff_id, module_id from public.script_assignments
    ) x
    join public.curriculum_modules r on r.module_id = x.module_id
    where x.staff_id is not null
      and r.curriculum in ('foundations','instruments','scripts','endoscopy')
  ) pairs;
  select count(*) into n from public.curriculum_access a
   where exists (
     select 1 from (
       select staff_id, module_id from public.foundations_assignments
       union all select staff_id, module_id from public.instrument_assignments
       union all select staff_id, module_id from public.script_assignments
     ) x
     join public.curriculum_modules r on r.module_id = x.module_id
     where x.staff_id = a.staff_id and r.curriculum = a.curriculum
   );
  if n <> m then
    raise exception '#1149: % already-assigned (staff, curriculum) pairs but only % grants — the backfill missed some, assignment will refuse them', m, n;
  end if;

  raise notice '#1149 curriculum_access: policies gated, backfill covers % assigned pairs', m;
end $$;

-- Who holds what, and how much of it is the backfill rather than a real grant.
select curriculum,
       count(*)                                          as grants,
       count(*) filter (where granted_by = '#1149 backfill') as backfilled
from public.curriculum_access
group by curriculum order by curriculum;
