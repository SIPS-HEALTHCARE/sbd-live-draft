  -- ============================================================================
  -- PHASE 2 — Foundations & Instruments ADDENDUM schema + RLS
  --   plans/FOUNDATIONS_INSTRUMENTS_PRODUCTION_PLAN.md  §"PHASE 2"
  --   RLS Addendum v1.1: Master Admin + Assessor system-wide; facility scoping;
  --   column-level gate protection; audit columns; revoke-cascade persistence.
  -- ----------------------------------------------------------------------------
  -- APPLIED BY: the USER, AFTER 20260702120000 (Phase 1 correctness) is applied.
  -- SAFETY:     Additive + idempotent + transactional. Existing hospital/staff
  --             portal behavior is preserved (verified against the deployed
  --             frontend flows — see "FRONTEND COMPATIBILITY" below). Prefer a
  --             Supabase branch/staging first if available.
  --
  -- WHAT THIS ADDS
  --   1. facility_id uuid on all 4 tables (audit denorm; backfilled from staff.fid;
  --      auto-filled server-side on write, so the frontend does NOT need to send it).
  --   2. assignment_type / trigger_event audit columns on the 2 assignments tables
  --      (addendum §7.1), backfilled from type/"trigger", kept in sync BOTH ways by
  --      trigger during the transition (plan §4-Q3 answered as: dual-write, no rename).
  --   3. Three-tier RLS on all 4 tables (replaces "own row vs any-leader"):
  --        own       staff_id = auth.uid()  [+ portal staff_id link, belt-test parity]
  --        facility  facility_admin / hospital -> staff currently in THEIR facility
  --        system    master_admin (+ SIPS email fallback) always;
  --                  staff_admin ("Assessor") per assigned_facility_ids, EMPTY = ALL
  --                  (matches the frontend convention in renderAAllStaff; flag C3)
  --   4. D4 column-level gate protection on *_progress via BEFORE trigger:
  --        only the OWNING STAFF can change g1/g2; only LEADERS can change g3.
  --      Enforcement is PRESERVE (protected gates are reset to their stored value),
  --      NOT reject: the frontend upserts the WHOLE row (foundations.js:487), so a
  --      hard reject would throw away legitimate sibling-gate data whenever a
  --      client is stale, and the error is swallowed by .catch(console.warn).
  --      Preserving gives the same guarantee (the protected gate cannot be changed
  --      by the wrong actor) with zero collateral data loss.
  --   5. Revoke-cascade persistence (addendum §8.2), server-side:
  --        - any explicitly-unconfirmed g3 item forces g3.status 'pass' -> 'open'
  --        - complete is SERVER-DERIVED: g1+g2+g3 all 'pass'
  --        - assignment.status is synced from progress.complete ('completed' /
  --          'assigned') by an AFTER trigger. This also FIXES a pre-existing gap:
  --          when the final passing gate was G1/G2 (a staff write), the frontend's
  --          status PATCH was rejected by the leader-only assignment policy and
  --          swallowed — assignment rows stayed 'assigned' forever.
  --
  -- PHASE-0 CORRECTIONS CARRIED FORWARD (do not "fix" these back)
  --   - Own-row predicate stays `staff_id = auth.uid()` — staff.id IS the auth uid.
  --   - NO auth.jwt()->>'staff_id'/'facility_id'/'role' predicates — those custom
  --     claims are never minted on this platform (the plan's Phase-2 step 3
  --     facility predicate `(auth.jwt()->>'facility_id')::uuid` would be dead
  --     code). Facility tier reads sbd_portal_users.facility_id instead, exactly
  --     like the belt-test RLS fix (20260620002000).
  --   - Facility tier derives the staff's facility from staff.fid AT QUERY TIME
  --     (not from the row's denormalized facility_id) so visibility follows the
  --     staff member when they transfer facilities. facility_id on the rows is an
  --     audit snapshot ("facility at time of write"), not the RLS source.
  --
  -- FRONTEND COMPATIBILITY (deployed UI, before Phases 3-5 ship)
  --   - hospital/facility_admin: fetch was unfiltered + client-filtered to ST.hFid;
  --     RLS now returns exactly that facility subset -> UI unchanged.
  --   - staff_member: own rows, unchanged. Leaders' assign/G3-confirm: unchanged.
  --   - master_admin/staff_admin: cannot reach these features yet (no a- views);
  --     narrowed reads have no UI impact.
  --
  -- ROLLBACK (inverse): drop the 6 new policies per table + recreate the Phase-1
  --   select policies and 20260625000000/020000 write policies; drop triggers
  --   trg_fi_* ; drop functions sbd_fi_*; columns/backfill may stay (additive).
  -- ============================================================================

  begin;

  -- ----------------------------------------------------------------------------
  -- 1. SCHEMA — new columns + indexes (all additive/idempotent)
  -- ----------------------------------------------------------------------------
  alter table public.foundations_assignments add column if not exists facility_id uuid;
  alter table public.instrument_assignments  add column if not exists facility_id uuid;
  alter table public.foundations_progress    add column if not exists facility_id uuid;
  alter table public.instrument_progress     add column if not exists facility_id uuid;

  alter table public.foundations_assignments add column if not exists assignment_type text;
  alter table public.foundations_assignments add column if not exists trigger_event   text;
  alter table public.instrument_assignments  add column if not exists assignment_type text;
  alter table public.instrument_assignments  add column if not exists trigger_event   text;

  create index if not exists idx_foundations_assignments_facility on public.foundations_assignments(facility_id);
  create index if not exists idx_instrument_assignments_facility  on public.instrument_assignments(facility_id);
  create index if not exists idx_foundations_progress_facility    on public.foundations_progress(facility_id);
  create index if not exists idx_instrument_progress_facility     on public.instrument_progress(facility_id);

  -- ----------------------------------------------------------------------------
  -- 2. BACKFILLS (idempotent; run BEFORE triggers exist so they are pure fills)
  -- ----------------------------------------------------------------------------
  update public.foundations_assignments a set facility_id = s.fid
    from public.staff s where s.id = a.staff_id and a.facility_id is null;
  update public.instrument_assignments a set facility_id = s.fid
    from public.staff s where s.id = a.staff_id and a.facility_id is null;
  update public.foundations_progress p set facility_id = s.fid
    from public.staff s where s.id = p.staff_id and p.facility_id is null;
  update public.instrument_progress p set facility_id = s.fid
    from public.staff s where s.id = p.staff_id and p.facility_id is null;

  update public.foundations_assignments set assignment_type = "type"
    where assignment_type is null and "type" is not null;
  update public.foundations_assignments set trigger_event = "trigger"
    where trigger_event is null and "trigger" is not null;
  update public.instrument_assignments set assignment_type = "type"
    where assignment_type is null and "type" is not null;
  update public.instrument_assignments set trigger_event = "trigger"
    where trigger_event is null and "trigger" is not null;

  -- ----------------------------------------------------------------------------
  -- 3. HELPER FUNCTIONS (security definer, stable — bypass RLS on the lookup
  --    tables; style mirrors sbd_is_admin() in 20260611120000 and the belt-test
  --    policies in 20260620002000, including the SIPS master-admin email fallback
  --    because master admins may not exist in sbd_portal_users at all)
  -- ----------------------------------------------------------------------------

  -- Actor's platform role: portal-profile role, else 'master_admin' for the known
  -- SIPS master-admin emails, else null.
  create or replace function public.sbd_fi_actor_role() returns text
  language sql stable security definer set search_path = public as $$
    select coalesce(
      (select u.role from public.sbd_portal_users u where u.auth_uid = auth.uid() limit 1),
      case when lower(coalesce(auth.jwt()->>'email','')) in
        ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
      then 'master_admin' end
    );
  $$;

  -- Leader visibility/management scope over one staff member's rows.
  --   master tier : master_admin/'admin' role, or SIPS email fallback -> everything
  --   assessor    : staff_admin, scoped by assigned_facility_ids; EMPTY/NULL = ALL
  --                 (frontend convention, renderAAllStaff — see plan D1/C3)
  --   facility    : facility_admin/hospital, scoped to the staff member's CURRENT
  --                 facility (staff.fid at query time, robust to transfers)
  -- D1a: staff_admin ("Assessor") deliberately KEEPS write capability at the RLS
  -- layer; "Assessor cannot assign" is enforced in the UI only (Phase 4).
  create or replace function public.sbd_fi_leader_scope(target_staff uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select
      exists (select 1 from public.sbd_portal_users u
              where u.auth_uid = auth.uid() and u.role in ('master_admin','admin'))
      or lower(coalesce(auth.jwt()->>'email','')) in
        ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
      or exists (
        select 1 from public.sbd_portal_users u, public.staff s
        where u.auth_uid = auth.uid() and u.role = 'staff_admin'
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
  -- 4. TRIGGERS
  -- ----------------------------------------------------------------------------

  -- 4a. Assignments: fill facility_id (audit snapshot) + keep type<->assignment_type
  --     and "trigger"<->trigger_event mirrored BOTH ways during the transition, so
  --     the migration works with the CURRENT frontend (writes old names) and with
  --     Phase-3+ writers (new names) without a deploy-order dependency.
  create or replace function public.sbd_fi_assignment_fill() returns trigger
  language plpgsql security definer set search_path = public as $$
  begin
    if new.facility_id is null then
      select s.fid into new.facility_id from public.staff s where s.id = new.staff_id;
    end if;
    if tg_op = 'INSERT' then
      new.assignment_type := coalesce(new.assignment_type, new."type");
      new."type"          := coalesce(new."type", new.assignment_type, 'remediation');
      new.trigger_event   := coalesce(new.trigger_event, new."trigger");
      new."trigger"       := coalesce(new."trigger", new.trigger_event);
    else
      if new."type" is distinct from old."type"
        and new.assignment_type is not distinct from old.assignment_type then
        new.assignment_type := new."type";
      elsif new.assignment_type is distinct from old.assignment_type
        and new."type" is not distinct from old."type" then
        new."type" := coalesce(new.assignment_type, new."type");
      end if;
      if new."trigger" is distinct from old."trigger"
        and new.trigger_event is not distinct from old.trigger_event then
        new.trigger_event := new."trigger";
      elsif new.trigger_event is distinct from old.trigger_event
        and new."trigger" is not distinct from old."trigger" then
        new."trigger" := new.trigger_event;
      end if;
    end if;
    new.updated_at := now();
    return new;
  end $$;

  drop trigger if exists trg_fi_fnd_assign_fill on public.foundations_assignments;
  create trigger trg_fi_fnd_assign_fill
    before insert or update on public.foundations_assignments
    for each row execute function public.sbd_fi_assignment_fill();

  drop trigger if exists trg_fi_inst_assign_fill on public.instrument_assignments;
  create trigger trg_fi_inst_assign_fill
    before insert or update on public.instrument_assignments
    for each row execute function public.sbd_fi_assignment_fill();

  -- 4b. Progress: D4 gate protection (preserve semantics) + facility fill +
  --     revoke-cascade + server-derived `complete`.
  --     Skips actor checks when auth.uid() is null (service-role / SQL editor),
  --     so edge functions and admin maintenance are never blocked.
  create or replace function public.sbd_fi_progress_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
  declare
    actor     uuid := auth.uid();
    is_leader boolean := false;
    is_owner  boolean := false;
  begin
    if actor is not null then
      is_leader := public.sbd_fi_actor_role() in
                  ('master_admin','admin','facility_admin','staff_admin','hospital');
      is_owner  := (new.staff_id = actor)
        or exists (select 1 from public.sbd_portal_users u
                  where u.auth_uid = actor and u.staff_id is not null
                    and u.staff_id::text = new.staff_id::text);

      if tg_op = 'UPDATE' then
        -- D4: only the owning staff member may change g1/g2; only leaders g3.
        if not is_owner  then new.g1 := old.g1; new.g2 := old.g2; end if;
        if not is_leader then new.g3 := old.g3; end if;
      else -- INSERT: a non-leader can only start with an untouched Gate 3
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
    new.complete := ((new.g1->>'status') = 'pass'
                and (new.g2->>'status') = 'pass'
                and (new.g3->>'status') = 'pass');
    new.updated_at := now();
    return new;
  end $$;

  drop trigger if exists trg_fi_fnd_prog_guard on public.foundations_progress;
  create trigger trg_fi_fnd_prog_guard
    before insert or update on public.foundations_progress
    for each row execute function public.sbd_fi_progress_guard();

  drop trigger if exists trg_fi_inst_prog_guard on public.instrument_progress;
  create trigger trg_fi_inst_prog_guard
    before insert or update on public.instrument_progress
    for each row execute function public.sbd_fi_progress_guard();

  -- 4c. Sync assignment.status from progress.complete (both directions:
  --     'completed' on completion, back to 'assigned' on revoke-cascade).
  --     SECURITY DEFINER so the sync is not blocked by assignment RLS when the
  --     completing write comes from the staff member (the pre-existing gap).
  create or replace function public.sbd_fi_progress_status_sync() returns trigger
  language plpgsql security definer set search_path = public as $$
  declare
    target_status text := case when new.complete then 'completed' else 'assigned' end;
  begin
    if tg_op = 'INSERT' and not new.complete then return null; end if;
    if tg_op = 'UPDATE' and new.complete = old.complete then return null; end if;
    if tg_table_name = 'foundations_progress' then
      update public.foundations_assignments
        set status = target_status
      where staff_id = new.staff_id and module_id = new.module_id
        and status is distinct from target_status;
    else
      update public.instrument_assignments
        set status = target_status
      where staff_id = new.staff_id and module_id = new.module_id
        and status is distinct from target_status;
    end if;
    return null;
  end $$;

  drop trigger if exists trg_fi_fnd_prog_status_sync on public.foundations_progress;
  create trigger trg_fi_fnd_prog_status_sync
    after insert or update on public.foundations_progress
    for each row execute function public.sbd_fi_progress_status_sync();

  drop trigger if exists trg_fi_inst_prog_status_sync on public.instrument_progress;
  create trigger trg_fi_inst_prog_status_sync
    after insert or update on public.instrument_progress
    for each row execute function public.sbd_fi_progress_status_sync();

  -- ----------------------------------------------------------------------------
  -- 5. RLS — three-tier policies (replace Phase-1/shipped "own vs any-leader")
  --    Per-tier permissive policies OR together, mirroring the belt-test layout.
  -- ----------------------------------------------------------------------------

  -- Drop old policies (shipped + Phase-1 recreations), and new names for re-run safety.
  drop policy if exists fnd_assign_select        on public.foundations_assignments;
  drop policy if exists fnd_assign_write         on public.foundations_assignments;
  drop policy if exists fnd_assign_self_select   on public.foundations_assignments;
  drop policy if exists fnd_assign_leader_select on public.foundations_assignments;
  drop policy if exists fnd_assign_leader_write  on public.foundations_assignments;

  drop policy if exists inst_assign_select        on public.instrument_assignments;
  drop policy if exists inst_assign_write         on public.instrument_assignments;
  drop policy if exists inst_assign_self_select   on public.instrument_assignments;
  drop policy if exists inst_assign_leader_select on public.instrument_assignments;
  drop policy if exists inst_assign_leader_write  on public.instrument_assignments;

  drop policy if exists fnd_prog_select        on public.foundations_progress;
  drop policy if exists fnd_prog_insert        on public.foundations_progress;
  drop policy if exists fnd_prog_update        on public.foundations_progress;
  drop policy if exists fnd_prog_self_select   on public.foundations_progress;
  drop policy if exists fnd_prog_leader_select on public.foundations_progress;
  drop policy if exists fnd_prog_self_insert   on public.foundations_progress;
  drop policy if exists fnd_prog_leader_insert on public.foundations_progress;
  drop policy if exists fnd_prog_self_update   on public.foundations_progress;
  drop policy if exists fnd_prog_leader_update on public.foundations_progress;

  drop policy if exists inst_prog_select        on public.instrument_progress;
  drop policy if exists inst_prog_insert        on public.instrument_progress;
  drop policy if exists inst_prog_update        on public.instrument_progress;
  drop policy if exists inst_prog_self_select   on public.instrument_progress;
  drop policy if exists inst_prog_leader_select on public.instrument_progress;
  drop policy if exists inst_prog_self_insert   on public.instrument_progress;
  drop policy if exists inst_prog_leader_insert on public.instrument_progress;
  drop policy if exists inst_prog_self_update   on public.instrument_progress;
  drop policy if exists inst_prog_leader_update on public.instrument_progress;

  -- ── foundations_assignments ──
  create policy fnd_assign_self_select on public.foundations_assignments
    for select to authenticated
    using (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = foundations_assignments.staff_id::text));
  create policy fnd_assign_leader_select on public.foundations_assignments
    for select to authenticated
    using (public.sbd_fi_leader_scope(staff_id));
  create policy fnd_assign_leader_write on public.foundations_assignments
    for all to authenticated
    using (public.sbd_fi_leader_scope(staff_id))
    with check (public.sbd_fi_leader_scope(staff_id));

  -- ── instrument_assignments (mirror) ──
  create policy inst_assign_self_select on public.instrument_assignments
    for select to authenticated
    using (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = instrument_assignments.staff_id::text));
  create policy inst_assign_leader_select on public.instrument_assignments
    for select to authenticated
    using (public.sbd_fi_leader_scope(staff_id));
  create policy inst_assign_leader_write on public.instrument_assignments
    for all to authenticated
    using (public.sbd_fi_leader_scope(staff_id))
    with check (public.sbd_fi_leader_scope(staff_id));

  -- ── foundations_progress ──
  create policy fnd_prog_self_select on public.foundations_progress
    for select to authenticated
    using (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = foundations_progress.staff_id::text));
  create policy fnd_prog_leader_select on public.foundations_progress
    for select to authenticated
    using (public.sbd_fi_leader_scope(staff_id));
  create policy fnd_prog_self_insert on public.foundations_progress
    for insert to authenticated
    with check (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = foundations_progress.staff_id::text));
  create policy fnd_prog_leader_insert on public.foundations_progress
    for insert to authenticated
    with check (public.sbd_fi_leader_scope(staff_id));
  create policy fnd_prog_self_update on public.foundations_progress
    for update to authenticated
    using (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = foundations_progress.staff_id::text))
    with check (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = foundations_progress.staff_id::text));
  create policy fnd_prog_leader_update on public.foundations_progress
    for update to authenticated
    using (public.sbd_fi_leader_scope(staff_id))
    with check (public.sbd_fi_leader_scope(staff_id));

  -- ── instrument_progress (mirror) ──
  create policy inst_prog_self_select on public.instrument_progress
    for select to authenticated
    using (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = instrument_progress.staff_id::text));
  create policy inst_prog_leader_select on public.instrument_progress
    for select to authenticated
    using (public.sbd_fi_leader_scope(staff_id));
  create policy inst_prog_self_insert on public.instrument_progress
    for insert to authenticated
    with check (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = instrument_progress.staff_id::text));
  create policy inst_prog_leader_insert on public.instrument_progress
    for insert to authenticated
    with check (public.sbd_fi_leader_scope(staff_id));
  create policy inst_prog_self_update on public.instrument_progress
    for update to authenticated
    using (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = instrument_progress.staff_id::text))
    with check (staff_id = auth.uid()
          or exists (select 1 from public.sbd_portal_users u
                      where u.auth_uid = auth.uid() and u.staff_id is not null
                        and u.staff_id::text = instrument_progress.staff_id::text));
  create policy inst_prog_leader_update on public.instrument_progress
    for update to authenticated
    using (public.sbd_fi_leader_scope(staff_id))
    with check (public.sbd_fi_leader_scope(staff_id));

  commit;

  -- ============================================================================
  -- POST-APPLY VERIFICATION (read-only)
  --   1) Columns exist on all 4 tables:
  --      select table_name, column_name from information_schema.columns
  --       where column_name in ('facility_id','assignment_type','trigger_event')
  --         and table_name like any (array['foundations_%','instrument_%'])
  --       order by 1,2;
  --   2) Backfill coverage (facility_id null only for staff with null fid):
  --      select 'fa' t, count(*) filter (where facility_id is null) nulls, count(*) total
  --        from foundations_assignments
  --      union all select 'fp', count(*) filter (where facility_id is null), count(*)
  --        from foundations_progress
  --      union all select 'ia', count(*) filter (where facility_id is null), count(*)
  --        from instrument_assignments
  --      union all select 'ip', count(*) filter (where facility_id is null), count(*)
  --        from instrument_progress;
  --   3) Policies (expect 3 per assignments table, 6 per progress table):
  --      select tablename, policyname, cmd from pg_policies
  --       where tablename like 'foundations%' or tablename like 'instrument%'
  --       order by 1,2;
  --   4) Triggers (expect fill on both assignments, guard + status_sync on both
  --      progress tables):
  --      select event_object_table, trigger_name, action_timing, event_manipulation
  --        from information_schema.triggers where trigger_name like 'trg_fi_%'
  --        order by 1,2;
  --
  -- FUNCTIONAL ACCEPTANCE (per role, on staging or with a real internal test
  -- account created through the normal UI — never fake DB data):
  --   - facility_admin/hospital: sees ONLY own-facility staff in Foundations/
  --     Instruments; can assign; can confirm G3; assignment then shows
  --     assignment_type/trigger_event populated and facility_id set.
  --   - staff_member: sees own assignments; submits G1/G2 -> persists; CANNOT
  --     make a g3 change stick (server preserves stored g3).
  --   - facility leader: CANNOT make a g1/g2 change stick (server preserves).
  --   - Completing the final gate as STAFF now flips the assignment row to
  --     'completed' (was silently broken before). Un-confirming a G3 item on a
  --     completed module reverts g3.status -> 'open', complete -> false, and the
  --     assignment back to 'assigned'.
  --   - master_admin (or SIPS email): reads/writes everything.
  --   - staff_admin with empty assigned_facility_ids: reads everything;
  --     with non-empty: only those facilities.
  -- ============================================================================
