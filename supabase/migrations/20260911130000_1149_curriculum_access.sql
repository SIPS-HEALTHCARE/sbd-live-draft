-- ============================================================================
-- #1149 — curriculum_access: which curricula a person may be assigned
-- (Shawn board 11 Sep, ledger T133)
--
-- Today the only server gate on an assignment is sbd_fi_can_manage_assignments(),
-- which asks "may YOU assign to this person" and never "may this person hold this
-- curriculum". Preceptor is the one curriculum that already answers the second
-- question, through its own preceptor_access table — and per Iggie's decision 9 it
-- stays there, untouched, with its own control.
--
-- This table answers it for the other four: one row per (staff, curriculum), with
-- who granted it and when. The grant is granted from the staff profile by anyone who
-- could already write an assignment for that person (sbd_fi_can_manage_assignments),
-- and it is enforced HERE, in the INSERT policy of each assignment table — the
-- buttons in src/js only carry the message (Standards B3).
--
-- Module -> curriculum is resolved THROUGH the #1148 registry, so
-- foundations_assignments — which carries Foundations *and* Endoscopy (en-%) rows,
-- and historically a Scripts row — is gated correctly per row with no module_id
-- lists in SQL. A module the registry does not list is ALLOWED THROUGH: same
-- fail-open registryModules() already takes when the table is empty, so a half-
-- seeded registry can never silently freeze assignment.
--
-- ⚠️ §3 BACKFILLS BEFORE §4 SWAPS THE POLICIES, and the order matters. Deny-by-
-- default with no backfill would stop every leader from assigning anything to
-- anyone the moment this lands, including the new-hire Foundations rollout through
-- hAssignAllFnd/assignAllModules. The backfill grants every (staff, curriculum)
-- pair that ALREADY holds an assignment, so nobody mid-curriculum stops; the gate
-- bites on the next person.
--
-- Revoke is a DELETE, not a state flip (no 'revoked' tri-state as in
-- preceptor_access). The gate is on *assigning*: revoking does not lock a reader
-- and does not touch existing assignments or their progress.
--
-- RLS: read own-or-leader (mirrors prc_access_select); write
-- sbd_fi_can_manage_assignments(staff_id). The name carries neither the `sbd_` nor
-- the `foundations_` prefix the T33 loop walks, so the restrictive sbd_mfa_gate
-- policy is written out explicitly — exactly as #1148 had to for curriculum_modules.
--
-- APPLIED BY: the USER via `supabase db query --linked -f <this file>` (CLI is the
-- only prod SQL path; the dashboard editor rolls back manual-COMMIT scripts).
-- ORDER: after 20260908140000 (#1148 registry) — the gate reads curriculum_modules.
-- Frontend can ship before or after: the client helpers fail open when
-- DB.curriculumAccess is undefined, and this file is what actually holds.
--
-- ROLLBACK (in this order — the policies reference the function):
--   -- restore the three pre-#1149 INSERT policies, kept verbatim in §5 below
--   drop function if exists public.sbd_has_curriculum_access(uuid, text);
--   drop table if exists public.curriculum_access;
-- VERIFY: supabase/verify/1149_curriculum_access_check.sql
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. The table
-- ----------------------------------------------------------------------------
-- No FK on staff_id: neither preceptor_access nor the three assignment tables
-- carry one (orphan cleanup + FKs were deferred in #843), and adding one here
-- would make the §3 backfill fail on the first orphan assignment row.
create table if not exists public.curriculum_access (
  staff_id    uuid not null,
  curriculum  text not null
              -- 'preceptor' is deliberately absent: decision 9 keeps preceptor
              -- access in preceptor_access. Structural, not a convention.
              check (curriculum in ('foundations','instruments','scripts','endoscopy')),
  granted_by  text,                                    -- display name, as preceptor_access.granted_by
  granted_at  timestamptz not null default now(),
  primary key (staff_id, curriculum)
);

create index if not exists idx_curriculum_access_staff
  on public.curriculum_access(staff_id);

comment on table public.curriculum_access is
  '#1149 (board 11 Sep, T133): which curricula a staff member may be assigned. One row per (staff, curriculum) = granted; no row = not granted; revoke deletes the row. Enforced in the INSERT policies of foundations_assignments / instrument_assignments / script_assignments via sbd_has_curriculum_access(). Preceptor is not here — see preceptor_access.';

-- ----------------------------------------------------------------------------
-- 2. The gate — module -> curriculum through the #1148 registry, then the grant
-- ----------------------------------------------------------------------------
-- Returns true when the module is not one of the four gated curricula (unknown to
-- the registry, or a preceptor module), OR when the staff member holds the grant.
-- `active` is deliberately NOT filtered: switching a module off in the registry
-- must not fail-open its gate.
create or replace function public.sbd_has_curriculum_access(target_staff uuid, p_module_id text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select
    not exists (
      select 1 from public.curriculum_modules m
      where m.module_id = p_module_id
        and m.curriculum in ('foundations','instruments','scripts','endoscopy')
    )
    or exists (
      select 1
      from public.curriculum_modules m
      join public.curriculum_access a
        on a.curriculum = m.curriculum
       and a.staff_id = target_staff
      where m.module_id = p_module_id
    );
$$;

alter function public.sbd_has_curriculum_access(uuid, text) owner to postgres;

comment on function public.sbd_has_curriculum_access(uuid, text) is
  '#1149: does this staff member hold the curriculum grant for this module? Resolves module -> curriculum through curriculum_modules (#1148). Fail-open for a module the registry does not list, and for preceptor modules (preceptor_access owns those).';

-- ----------------------------------------------------------------------------
-- 3. RLS on the new table
-- ----------------------------------------------------------------------------
alter table public.curriculum_access enable row level security;

-- Read: own row or a leader in scope. Mirrors prc_access_select.
drop policy if exists ca_select on public.curriculum_access;
create policy ca_select on public.curriculum_access
  for select to authenticated
  using (staff_id = auth.uid() or public.sbd_fi_leader_scope(staff_id));

-- Write: exactly the people who can already write an assignment for this person.
-- A gate stricter than the action it guards would push leaders to ask a master
-- admin for every new hire.
drop policy if exists ca_write on public.curriculum_access;
create policy ca_write on public.curriculum_access
  for all to authenticated
  using (public.sbd_fi_can_manage_assignments(staff_id))
  with check (public.sbd_fi_can_manage_assignments(staff_id));

-- T33 / #1144 admin second door. Written out because the T33 prefix loop does not
-- reach this name (no sbd_/foundations_ prefix), same as curriculum_modules.
drop policy if exists sbd_mfa_gate on public.curriculum_access;
create policy sbd_mfa_gate on public.curriculum_access
  as restrictive for all to authenticated
  using (public.sbd_mfa_satisfied()) with check (public.sbd_mfa_satisfied());

revoke all on public.curriculum_access from anon;
grant select, insert, update, delete on public.curriculum_access to authenticated;

-- ----------------------------------------------------------------------------
-- 4. BACKFILL — before the policy swap, so nothing live stops
-- ----------------------------------------------------------------------------
-- Every (staff, curriculum) pair that already holds an assignment gets the grant,
-- stamped with the earliest assigned date so the profile shows when it effectively
-- began rather than today. Rows whose module_id is not in the registry are skipped
-- on purpose: the gate fails open for them anyway, so a grant would be noise.
insert into public.curriculum_access (staff_id, curriculum, granted_by, granted_at)
select x.staff_id,
       m.curriculum,
       '#1149 backfill',
       coalesce(min(x.assigned_date)::timestamptz, now())
from (
  select staff_id, module_id, assigned_date from public.foundations_assignments
  union all
  select staff_id, module_id, assigned_date from public.instrument_assignments
  union all
  select staff_id, module_id, assigned_date from public.script_assignments
) x
join public.curriculum_modules m on m.module_id = x.module_id
where x.staff_id is not null
  and m.curriculum in ('foundations','instruments','scripts','endoscopy')
group by x.staff_id, m.curriculum
on conflict (staff_id, curriculum) do nothing;

-- ----------------------------------------------------------------------------
-- 5. The three INSERT policies, gated
-- ----------------------------------------------------------------------------
-- Pre-#1149, verbatim, for the rollback:
--   create policy fnd_assign_insert  on public.foundations_assignments for insert to authenticated
--     with check (public.sbd_fi_can_manage_assignments(staff_id));
--   create policy inst_assign_insert on public.instrument_assignments  for insert to authenticated
--     with check (public.sbd_fi_can_manage_assignments(staff_id));
--   create policy scr_assign_insert  on public.script_assignments      for insert to authenticated
--     with check (public.sbd_fi_can_manage_assignments(staff_id));
--
-- UPDATE and DELETE are left alone: this gate is about who may be *given* a
-- curriculum, not about editing or removing an assignment that already exists.
-- Revoking access must not strand a leader with a row they can no longer close out.

drop policy if exists fnd_assign_insert on public.foundations_assignments;
create policy fnd_assign_insert on public.foundations_assignments
  for insert to authenticated
  with check (public.sbd_fi_can_manage_assignments(staff_id)
              and public.sbd_has_curriculum_access(staff_id, module_id));

drop policy if exists inst_assign_insert on public.instrument_assignments;
create policy inst_assign_insert on public.instrument_assignments
  for insert to authenticated
  with check (public.sbd_fi_can_manage_assignments(staff_id)
              and public.sbd_has_curriculum_access(staff_id, module_id));

drop policy if exists scr_assign_insert on public.script_assignments;
create policy scr_assign_insert on public.script_assignments
  for insert to authenticated
  with check (public.sbd_fi_can_manage_assignments(staff_id)
              and public.sbd_has_curriculum_access(staff_id, module_id));

commit;
