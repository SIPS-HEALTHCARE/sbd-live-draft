-- 20260804130000_t37_drop_staff_observation_pin.sql
-- T37 (S12), part 2 of 2 — close the exposure by removing the column.
--
-- APPLY ONLY AFTER: 20260804120000 is applied, sbd-observer-pin and
-- sbd-observation-unlock are deployed, the frontend release is live, and
-- supabase/verify/t37_observer_pins_check.sql passes. Until then the column is the
-- fallback that keeps the previous frontend working. Applying this early does not corrupt
-- anything — every PIN is already in sbd_observer_pins — but it breaks the master-admin
-- PIN controls until the frontend catches up.
--
-- The one thing in this file that is not obvious:
--
--   sbd_guard_staff_privileged_columns() reads new.observation_pin / old.observation_pin.
--   plpgsql resolves record fields at RUNTIME, not at DDL time, so `alter table ... drop
--   column` succeeds silently and then EVERY update of public.staff fails with
--   `record "new" has no field "observation_pin"`. That is the entire staff-write surface
--   of the product: placements, belts, gates, Position School, provisions. The guard is
--   replaced in the same transaction as the drop for exactly that reason. Do not split
--   this file up, and do not run the drop on its own.

begin;

-- ── 1. Retire the temporary write mirror ────────────────────────────────────────────
-- Its whole job was covering the gap between 20260804120000 and the frontend deploy.
drop trigger if exists sbd_staff_observation_pin_mirror on public.staff;
drop function if exists public.sbd_mirror_observation_pin();

-- ── 2. Rebuild the privilege guard WITHOUT observation_pin ──────────────────────────
-- Identical to 20260804120000's version minus that one line. Must land in the same
-- transaction as the drop below; see the header.
create or replace function public.sbd_guard_staff_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  jwt_role text;
  privileged_change boolean;
begin
  privileged_change :=
       new.belt                     is distinct from old.belt
    or new.stars                    is distinct from old.stars
    or new.since                    is distinct from old.since
    or new.history                  is distinct from old.history
    or new.cur_comp                 is distinct from old.cur_comp
    or new.cur_sim                  is distinct from old.cur_sim
    or new.cur_obs                  is distinct from old.cur_obs
    or new.nxt_comp                 is distinct from old.nxt_comp
    or new.nxt_sim                  is distinct from old.nxt_sim
    or new.nxt_obs                  is distinct from old.nxt_obs
    or new.assessment_gate_override is distinct from old.assessment_gate_override
    or new.window_override          is distinct from old.window_override
    or new.role                     is distinct from old.role
    or new.fid                      is distinct from old.fid
    or new.observer                 is distinct from old.observer
    -- T37: staff.observation_pin is gone; the secret lives in sbd_observer_pins, which
    -- `authenticated` cannot reach at all. observer_pin_set is the flag left behind.
    or new.observer_pin_set         is distinct from old.observer_pin_set
    -- T65: a candidate must not be able to clear their own safety provision.
    or new.dangerous_provisions     is distinct from old.dangerous_provisions;

  if not privileged_change then
    return new;
  end if;

  jwt_role := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role';

  if jwt_role is null or jwt_role = 'service_role' then
    return new;
  end if;

  if public.sbd_get_user_role() = 'staff_member' then
    raise exception
      'A staff member cannot change their own belt, stars, progress gates, facility, assessment overrides or safety provisions'
      using errcode = '42501';
  end if;

  return new;
end $$;

comment on function public.sbd_guard_staff_privileged_columns() is
  'T24, extended by T65 and T37: refuses a staff_member changing their own belt, stars, since, history, progress gates, overrides, role, facility, observer flag, observer-PIN flag or dangerous provisions. Position School writes that carry stars unchanged still pass, as do all administrator, assessor and service-role writes.';

-- ── 3. Safety net: never drop the column while a PIN exists only in it ──────────────
-- The mirror trigger should make this impossible. It is asserted anyway, because the
-- failure mode it guards against is an observer's PIN silently ceasing to exist.
--
-- The early return is what makes this whole file safe to run twice: without it, a second
-- run dies on `column s.observation_pin does not exist` from this block. plpgsql only
-- plans a statement when it is first reached, so returning before the query is enough.
do $$
declare
  v_orphans integer;
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'staff'
                    and column_name = 'observation_pin') then
    raise notice 'staff.observation_pin is already gone — this migration has run before. Continuing; every remaining step is idempotent.';
    return;
  end if;

  select count(*) into v_orphans
    from public.staff s
   where s.observation_pin is not null
     and btrim(s.observation_pin) <> ''
     and not exists (
       select 1 from public.sbd_observer_pins p
        where p.staff_id = s.id and p.pin = s.observation_pin
     );
  if v_orphans > 0 then
    raise exception
      'Refusing to drop staff.observation_pin: % PIN(s) are not mirrored into sbd_observer_pins. Re-run 20260804120000''s backfill, then this migration.', v_orphans;
  end if;
end $$;

-- ── 4. Drop the column ──────────────────────────────────────────────────────────────
-- The column-level grants from 20260730120000 (revoke from authenticated/anon, grant to
-- service_role) go with it; column privileges do not outlive their column, so there is
-- nothing else to clean up.
alter table public.staff drop column if exists observation_pin;

-- ── 5. Retire the read-back RPC ─────────────────────────────────────────────────────
-- Superseded by the sbd-observer-pin edge function, which the released frontend calls.
drop function if exists public.sbd_get_observer_pin(uuid);

commit;

-- Verification: supabase/verify/t37_observer_pins_check.sql (expects part 2 applied).
-- Rollback — no PIN is lost, sbd_observer_pins holds every one of them:
--   begin;
--   alter table public.staff add column if not exists observation_pin text;
--   update public.staff s set observation_pin = p.pin
--     from public.sbd_observer_pins p where p.staff_id = s.id;
--   revoke select (observation_pin) on public.staff from authenticated, anon;
--   grant  select (observation_pin) on public.staff to service_role;
--   -- then re-run 20260804120000's guard-function, mirror-trigger and
--   -- sbd_get_observer_pin blocks to restore the part-1 state.
--   commit;
