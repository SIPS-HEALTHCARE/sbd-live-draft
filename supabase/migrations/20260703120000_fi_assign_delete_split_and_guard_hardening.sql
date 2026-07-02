-- ============================================================================
-- Foundations/Instruments — Phase 7 QA follow-up: DELETE-scope fix + guard
-- hardening + assessor-role recognition.
--
-- APPLIED BY: the USER (Supabase MCP has no SBD prod access), AFTER
-- 20260702120000 and 20260702130000 are live (prod-confirmed 2026-07-03).
--
-- PRE-FLIGHT (run first, read-only): confirm the out-of-band master-only
-- DELETE policies from prod migration 20260702011118 exist on BOTH
-- assignments tables, otherwise §1 would remove leader DELETE without
-- leaving master DELETE behind:
--
--   select tablename, policyname, cmd, qual, with_check from pg_policies
--    where policyname ~ '_assign_(insert|update|delete)$';
--
--   Expected: foundations_assignments + instrument_assignments each show
--   *_assign_insert / *_assign_update / *_assign_delete with a master-only
--   predicate. If *_assign_delete is MISSING or not master-capable, STOP and
--   report back before applying.
--
-- WHAT THIS FIXES (from the Phase 7 QA audit):
--   §1  P1 — *_assign_leader_write was FOR ALL; permissive policies OR
--       together, so facility leaders could DELETE assignment rows via direct
--       PostgREST calls, defeating the master-only unassign intent
--       (out-of-band 20260702011118 + UI + api-supabase.js comment).
--       Fix: split into INSERT + UPDATE policies; DELETE is then granted
--       ONLY by the out-of-band master-only policy.
--   §2  P2 — sbd_fi_progress_guard did not protect g1/g2 on INSERT: a leader
--       could seed a brand-new progress row with passed quizzes (and via the
--       status-sync, a completed assignment) for a staff member who never
--       took them. Fix: non-owner INSERT resets g1/g2 to the column-default
--       open shape (mirrors the existing non-leader g3 reset).
--       Also: `complete` derivation wrapped in coalesce(..., false) so a
--       legacy/malformed gate JSON (missing "status") can never abort the
--       write with a NOT NULL violation; and the guard's is_leader check now
--       ORs the SIPS master-admin email fallback, aligning it with
--       sbd_fi_leader_scope (previously a SIPS master with a non-leader
--       portal row passed RLS but was silently demoted by the guard).
--   §3  P2 — the literal 'assessor' role (minted by approveReg on main since
--       33ffbda) had no RLS tier: such users saw own-rows-only and their G3
--       confirmations were silently preserved away. The shipped frontend
--       already treats 'assessor' as a system-wide, G3-confirm-capable,
--       assign-blocked role (foundations.js/instruments.js isSystemWide +
--       isAssessor). Fix: recognize 'assessor' alongside 'staff_admin' in
--       sbd_fi_leader_scope (same assigned_facility_ids scoping, empty = ALL)
--       and in the guard's leader list. Per D1a, RLS stays write-permissive
--       for assessors; "cannot assign" remains UI-enforced.
--
-- RE-RUN HAZARDS (same class as Phase-0 §5 — order matters):
--   * If 20260702130000 is EVER re-applied, it recreates *_assign_leader_write
--     FOR ALL and the pre-assessor helper functions. Re-apply THIS migration
--     afterwards.
--   * This file itself is idempotent and safe to re-run.
--
-- ROLLBACK: re-run 20260702130000 §3-§5 (restores FOR ALL leader_write and
-- the previous function bodies), accepting the P1/P2 defects back.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Split *_assign_leader_write (FOR ALL) into INSERT + UPDATE.
--    Leader SELECT is already provided by *_assign_leader_select (unchanged).
--    DELETE is left exclusively to the out-of-band master-only policy.
-- ----------------------------------------------------------------------------

drop policy if exists fnd_assign_leader_write  on public.foundations_assignments;
drop policy if exists fnd_assign_leader_insert on public.foundations_assignments;
drop policy if exists fnd_assign_leader_update on public.foundations_assignments;

create policy fnd_assign_leader_insert on public.foundations_assignments
  for insert to authenticated
  with check (public.sbd_fi_leader_scope(staff_id));

create policy fnd_assign_leader_update on public.foundations_assignments
  for update to authenticated
  using (public.sbd_fi_leader_scope(staff_id))
  with check (public.sbd_fi_leader_scope(staff_id));

drop policy if exists inst_assign_leader_write  on public.instrument_assignments;
drop policy if exists inst_assign_leader_insert on public.instrument_assignments;
drop policy if exists inst_assign_leader_update on public.instrument_assignments;

create policy inst_assign_leader_insert on public.instrument_assignments
  for insert to authenticated
  with check (public.sbd_fi_leader_scope(staff_id));

create policy inst_assign_leader_update on public.instrument_assignments
  for update to authenticated
  using (public.sbd_fi_leader_scope(staff_id))
  with check (public.sbd_fi_leader_scope(staff_id));

