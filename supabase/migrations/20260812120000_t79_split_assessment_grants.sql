-- T79 — split "approve an assessment" from "generate a PIN", and make a SIPS admin role
-- that starts empty.
--
-- Asked 2026-07-30 in two messages five minutes apart:
--   7:36 PM "We can add pin gen to role management so we can allow approved admin to gen pin…
--            I guess we should create a sips admin role that is a blank role until we update
--            it in role management"
--   7:41 PM "Can we break apart permission to approve assements… we want them to be sips admin
--            and be able to proctor the assessments… so generation"
--
-- Design note: docs/decisions/2026-08-12-t79-sips-admin-role-and-split-assessment-grants.md
--
-- WHY THE SPLIT DOES NOT EXIST TODAY. The bundle is a ROLE bundle, not a capability bundle.
-- Neither write path reads capabilities at all:
--     generate a PIN          sbd-assessor-pin/index.ts:22  ASSESSOR_ROLES list
--     approve a request       aq_update below                role list OR sbd_is_assessor(fid)
--     record an outcome       sbd-record-assessment/index.ts:37  role list + facility_admin
-- So the existing capabilities.assessor grant in Role Management does NOT grant PIN generation
-- (it only widens RLS reach), and any holder of one of those roles gets all three at once.
--
-- WHAT THIS MIGRATION CHANGES AT RUNTIME, stated rather than assumed:
--
--   Nobody's reach moves on the day it applies. The two new grants are keys that no row carries
--   yet, so both helpers return false for every account in the database, and the two re-created
--   policies gain an OR branch that is false for everyone. Reach moves only when a master admin
--   picks a person in Role Management and turns a grant on.
--
--   master_admin, admin, staff_admin, system_admin   unchanged, they match the role branch before
--     the new branch is ever evaluated.
--   hospital, facility_admin                         unchanged, own-facility branch copied verbatim.
--   the requesting staff member                      unchanged, staff_id = auth.uid() on select.
--   a capability assessor                            unchanged, sbd_is_assessor(facility_id)
--     branch copied verbatim from 20260730070000.
--
--   The new role string 'sips_admin' is deliberately absent from every branch here and from every
--   other policy in this repo. That absence — not a hidden button — is what makes a fresh SIPS
--   admin account reach nothing until Role Management grants it something.
--
-- SCOPE OF THE SPLIT (decided 2026-08-12, additive-only). The role allow-lists are kept as an OR
-- branch, so staff_admin/educator/preceptor keep both permissions bundled. Narrowing those lists
-- needs a per-account backfill and is sequenced as its own task — the 2026-07-30 staff-list
-- outage came from exactly that shape of change applied without one.
--
-- ROLLBACK: re-create aq_select/aq_update from 20260730070000 verbatim, then
--   drop function if exists public.sbd_can_issue_pin(uuid);
--   drop function if exists public.sbd_can_approve_assessment(uuid);
-- Capability keys need no rollback: nothing else reads them.

-- ────────────────────────────────────────────────────────────────────────────────
-- 1. The two grants.
--
-- Shape, argument type, STABLE/SECURITY DEFINER posture and ACL are copied from
-- sbd_is_assessor(uuid) (20260730060000). An absent or empty facility list means system wide,
-- the same semantic that function carries and the same thing the Role Management UI already
-- tells the admin ("None chosen, so it currently applies everywhere"). A null p_fid yields
-- false on a scoped grant, so a caller that cannot supply a facility is denied, not leaked.
--
-- No master-admin bypass, matching sbd_is_assessor(uuid): every calling policy already ORs in
-- its own master check, so a bypass here would widen reach rather than mirror it.
-- ────────────────────────────────────────────────────────────────────────────────

