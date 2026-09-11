-- ── #1228 · Close the open RLS on aip_question_responses / aip_assessment_attempts ──
--
-- Read live 2026-09-11: both tables have RLS on and both carry two PERMISSIVE
-- policies TO public — SELECT USING (true) and INSERT WITH CHECK (true) — with
-- ALL privileges granted to anon and authenticated. Anyone holding the anon key
-- can read both tables and insert rows into them. #1169 gated the sibling
-- aip_questions only; these two were missed.
--
-- What this does:
--   1. Drops the four world-open policies.
--   2. One permissive SELECT policy per table for admins, reusing the existing
--      public.sbd_is_system_admin() — it is exactly the role set the card names
--      (master_admin, staff_admin, system_admin, plus 'admin'), all 11 holders
--      carry auth_uid, and it is already executable by authenticated. No write
--      policy: no write path through these tables exists (see "write paths").
--   3. The RESTRICTIVE sbd_mfa_gate from 20260904130000 / #1169, same shape, so
--      an admin at aal1 reads nothing.
--   4. Revokes everything from anon and authenticated, then grants SELECT back.
--      The card names INSERT/UPDATE/DELETE; the grant audit also showed TRUNCATE
--      held by both roles, and TRUNCATE is not subject to RLS — any signed-in
--      user could have wiped either table whatever the policies said. Same class,
--      same two tables, so it goes in the same pass. SELECT stays granted on
--      purpose: with no permissive policy an anon request returns zero rows
--      (the card's read-back) instead of a permission error.
--
-- Write paths: all 8 prod functions that name either table are SECURITY DEFINER
-- and owned by postgres (aip_generate_quiz, aip_generate_weak_spot_quiz,
-- aip_get_candidate_analytics, aip_get_weak_areas, aip_start_proctored_session,
-- aip_submit_quiz ×3), so they are unaffected by table grants or by RLS on the
-- calling role — checked live 2026-09-11, prosecdef true for all 8. The belt
-- frontend and every edge function reference these tables zero times (grepped
-- across src/ and supabase/functions/). Live rows: 0 responses, 1 attempt.
-- Not in this card: whether anon should still be able to EXECUTE those RPCs —
-- that is a function-grant question, separate call.
--
-- Cross-property note: aip_* belongs to another SIPS property sharing this
-- project. sbd_is_system_admin() reads sbd_portal_users, a belt-platform table,
-- so no AIP user gains access here unless they are also an SBD admin.
--
-- No deploy-order constraint: nothing in the belt frontend reads these tables.
--
-- Rollback (the pre-#1228 state, verbatim):
--   drop policy if exists aip_responses_admin_read on public.aip_question_responses;
--   drop policy if exists aip_attempts_admin_read  on public.aip_assessment_attempts;
--   drop policy if exists sbd_mfa_gate on public.aip_question_responses;
--   drop policy if exists sbd_mfa_gate on public.aip_assessment_attempts;
--   create policy aip_responses_public_read   on public.aip_question_responses   for select using (true);
--   create policy aip_responses_public_insert on public.aip_question_responses   for insert with check (true);
--   create policy aip_attempts_public_read    on public.aip_assessment_attempts  for select using (true);
--   create policy aip_attempts_public_insert  on public.aip_assessment_attempts  for insert with check (true);
--   grant all on table public.aip_question_responses, public.aip_assessment_attempts to anon, authenticated;
--
-- Read-back: supabase/verify/1228_aip_rls_check.sql

-- ── 1 · drop the world-open policies ──────────────────────────────────────────
drop policy if exists aip_responses_public_read   on public.aip_question_responses;
drop policy if exists aip_responses_public_insert on public.aip_question_responses;
drop policy if exists aip_attempts_public_read    on public.aip_assessment_attempts;
drop policy if exists aip_attempts_public_insert  on public.aip_assessment_attempts;

-- ── 2 · admin SELECT, nothing else ────────────────────────────────────────────
drop policy if exists aip_responses_admin_read on public.aip_question_responses;
create policy aip_responses_admin_read on public.aip_question_responses
  for select to authenticated
  using (public.sbd_is_system_admin());

drop policy if exists aip_attempts_admin_read on public.aip_assessment_attempts;
create policy aip_attempts_admin_read on public.aip_assessment_attempts
  for select to authenticated
  using (public.sbd_is_system_admin());

-- ── 3 · the MFA gate, same shape as #1169 ─────────────────────────────────────
drop policy if exists sbd_mfa_gate on public.aip_question_responses;
create policy sbd_mfa_gate on public.aip_question_responses
  as restrictive for all to authenticated
  using (public.sbd_mfa_satisfied())
  with check (public.sbd_mfa_satisfied());

drop policy if exists sbd_mfa_gate on public.aip_assessment_attempts;
create policy sbd_mfa_gate on public.aip_assessment_attempts
  as restrictive for all to authenticated
  using (public.sbd_mfa_satisfied())
  with check (public.sbd_mfa_satisfied());

-- ── 4 · grants: read-only for anon and authenticated ──────────────────────────
revoke all on table public.aip_question_responses  from anon, authenticated;
revoke all on table public.aip_assessment_attempts from anon, authenticated;
grant select on table public.aip_question_responses  to anon, authenticated;
grant select on table public.aip_assessment_attempts to anon, authenticated;
