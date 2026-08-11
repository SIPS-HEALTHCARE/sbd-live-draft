-- T74 step 1 of N: add a facility-aware overload beside the existing assessor gate.
--
-- The client asked on 2026-07-30 (1:33 AM text, settled by the 03:37 voice note) that a
-- granted role apply only at chosen facilities: "we grant that role and then we [select] the
-- facilities that they are able to apply that role towards."
--
-- WHAT THIS MIGRATION CHANGES AT RUNTIME: nothing. It only ADDS a function. No policy is
-- touched, no column is added, no row is written. sbd_is_assessor() keeps its zero-arg form
-- and every one of the 14 policies calling it keeps calling exactly that. Behaviour moves
-- only when a later migration rewrites a policy to pass a facility, and each of those can
-- ship and revert one table at a time. This is the deliberate alternative to redefining the
-- zero-arg function underneath all 14 policies on one flag day.
--
-- Measured against production 2026-07-29/30, not estimated:
--
--   sbd_is_assessor() is zero-arg, STABLE SECURITY DEFINER, and reads
--   role = 'assessor' OR capabilities->>'assessor'. It is called by 14 policies on 6 tables:
--     observations 2, observation_remediations 3, ps_completion_requests 2,
--     sbd_assessment_queue 2   -- all four carry a facility column, scoped directly
--     observation_overrides 2, observation_audits 3  -- no facility column, need a join
--
--   Three accounts hold the grant today, all active:
--     Avery Henderson   staff_admin    {"assessor": true}
--     Amy Cooper        staff_member   assessor + 2 educator_facilities
--     Kirti Chaudhary   staff_member   assessor + 2 educator_facilities
--   None of the three carries an assessor facility list, because none exists yet.
--
-- THE BACKWARD-COMPATIBILITY CLAUSE IS THE POINT OF THIS FILE. T74's Done-when requires that
-- "no existing system-wide holder silently loses or gains reach during the migration". So an
-- absent or empty assessor_facilities list means system wide, which is precisely what all
-- three current holders have. A policy can therefore adopt the overload without changing the
-- answer for anyone, and reach narrows only when an admin actually picks facilities.
--
-- This deliberately differs from sbd_leads_facility_of, where a missing educator_facilities
-- key yields false on that branch. There it is safe because a role branch covers those users.
-- Here the capability IS the whole grant, so absent-means-none would revoke all three
-- accounts the instant the first policy adopted the overload.
--
-- Shape, argument type and SECURITY DEFINER posture copied from the proven per-facility
-- reference implementation sbd_leads_facility_of(uuid), which already scopes facility
-- educators server side through 16 policies on 8 tables. Facility columns on all four
-- directly-scopable tables are uuid, so the parameter is uuid.
--
-- No master/admin bypass is included, matching the zero-arg function. Every calling policy
-- already ORs this gate with its own master-admin check, so adding one here would widen
-- reach beyond the current gate rather than mirror it.

create or replace function public.sbd_is_assessor(p_fid uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists(
    select 1 from sbd_portal_users p
    where p.auth_uid = auth.uid()
      and ( p.role = 'assessor'
            or coalesce((p.capabilities->>'assessor')::boolean, false) )
      and (
        -- No list, or an empty list, means the grant is system wide. Every holder today.
        not (p.capabilities ? 'assessor_facilities')
        or jsonb_typeof(p.capabilities->'assessor_facilities') is distinct from 'array'
        or jsonb_array_length(p.capabilities->'assessor_facilities') = 0
        -- Scoped grant: the row's facility must be one of the chosen ones. A null p_fid
        -- yields false here, which denies rather than leaks when a caller cannot supply a
        -- facility.
        or p_fid::text in (
             select jsonb_array_elements_text(p.capabilities->'assessor_facilities'))
      ));
$function$;

comment on function public.sbd_is_assessor(uuid) is
  'T74: is the caller an assessor AT p_fid. An absent or empty capabilities.assessor_facilities '
  'list means system wide, preserving every pre-T74 holder. Companion to the zero-arg '
  'sbd_is_assessor(), which answers "an assessor at all" and still gates nav visibility.';

-- Mirror the ACL the zero-arg gate and sbd_leads_facility_of already carry
-- (postgres, service_role, authenticated) and keep anon and public out.
revoke all on function public.sbd_is_assessor(uuid) from public;
revoke all on function public.sbd_is_assessor(uuid) from anon;
grant execute on function public.sbd_is_assessor(uuid) to authenticated;
grant execute on function public.sbd_is_assessor(uuid) to service_role;
