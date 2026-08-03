-- T65: the Dangerous provision, stored on the person rather than recomputed inside a PDF.
--
-- The client's ruling on 2026-07-28: "It can issue the suggested belt but have Dangerous
-- provision on the account". Clearing is SIPS admins only for now, and the record must show
-- who cleared it and when. A role-management toggle for who may clear is queued separately
-- and is not in this change.
--
-- Why a column and not just the report: today the dangerous flag exists only inside the
-- assessment report, worked out afresh every time the report is opened, and nothing is
-- written to the person's record. So there was nowhere for a provision to live. The belt
-- test path already persists its result and never recomputes on read, which is what spec
-- section 12 requires; the placement path never adopted that, and this is the first piece
-- of putting it right.
--
-- Shape, one entry per flagged answer:
--   [{ qid, label, answer, flagged_at, source_review_id, cleared_by, cleared_by_name,
--      cleared_at }]
-- Cleared entries are kept rather than removed. The record of who cleared it is the point.

alter table public.staff
  add column if not exists dangerous_provisions jsonb;

comment on column public.staff.dangerous_provisions is
  'T65: patient-safety provisions raised when a candidate picks an answer flagged as dangerous. Belt issuance is unaffected; the provision sits on the account until a SIPS admin clears it, and cleared entries are kept so who cleared it and when stays on the record.';

-- The T24 guard stops a staff member editing their own belt, stars, gates and so on. A new
-- column is not covered by it, so without this a candidate could clear their own safety
-- provision by writing the column directly, which is the same hole T24 closed a day ago.
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
  'T24, extended by T65: refuses a staff_member changing their own belt, stars, since, history, progress gates, overrides, role, facility, observer flag, observation PIN or dangerous provisions. Position School writes that carry stars unchanged still pass, as do all administrator, assessor and service-role writes.';

-- The two profile year fields were relabelled on 2026-07-28. The client pointed out that
-- everyone joining is new to SBD, so years in the SBD programme is always zero and tells
-- nobody anything; what matters is the sterile processing career behind them. The columns
-- keep their names because renaming a live column the production frontend reads is a
-- breaking contract change for no visible gain.
comment on column public.staff.sbd_program_years is
  'Years the person has worked in sterile processing. Labelled "Years in SPD" in the interface since 2026-07-28; the column name predates that correction.';

comment on column public.staff.sbd_cert_years is
  'Years the person has held their sterile processing certification. Labelled "Years certified" in the interface since 2026-07-28.';
