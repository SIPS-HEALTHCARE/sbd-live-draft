-- 20260804120000_t37_observer_pins_table.sql
-- T37 (S12), part 2 — move the observer PIN out of public.staff into its own table.
--
-- Part 1 (20260730120000) tried to hide the column with a column-level SELECT revoke.
-- That approach cannot work here, and both halves of why were confirmed against prod:
--
--   * The revoke is inert. A column-level revoke does not subtract from a table-level
--     grant, and `authenticated` holds table-level SELECT on staff. The 2026-08-03
--     precheck read has_column_privilege('authenticated','public.staff',
--     'observation_pin','select') = true with part 1 already merged.
--   * Making it bite breaks the app. Revoking the table grant and re-granting an explicit
--     column list makes `staff?select=*` (api-supabase.js:188-189) fail outright with
--     "permission denied for table staff", because SELECT * expands to every column
--     before the privilege check — PostgREST does not quietly drop the column. That is
--     the 2026-07-30 staff-list outage. Every staff PATCH would need an explicit select
--     list too, because sbFetch defaults to Prefer: return=representation
--     (api-supabase.js:26), and every future `alter table staff add column` would need a
--     matching re-grant or the new column silently disappears from the frontend.
--
-- A secret living in a column of a table that every signed-in role reads is the wrong
-- shape. It moves to its own table with RLS on and NO policies, so only the service role
-- (the edge functions) can read it, and staff?select=* stays legal and untouched.
--
-- This is the reversible half. It creates and fills the new table and repoints the reads
-- at it, but LEAVES staff.observation_pin in place, so there is no deploy ordering in
-- which the app is broken. 20260804130000 drops the column once this is verified live.
-- Read that file before applying this one; they are one change in two steps.

begin;

-- ── 0. Precondition ─────────────────────────────────────────────────────────────────
-- This file is safe to run twice, but NOT after 20260804130000. Everything below assumes
-- staff.observation_pin exists: the backfill reads it, and the guard function it installs
-- references it. If the column is already dropped, the backfill's parse error is what
-- happens to abort the transaction first — which would be luck, not a guarantee, so the
-- refusal is made explicit here instead.
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'staff'
                    and column_name = 'observation_pin') then
    raise exception
      'staff.observation_pin is already dropped, so 20260804130000 (part 2) has run. Do not re-run part 1 after part 2 — it would reinstall a privilege guard that reads a column which no longer exists, and every staff write would fail. Nothing to do here.';
  end if;
end $$;

