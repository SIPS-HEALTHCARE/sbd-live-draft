-- T24 / finding S3: a staff member could set their own belt, stars and gate overrides.
--
-- `authenticated` holds UPDATE on every column of public.staff, and the staff_update policy
-- permits `staff_member AND id = auth.uid()`. So a candidate could call the data interface
-- directly against their own row and set belt, stars, assessment_gate_override or
-- window_override. get_user_role() reads sbd_portal_users rather than staff.role, so this
-- was never role escalation, but it is the integrity of the training record itself.
--
-- Why a trigger and not a column revoke, and why this one is not optional:
--
-- A column-level REVOKE applies to the `authenticated` database role, which is every
-- signed-in user including administrators. It would break every admin write listed below.
-- Worse, it would break the CANDIDATE too: the staff Position School view
-- (renderSPosSchool) has Begin Track and Mark Ready to Test buttons, and both write through
-- mapStaffPSToBackend, which includes `stars`. Revoking `stars` would stop candidates
-- starting a Position School track at all.
--
-- What saves it is that those candidate paths write `stars` with its existing value and
-- never change it. Only completePSTrack changes stars (s.stars = calcTotalPSStars(s)), and
-- that runs from the leader and admin Award Star controls. So a trigger comparing old to
-- new lets the candidate paths through untouched and stops the actual escalation.
--
-- Full write audit of public.staff, done before writing this:
--
--   Candidate writes on their own row, all must keep working:
--     submitOIP                oip
--     acknowledgePlacement     placement_acknowledged
--     saveSbdBackground        sbd_program_years, sbd_cert_years
--     savePracticeScore        practice_scores
--     paPersistSubmission      placement_needed
--     flushPendingPlacements   placement_needed
--     beginPSTrack             ps_enrolled, ps_done, ps_track, ps_mod, ps_tracks, stars
--     readyToTestPS            same set
--     recordPSPass             same set
--   None of these changes a protected column. submitOIP touches s.oip.history, which is a
--   field inside the oip JSON blob and not the staff.history column.
--
--   Administrator and assessor writes, unaffected because they are not staff_member:
--     confirmPlacement         belt, since, placement_needed, history, cur_*
--     submitBeltOverride       belt, since, history, cur_*, nxt_*
--     confirmObservation       nxt_obs
--     submitPromotion / approvePromotion / changeStaffRoleInline   role
--     toggleObserver           observer
--     generateObserverPin      observation_pin
--     confirmOpenWindow / adminCloseWindow                         window_override
--     grantAssessmentOverride / clearAssessmentOverride            assessment_gate_override
--     completePSTrack / overrideAssignPSTrack                      PS set including stars
--
--   sbd-record-assessment writes gates and belt but runs on the service role, which the
--   guard lets through explicitly.
--
-- The rule is deliberately narrow: it refuses only when the caller is acting as a
-- staff_member. Every other role already passes RLS through its own clause, so there is no
-- need to enumerate administrator roles here and no way for this to catch one by accident.

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
    or new.observation_pin          is distinct from old.observation_pin;

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
      'A staff member cannot change their own belt, stars, progress gates, facility or assessment overrides'
      using errcode = '42501';
  end if;

  return new;
end $$;

drop trigger if exists sbd_staff_privilege_guard on public.staff;

create trigger sbd_staff_privilege_guard
before update on public.staff
for each row
execute function public.sbd_guard_staff_privileged_columns();

comment on function public.sbd_guard_staff_privileged_columns() is
  'T24: refuses a staff_member changing their own belt, stars, since, history, progress gates, overrides, role, facility, observer flag or observation PIN. Position School writes that carry stars unchanged still pass, as do all administrator, assessor and service-role writes.';