create or replace function public.sbd_can_issue_pin(p_fid uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists(
    select 1 from sbd_portal_users p
    where p.auth_uid = auth.uid()
      and coalesce((p.capabilities->>'issue_pin')::boolean, false)
      and (
        not (p.capabilities ? 'issue_pin_facilities')
        or jsonb_typeof(p.capabilities->'issue_pin_facilities') is distinct from 'array'
        or jsonb_array_length(p.capabilities->'issue_pin_facilities') = 0
        or p_fid::text in (
             select jsonb_array_elements_text(p.capabilities->'issue_pin_facilities'))
      ));
$function$;

comment on function public.sbd_can_issue_pin(uuid) is
  'T79: may the caller generate an assessment authorization PIN (proctor) at p_fid. Granted by '
  'capabilities.issue_pin; capabilities.issue_pin_facilities narrows it, and an absent or empty '
  'list means system wide. Independent of sbd_can_approve_assessment by design.';

create or replace function public.sbd_can_approve_assessment(p_fid uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists(
    select 1 from sbd_portal_users p
    where p.auth_uid = auth.uid()
      and coalesce((p.capabilities->>'approve_assessment')::boolean, false)
      and (
        not (p.capabilities ? 'approve_assessment_facilities')
        or jsonb_typeof(p.capabilities->'approve_assessment_facilities') is distinct from 'array'
        or jsonb_array_length(p.capabilities->'approve_assessment_facilities') = 0
        or p_fid::text in (
             select jsonb_array_elements_text(p.capabilities->'approve_assessment_facilities'))
      ));
$function$;

comment on function public.sbd_can_approve_assessment(uuid) is
  'T79: may the caller approve or deny an assessment request, and record its outcome, at p_fid. '
  'Granted by capabilities.approve_assessment; capabilities.approve_assessment_facilities '
  'narrows it, and an absent or empty list means system wide. Independent of sbd_can_issue_pin.';

revoke all on function public.sbd_can_issue_pin(uuid) from public;
revoke all on function public.sbd_can_issue_pin(uuid) from anon;
grant execute on function public.sbd_can_issue_pin(uuid) to authenticated;
grant execute on function public.sbd_can_issue_pin(uuid) to service_role;

revoke all on function public.sbd_can_approve_assessment(uuid) from public;
revoke all on function public.sbd_can_approve_assessment(uuid) from anon;
grant execute on function public.sbd_can_approve_assessment(uuid) to authenticated;
grant execute on function public.sbd_can_approve_assessment(uuid) to service_role;

-- ────────────────────────────────────────────────────────────────────────────────
-- 2. Teach the assessment queue about the approve grant.
--
-- Both policies are copied from 20260730070000 with ONE branch appended. Re-creating a policy
-- means re-typing every branch, and dropping one silently removes reach for a live role, so the
-- pre-existing branches below are byte-identical to that file — diff them if in doubt.
--
-- SELECT needs the branch too. Without it a grantee holds approve rights over rows they cannot
-- see, which reads to the user as the feature not working.
-- ────────────────────────────────────────────────────────────────────────────────

drop policy if exists aq_select on public.sbd_assessment_queue;
create policy aq_select on public.sbd_assessment_queue
for select
using (
  sbd_get_user_role() = any (array['master_admin','admin','staff_admin','system_admin'])
  or sbd_is_assessor(facility_id)
  or staff_id = auth.uid()
  or (
    sbd_get_user_role() = any (array['hospital','facility_admin'])
    and facility_id is not null
    and facility_id::text = sbd_get_user_facility()
  )
  -- T79: the approve grant, held independently of any role and of the PIN grant.
  or sbd_can_approve_assessment(facility_id)
);

drop policy if exists aq_update on public.sbd_assessment_queue;
create policy aq_update on public.sbd_assessment_queue
for update
using (
  sbd_get_user_role() = any (array['master_admin','admin','staff_admin','system_admin'])
  or sbd_is_assessor(facility_id)
  -- T79: the approve grant. Note it is NOT paired with sbd_can_issue_pin — holding the PIN
  -- grant alone must never let someone approve, which is the whole point of the split.
  or sbd_can_approve_assessment(facility_id)
);

-- ────────────────────────────────────────────────────────────────────────────────
-- 3. The read a grant needs to be usable at all.
--
-- Without this the feature is half-shipped, in the exact way 20260730170000 documents: a grant
-- authorises the write while the caller cannot read the rows it applies to, and RLS fails SILENTLY
-- by returning fewer rows. A sips_admin holding only issue_pin would call generate_pin
-- successfully and still see an empty candidate list, because a PIN grant is not
-- capabilities.assessor and so sbd_is_assessor(fid) is false for them.
--
-- The alternative — telling the admin to also grant Assessor rights so PIN generation works —
-- re-bundles the permissions through the back door and defeats the point of T79.
--
-- Both grants are ORed here because both surfaces need the staff name and belt: the PIN
-- authorisation blocks and the queue rows. This widens READS only; the two write gates above and
-- in the edge functions stay separate, so a PIN holder still cannot approve anything.
--
-- Every existing branch is copied verbatim from 20260730170000 — note this policy uses the
-- unprefixed get_user_role() / get_user_fid(), not the sbd_-prefixed pair the queue policies use.
-- ────────────────────────────────────────────────────────────────────────────────

drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff
for select
using (
  id = auth.uid()
  or get_user_role() = any (array['master_admin','staff_admin','system_admin'])
  or (
    get_user_role() = any (array['facility_admin','hospital','staff_member'])
    and fid = get_user_fid()
  )
  or sbd_is_assessor(fid)
  -- T79: read access for either grant, scoped to the facilities that grant names.
  or sbd_can_issue_pin(fid)
  or sbd_can_approve_assessment(fid)
);
