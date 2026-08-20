-- ============================================================================
-- T92a — script_assignments: Scripts gets its own assignment table
--
-- Client brief 2026-08-13, Priority 2: Scripts is assigned deliberately, one
-- person at a time, the same way a Foundations module is assigned today —
-- explicitly NOT bundled inside another track. T92 shipped the surfaces but
-- stored the row inside foundations_assignments as module_id='scripts'; this
-- migration gives it the fourth table of the pattern the client confirmed
-- against live data (foundations_assignments / instrument_assignments /
-- preceptor_assignments) and moves the existing rows over.
--
-- APPLIED BY: the USER (Supabase MCP has no SBD prod access).
-- ORDER: apply this FIRST, then deploy the frontend, in the same window.
--   The repointed frontend reads script_assignments only, so deploying it
--   before this runs breaks Scripts entirely (hydration 404s, assigns fail).
--   Between this migration and the frontend deploy, the still-live old
--   frontend briefly shows existing Scripts assignments as unassigned (its
--   rows have moved) — visibility-only, nothing is lost.
--
-- PRE-FLIGHT (all live in prod, referenced by applied migrations):
--   public.sbd_fi_leader_scope(uuid)            (20260703120000)
--   public.sbd_fi_can_manage_assignments(uuid)  (20260707120000)
--   public.sbd_is_master_admin()                (referenced 20260707120000)
--   public.touch_updated_at()                   (referenced 20260731090500)
--
-- ROLLBACK (inverse): copy rows back and drop the table —
--   insert into public.foundations_assignments
--       (staff_id, module_id, assigned_by, type, trigger, assignment_type,
--        trigger_event, assigned_date, status, facility_id)
--     select staff_id, module_id, assigned_by, type, trigger, assignment_type,
--        trigger_event, assigned_date, status, facility_id
--     from public.script_assignments
--     on conflict (staff_id, module_id) do nothing;
--   drop table public.script_assignments;
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. The table — exact shape of the other three assignment tables.
--    module_id is kept for pattern parity (UNIQUE key, shared frontend
--    mapping); today it is always 'scripts'.
-- ----------------------------------------------------------------------------
create table if not exists public.script_assignments (
  id              uuid primary key default gen_random_uuid(),
  staff_id        uuid not null,
  module_id       text not null default 'scripts',
  assigned_by     text,          -- assigner's display name, matches the other three
  type            text not null default 'remediation',
  trigger         text,
  assignment_type text,          -- audit columns, dual-written with type/trigger
  trigger_event   text,          -- (same convention as F&I, 20260702130000)
  assigned_date   date not null default current_date,
  status          text not null default 'assigned',
  facility_id     uuid,          -- audit denorm; RLS scopes via staff.fid, not this
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (staff_id, module_id)
);

create index if not exists idx_script_assignments_staff    on public.script_assignments(staff_id);
create index if not exists idx_script_assignments_facility on public.script_assignments(facility_id);

drop trigger if exists script_assignments_touch_updated_at on public.script_assignments;
create trigger script_assignments_touch_updated_at
before update on public.script_assignments
for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 2. RLS — the same rule set foundations_assignments carries today, which is
--    what T92's client-side guards already promise:
--      SELECT own-or-leader · INSERT/UPDATE leaders only, assessors blocked
--      (#55 helper) · DELETE master_admin only.
-- ----------------------------------------------------------------------------
alter table public.script_assignments enable row level security;

drop policy if exists scr_assign_self_select   on public.script_assignments;
create policy scr_assign_self_select on public.script_assignments
  for select to authenticated
  using (staff_id = auth.uid() or public.sbd_fi_leader_scope(staff_id));

drop policy if exists scr_assign_insert on public.script_assignments;
create policy scr_assign_insert on public.script_assignments
  for insert to authenticated
  with check (public.sbd_fi_can_manage_assignments(staff_id));

drop policy if exists scr_assign_update on public.script_assignments;
create policy scr_assign_update on public.script_assignments
  for update to authenticated
  using (public.sbd_fi_can_manage_assignments(staff_id))
  with check (public.sbd_fi_can_manage_assignments(staff_id));

drop policy if exists scr_assign_delete on public.script_assignments;
create policy scr_assign_delete on public.script_assignments
  for delete to authenticated
  using (public.sbd_is_master_admin()
         or lower(coalesce(auth.jwt()->>'email','')) in
            ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com'));

grant select, insert, update, delete on public.script_assignments to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Move the T92 rows out of foundations_assignments. Idempotent: the insert
--    skips rows already moved, the delete only removes rows that verifiably
--    exist in the new table. assigned_by::text absorbs either column type
--    (repo DDL says uuid, prod is text — T111 drift).
-- ----------------------------------------------------------------------------
insert into public.script_assignments
    (staff_id, module_id, assigned_by, type, trigger, assignment_type,
     trigger_event, assigned_date, status, facility_id, created_at)
  select staff_id, module_id, assigned_by::text, type, trigger, assignment_type,
     trigger_event, assigned_date, status, facility_id, created_at
  from public.foundations_assignments
  where module_id = 'scripts'
  on conflict (staff_id, module_id) do nothing;

delete from public.foundations_assignments f
 where f.module_id = 'scripts'
   and exists (select 1 from public.script_assignments s
               where s.staff_id = f.staff_id and s.module_id = f.module_id);

commit;

-- ----------------------------------------------------------------------------
-- POST-APPLY VERIFICATION (read-only)
-- ----------------------------------------------------------------------------
-- 1. Policy set matches foundations_assignments' intent (1 SELECT, 1 INSERT,
--    1 UPDATE, 1 DELETE):
--      select policyname, cmd from pg_policies
--       where tablename = 'script_assignments' order by cmd;
-- 2. No scripts row left behind:
--      select count(*) from public.foundations_assignments where module_id='scripts';
--    Expected: 0.
-- 3. Rows arrived:
--      select count(*) from public.script_assignments;
