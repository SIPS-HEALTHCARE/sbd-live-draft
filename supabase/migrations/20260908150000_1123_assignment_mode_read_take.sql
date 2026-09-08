-- ============================================================================
-- #1123 — Read versus Take per module for Foundations and Instruments
-- (Shawn board 137; no ledger T number)
--
-- Today every Foundations / Instruments module is a 3-gate test (10-question
-- Knowledge + Simulation draws, 3 passes each, leader-confirmed Observation).
-- Board 137 asks for a per-assignment switch: a leader assigns a module as
-- "read" (the staffer reads it and confirms) or as "take" (today's behaviour).
--
-- 1. `mode` on both assignment rows: 'take' (default) | 'read'. Nothing else
--    on the row changes; RLS on both tables is untouched.
-- 2. sbd_fi_progress_guard learns the mode. For a 'read' assignment the
--    simulation and observation gates are not gates, so the server pins them
--    to a not-applicable pass exactly the way #720 pins g2 for en-%. The
--    reading confirmation travels on g1 (owner-writable), so `complete`
--    falls out of the unchanged three-gate rule as "g1 pass".
-- 3. The guard now mirrors `complete` onto assignment.status. The client has
--    always PATCHed that value, but RLS lets only leaders write the
--    assignment row, so a completion earned by the staffer never reached it.
--    Read mode is completed by the staffer, so without this the module could
--    never show as complete. The guard is SECURITY DEFINER; it writes the
--    status row with the same value the client sends. RLS is not changed.
--
-- APPLIED BY: the USER via `supabase db query --linked -f <this file>` (CLI is
-- the only prod SQL path; the dashboard editor rolls back manual-COMMIT scripts).
-- ORDER: BEFORE the frontend deploy. foundations.js / instruments.js v=24 / v=16
-- send `mode` on every assignment INSERT; against the old schema PostgREST
-- rejects the unknown column and the assignment is not saved.
--
-- ROLLBACK: re-create sbd_fi_progress_guard from the baseline
--           (20260903120000, lines 2190-2259), then
--           alter table public.foundations_assignments drop column mode;
--           alter table public.instrument_assignments  drop column mode;
-- VERIFY:   supabase/verify/1123_assignment_mode_check.sql
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. mode on the assignment rows
-- ----------------------------------------------------------------------------
alter table public.foundations_assignments
  add column if not exists mode text not null default 'take';
alter table public.foundations_assignments
  drop constraint if exists foundations_assignments_mode_check;
alter table public.foundations_assignments
  add constraint foundations_assignments_mode_check check (mode in ('read','take'));

alter table public.instrument_assignments
  add column if not exists mode text not null default 'take';
alter table public.instrument_assignments
  drop constraint if exists instrument_assignments_mode_check;
alter table public.instrument_assignments
  add constraint instrument_assignments_mode_check check (mode in ('read','take'));

comment on column public.foundations_assignments.mode is
  '#1123 board 137: take = 3-gate test (default); read = staffer confirms reading, no gates.';
comment on column public.instrument_assignments.mode is
  '#1123 board 137: take = 3-gate test (default); read = staffer confirms reading, no gates.';

-- ----------------------------------------------------------------------------
-- 2 + 3. the guard: baseline body plus the two #1123 blocks (marked)
-- ----------------------------------------------------------------------------
create or replace function public.sbd_fi_progress_guard() returns trigger
    language plpgsql security definer
    set search_path to 'public'
    as $$
declare
  actor     uuid := auth.uid();
  is_leader boolean := false;
  is_owner  boolean := false;
  v_mode    text;
  v_status  text;
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

  -- #720: endoscopy (en-%) has no simulation gate — no scenario bank exists for
  -- it. g2 is not a gate here, so the server owns it rather than asking the
  -- client to seed a value the actor checks above would then discard. Placed
  -- AFTER those checks on purpose: it must win on the leader INSERT (which
  -- resets g2 to open) and on the leader UPDATE (which pins g2 to old), which
  -- between them are every write an assign-by-name-only module ever gets.
  -- Completion then falls out of the unchanged three-gate rule below as g1 && g3.
  if new.module_id like 'en-%' then
    new.g2 := '{"status":"pass","score":100,"attempts":[],"na":true}'::jsonb;
  end if;

  -- #1123: a module assigned as 'read' has no simulation and no observation.
  -- Same placement and same reasoning as the en-% block above: the server owns
  -- g2/g3 for it. The reading confirmation is the staffer's own g1 write
  -- (owner-writable through the D4 checks), so `complete` below reduces to
  -- "g1 pass". Progress and assignment tables pair by trigger table.
  if tg_table_name = 'foundations_progress' then
    select a.mode into v_mode from public.foundations_assignments a
     where a.staff_id = new.staff_id and a.module_id = new.module_id;
  elsif tg_table_name = 'instrument_progress' then
    select a.mode into v_mode from public.instrument_assignments a
     where a.staff_id = new.staff_id and a.module_id = new.module_id;
  end if;
  if v_mode = 'read' then
    new.g2 := '{"status":"pass","score":100,"attempts":[],"na":true}'::jsonb;
    new.g3 := '{"status":"pass","score":100,"items":[],"na":true}'::jsonb;
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

  -- #1123: assignment.status mirrors `complete` ('completed' | 'assigned').
  -- The client PATCHes the same value, but the assignment UPDATE policy admits
  -- leaders only, so a completion the staffer earns (a read-mode confirmation)
  -- never reached the row. Definer context; the policy itself is unchanged.
  -- No-op unless the value differs, so ordinary quiz writes touch nothing.
  v_status := case when new.complete then 'completed' else 'assigned' end;
  if tg_table_name = 'foundations_progress' then
    update public.foundations_assignments
       set status = v_status, updated_at = now()
     where staff_id = new.staff_id and module_id = new.module_id and status <> v_status;
  elsif tg_table_name = 'instrument_progress' then
    update public.instrument_assignments
       set status = v_status, updated_at = now()
     where staff_id = new.staff_id and module_id = new.module_id and status <> v_status;
  end if;

  return new;
end $$;

alter function public.sbd_fi_progress_guard() owner to postgres;
revoke all on function public.sbd_fi_progress_guard() from public;
grant all on function public.sbd_fi_progress_guard() to service_role;

commit;
