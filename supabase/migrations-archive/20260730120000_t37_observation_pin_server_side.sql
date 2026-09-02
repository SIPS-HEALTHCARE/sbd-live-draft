-- 20260730120000_t37_observation_pin_server_side.sql
-- T37 (S12): the observation two-PIN handshake was compared client-side against
-- DB.staff, AND the observer's plaintext PIN was shipped to every role that can
-- read a staff row (staff?select=*) -- a facility leader could read every
-- observer PIN at their facility from the network tab. Verification itself
-- moves to a new edge function (sbd-observation-unlock); this migration closes
-- the payload leak at the source.

-- 1. Stop shipping observation_pin over the REST API. A column-privilege revoke
-- (rather than rewriting the staff select list in every frontend query) survives
-- future `alter table staff add column ...` calls without needing an explicit
-- column list kept in sync in the frontend -- PostgREST drops a column from
-- select=* (and from PATCH's return=representation) for a role lacking SELECT on
-- it, it does not error. service_role (used by all edge functions, RLS-bypassing)
-- is unaffected and keeps full access for the unlock check below.
revoke select (observation_pin) on public.staff from authenticated, anon;
grant select (observation_pin) on public.staff to service_role;

-- 2. The master-admin PIN management UI (generateObserverPin, ui-views.js) still
-- needs to read the value back for its "already has one, reuse it, don't
-- silently overwrite" guard. SECURITY DEFINER RPC, same pattern as
-- sbd_set_user_capabilities -- runs with the function owner's privileges, so it
-- can read the now-hidden column, gated by an explicit master-admin check.
create or replace function public.sbd_get_observer_pin(p_staff_id uuid)
returns text language plpgsql security definer set search_path to 'public' as $function$
declare
  v_pin text;
begin
  if not public.sbd_is_master_admin() then
    raise exception 'Only a master admin can view observer PINs';
  end if;
  select observation_pin into v_pin from public.staff where id = p_staff_id;
  return v_pin;
end;
$function$;

revoke all on function public.sbd_get_observer_pin(uuid) from public, anon;
grant execute on function public.sbd_get_observer_pin(uuid) to authenticated;

-- 3. The failed-attempt lockout for the new two-PIN unlock check reuses
-- sbd_assessment_pin_attempts (assessment_type='observation', staff_id = the
-- observation's candidate) -- same table #60 already built for
-- sbd-assessor-pin, no schema change needed, it's already generic on
-- staff_id + assessment_type + outcome.
