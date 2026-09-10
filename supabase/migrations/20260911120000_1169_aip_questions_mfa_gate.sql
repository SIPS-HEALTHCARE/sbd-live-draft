-- ── #1169 · T33 follow-up: put aip_questions behind the admin MFA gate ────────
--
-- 20260904120000 keyed the gate on the sbd_* / david_* / foundations_* /
-- instrument_* prefixes and skipped aip_* on purpose — its own comment names
-- aip_* as another SIPS property sharing this project. But the belt app reads
-- aip_questions on every placement and belt test (buildHybridQuestions,
-- src/js/ui-views.js:1689), so belt content is reachable from an admin session
-- that never completed MFA. Sriman's read-back (#1169, 2026-09-07) called it.
--
-- Same restrictive policy, same predicate, same idempotent drop/create as
-- 20260904130000. One table, so no loop.
--
-- What this does NOT do: the existing permissive `aip_questions_public_read`
-- (SELECT, TO public, USING is_active AND is_approved) is untouched. Restrictive
-- policies AND with the permissive ones, they do not replace them, and this one
-- is TO authenticated, so anon reads are unaffected.
--
-- Cross-property safety, checked against prod 2026-09-11: the predicate's
-- admin-tier test is app_metadata.role in the admin list OR a matching admin row
-- in sbd_portal_users. ZERO auth.users carry an admin role in app_metadata at
-- all, so the admin-tier set is entirely sbd_portal_users — a belt-platform
-- table. No AIP-property user is caught by this unless they are also an SBD
-- admin, which is the intent.
--
-- Blast radius if it is wrong: buildHybridQuestions wraps the read in
-- .catch(()=>null) and falls back to the fixed PLACEMENT_QUESTIONS set when it
-- gets fewer rows than it needs, so a gated admin sees the fixed sims, not a
-- broken test.
--
-- Not in this card: aip_answers, whose `aip_answers_admin_only` policy is
-- USING (false) for everyone anyway. Separate call (#1169 "Not in this card").
--
-- No deploy-order constraint: frontend and the edge functions are already live.
-- Read-back: supabase/verify/t33_mfa_gate_check.sql §4/§4b.

drop policy if exists sbd_mfa_gate on public.aip_questions;

create policy sbd_mfa_gate on public.aip_questions
  as restrictive for all to authenticated
  using (public.sbd_mfa_satisfied())
  with check (public.sbd_mfa_satisfied());