-- ----------------------------------------------------------------------------
-- 2. Recognize 'assessor' in the leader-scope helper (assessor tier, same
--    assigned_facility_ids scoping as staff_admin; empty/NULL = ALL).
--    Body otherwise identical to 20260702130000.
-- ----------------------------------------------------------------------------

create or replace function public.sbd_fi_leader_scope(target_staff uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.sbd_portal_users u
            where u.auth_uid = auth.uid() and u.role in ('master_admin','admin'))
    or lower(coalesce(auth.jwt()->>'email','')) in
      ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
    or exists (
      select 1 from public.sbd_portal_users u, public.staff s
      where u.auth_uid = auth.uid() and u.role in ('staff_admin','assessor')
        and s.id = target_staff
        and ( coalesce(array_length(u.assigned_facility_ids, 1), 0) = 0
              or s.fid::text in (select x.fid::text from unnest(u.assigned_facility_ids) as x(fid)) )
    )
    or exists (
      select 1 from public.sbd_portal_users u, public.staff s
      where u.auth_uid = auth.uid() and u.role in ('facility_admin','hospital')
        and s.id = target_staff
        and u.facility_id::text = s.fid::text
    );
$$;

-- ----------------------------------------------------------------------------
-- 3. Progress guard hardening: INSERT-path g1/g2 owner protection, 'assessor'
--    as leader, email-fallback alignment, NULL-safe `complete`.
--    Body otherwise identical to 20260702130000 §4b (facility fill, D4
--    PRESERVE on UPDATE, revoke cascade, server-derived complete).
-- ----------------------------------------------------------------------------

create or replace function public.sbd_fi_progress_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor     uuid := auth.uid();
  is_leader boolean := false;
  is_owner  boolean := false;
begin
  if actor is not null then
    is_leader := public.sbd_fi_actor_role() in
                ('master_admin','admin','facility_admin','staff_admin','hospital','assessor')
      or lower(coalesce(auth.jwt()->>'email','')) in
        ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com');
    is_owner  := (new.staff_id = actor)
      or exists (select 1 from public.sbd_portal_users u
                where u.auth_uid = actor and u.staff_id is not null
                  and u.staff_id::text = new.staff_id::text);

    if tg_op = 'UPDATE' then
      -- D4: only the owning staff member may change g1/g2; only leaders g3.
      if not is_owner  then new.g1 := old.g1; new.g2 := old.g2; end if;
      if not is_leader then new.g3 := old.g3; end if;
    else
      -- INSERT: a non-owner cannot seed quiz results; a non-leader cannot
      -- seed confirmed observations. Shapes match the column defaults.
      if not is_owner then
        new.g1 := '{"status":"open","score":0,"attempts":[]}'::jsonb;
        new.g2 := '{"status":"open","score":0,"attempts":[]}'::jsonb;
      end if;
      if not is_leader then new.g3 := '{"status":"open","items":[]}'::jsonb; end if;
    end if;
  end if;

  if new.facility_id is null then
    select s.fid into new.facility_id from public.staff s where s.id = new.staff_id;
  end if;

  -- Revoke cascade (§8.2): an explicitly-unconfirmed item forces g3 out of 'pass'
  -- (the frontend leaves status 'pass' when an educator un-confirms an item).
  if (new.g3->>'status') = 'pass' and exists (
      select 1 from jsonb_array_elements(coalesce(new.g3->'items','[]'::jsonb)) it
      where coalesce(it->>'confirmed','false') <> 'true'
    ) then
    new.g3 := jsonb_set(new.g3, '{status}', '"open"');
  end if;

  -- `complete` is server-derived: all three gates must be 'pass'.
  -- coalesce: a gate JSON missing "status" yields SQL NULL -> treat as false
  -- rather than aborting the write against the NOT NULL column.
  new.complete := coalesce(((new.g1->>'status') = 'pass'
              and (new.g2->>'status') = 'pass'
              and (new.g3->>'status') = 'pass'), false);
  new.updated_at := now();
  return new;
end $$;

-- Triggers already point at these function names (trg_fi_*_prog_guard on both
-- progress tables; trg_fi_*_assign_fill unaffected) — no trigger DDL needed.

commit;

-- ----------------------------------------------------------------------------
-- POST-APPLY VERIFICATION (read-only)
-- ----------------------------------------------------------------------------
-- 1. No FOR ALL leader policy remains; per assignments table expect:
--    self_select(SELECT), leader_select(SELECT), leader_insert(INSERT),
--    leader_update(UPDATE) + out-of-band assign_insert/update/delete:
--      select tablename, policyname, cmd from pg_policies
--       where tablename in ('foundations_assignments','instrument_assignments')
--       order by 1,2;
-- 2. Guard function contains the INSERT owner check:
--      select prosrc ~ 'if not is_owner then' from pg_proc
--       where proname = 'sbd_fi_progress_guard';
-- 3. Assessor recognized:
--      select prosrc ~ 'assessor' from pg_proc where proname = 'sbd_fi_leader_scope';