-- ── 1. The private table ────────────────────────────────────────────────────────────
-- One row per observer who has a PIN. The row's existence is the fact "has a PIN"; the
-- pin column is the secret. Shape follows sbd_assessment_pin_attempts (#60).
create table if not exists public.sbd_observer_pins (
    staff_id   uuid primary key references public.staff(id) on delete cascade,
    pin        text        not null,
    created_at timestamptz not null default now(),
    created_by uuid -- sbd_portal_users.id of the master admin who minted it; null for the backfill
);

comment on table public.sbd_observer_pins is
  'T37: reusable observation PINs, moved off public.staff so a secret is not carried by a table every signed-in role can read. RLS is on with no policies, so only the service role reaches it — sbd-observer-pin (master-admin read/generate) and sbd-observation-unlock (verify). Never expose this table to authenticated.';

-- ── 2. Lock it ──────────────────────────────────────────────────────────────────────
-- RLS with zero policies already denies every client. The explicit revoke is the second
-- lock: Supabase's default privileges grant new public-schema tables to anon and
-- authenticated, so without it the table is one accidental `disable row level security`
-- away from being world-readable.
alter table public.sbd_observer_pins enable row level security;
revoke all on public.sbd_observer_pins from anon, authenticated;
grant all on public.sbd_observer_pins to service_role;

-- ── 3. Backfill from the column ─────────────────────────────────────────────────────
insert into public.sbd_observer_pins (staff_id, pin)
select id, observation_pin
  from public.staff
 where observation_pin is not null
   and btrim(observation_pin) <> ''
on conflict (staff_id) do nothing;

-- ── 3b. PINs must be unique, or the unlock lookup is ambiguous ──────────────────────
-- sbd-observation-unlock resolves the observer BY PIN. Two observers sharing a PIN means
-- neither can unlock (the lookup matches two rows) and, worse, it makes "which observer
-- is this" undecidable — the exact identity question T37 exists to answer. The old
-- client-side generator picked a 4-digit PIN at random with no uniqueness check, so a
-- collision is possible in existing data; if there is one, this refuses to proceed rather
-- than lose a PIN to the constraint. Clear it by regenerating one of the two PINs, then
-- re-run this migration.
do $$
declare
  v_dupes text;
begin
  select string_agg(pin, ', ') into v_dupes
    from (select pin from public.sbd_observer_pins group by pin having count(*) > 1) d;
  if v_dupes is not null then
    raise exception
      'Duplicate observer PIN(s) in existing data: %. Regenerate one of each pair (staff.observation_pin) so every observer PIN is unique, then re-run this migration.', v_dupes;
  end if;
end $$;

create unique index if not exists sbd_observer_pins_pin_key
  on public.sbd_observer_pins (pin);

-- ── 4. The non-secret half, which the interface actually needs ───────────────────────
-- Two places render "does this observer have a PIN yet" without needing its value: the
-- observer roster pill (ui-views.js:3268) and the profile access row
-- (ui-views.js:10494). Both read it off the staff payload today. A boolean is not a
-- secret, so it stays on staff and keeps shipping in select=* — that is what lets this
-- change cost the frontend two field renames instead of a new fetch path.
alter table public.staff
  add column if not exists observer_pin_set boolean not null default false;

comment on column public.staff.observer_pin_set is
  'T37: true when this staff member has a row in sbd_observer_pins. The PIN value itself is never sent to a browser; this flag is what the roster pill and profile button read.';

update public.staff s
   set observer_pin_set = true
 where exists (select 1 from public.sbd_observer_pins p where p.staff_id = s.id)
   and observer_pin_set is not true;

-- ── 5. Extend the T24/T65 privilege guard to the new column ─────────────────────────
-- Body is 20260727215057_dangerous_provisions_t65's, plus observer_pin_set. A candidate
-- must not be able to flip their own "has a PIN" flag any more than the PIN itself.
-- observation_pin STAYS in this list: the column still exists until 20260804130000, and
-- dropping it from the guard early would leave a window where a staff_member could write
-- it directly. 20260804130000 removes it in the same transaction as the column.
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
    or new.observation_pin          is distinct from old.observation_pin
    -- T37: the "has a PIN" flag, maintained by the mirror trigger below and by
    -- sbd-observer-pin. Not a secret, but not the candidate's to set either.
    or new.observer_pin_set         is distinct from old.observer_pin_set
    -- T65: a candidate must not be able to clear their own safety provision.
    or new.dangerous_provisions     is distinct from old.dangerous_provisions;

  if not privileged_change then
    return new;
  end if;

  jwt_role := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role';

  -- No JWT context is a migration or psql; 'service_role' is how the edge functions,
  -- including sbd-record-assessment, reach the database.
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
  'T24, extended by T65 and T37: refuses a staff_member changing their own belt, stars, since, history, progress gates, overrides, role, facility, observer flag, observation PIN, observer-PIN flag or dangerous provisions. Position School writes that carry stars unchanged still pass, as do all administrator, assessor and service-role writes.';

-- ── 6. Temporary write mirror, deleted by 20260804130000 ────────────────────────────
-- Between this migration and the frontend deploy, the live generateObserverPin still
-- writes staff.observation_pin (ui-views.js:14042) while sbd-observation-unlock already
-- reads sbd_observer_pins. A PIN generated in that window would verify against nothing.
-- This keeps the two in step so the release order cannot produce a dead PIN, and it also
-- catches any staff-write path nobody has audited. SECURITY DEFINER because the caller is
-- `authenticated`, which by design holds no privileges on sbd_observer_pins at all.
create or replace function public.sbd_mirror_observation_pin()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.observation_pin is distinct from old.observation_pin then
    if new.observation_pin is null or btrim(new.observation_pin) = '' then
      delete from public.sbd_observer_pins where staff_id = new.id;
      new.observer_pin_set := false;
    else
      insert into public.sbd_observer_pins (staff_id, pin)
      values (new.id, new.observation_pin)
      on conflict (staff_id) do update
        set pin = excluded.pin, created_at = now();
      new.observer_pin_set := true;
    end if;
  end if;
  return new;
end $$;

comment on function public.sbd_mirror_observation_pin() is
  'T37, temporary: copies a staff.observation_pin write into sbd_observer_pins so the migration and the frontend deploy cannot fall out of step. Dropped with the column by 20260804130000.';

drop trigger if exists sbd_staff_observation_pin_mirror on public.staff;

create trigger sbd_staff_observation_pin_mirror
before update on public.staff
for each row
execute function public.sbd_mirror_observation_pin();

-- ── 7. Repoint the master-admin read-back at the new table ──────────────────────────
-- Same gate as 20260730120000, new source. Kept alive here (rather than dropped in
-- favour of the sbd-observer-pin edge function straight away) so the currently deployed
-- frontend keeps working between this migration and the frontend release.
-- 20260804130000 drops it.
create or replace function public.sbd_get_observer_pin(p_staff_id uuid)
returns text language plpgsql security definer set search_path to 'public' as $function$
declare
  v_pin text;
begin
  if not public.sbd_is_master_admin() then
    raise exception 'Only a master admin can view observer PINs';
  end if;
  select pin into v_pin from public.sbd_observer_pins where staff_id = p_staff_id;
  return v_pin;
end;
$function$;

revoke all on function public.sbd_get_observer_pin(uuid) from public, anon;
grant execute on function public.sbd_get_observer_pin(uuid) to authenticated;

commit;

-- Verification: supabase/verify/t37_observer_pins_check.sql (run it after applying).
-- Rollback:
--   begin;
--   drop trigger if exists sbd_staff_observation_pin_mirror on public.staff;
--   drop function if exists public.sbd_mirror_observation_pin();
--   drop table if exists public.sbd_observer_pins;
--   alter table public.staff drop column if exists observer_pin_set;
--   -- then re-run 20260727215057_dangerous_provisions_t65.sql's function block and
--   -- 20260730120000's sbd_get_observer_pin block to restore the previous definitions.
--   commit;
