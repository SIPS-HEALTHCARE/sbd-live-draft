# T33 (issue S13) — Admin MFA, data retention policy, per-role interface gate

**Date:** 2026-08-12 · **Status:** implemented, pending user deploy · **Rebased 2026-09-04** onto main (post #721 baseline) as `work/623-security-tail`, issue #623; migration renamed 20260812130000 → 20260904120000 so it sorts after the 20260903120000 baseline. TOTP enroll+verify confirmed ON in the prod auth config 2026-09-04. · **Task:** TASKS.md T33 (committed for Wed 29 July, oldest slip)

## Problem

The compliance one-pager cannot be signed off: no multi-factor auth exists anywhere
(zero MFA/TOTP/AAL references in the codebase), no data retention policy document
exists, and per-role restrictions on the data interface (the Supabase REST API +
DAVID) are enforced by RLS scope but nothing distinguishes a password-only admin
session from a strongly-authenticated one. *Done when:* MFA is enforced on admin
sign-in; the retention policy is written and stored in the repo; per-role interface
restrictions are applied and read back on a real session.

## Options

1. **Client-only MFA** — challenge in `doLogin()`, no server change. Rejected: B3
   (client gating is decoration; any curl holder with a password-grant token keeps
   full admin reach).
2. **Rewrite every RLS policy to require `aal2` for admin branches** — correct but
   touches ~85 migrations' worth of policies; unreviewable blast radius.
3. **One restrictive policy per table + one SQL predicate + client flow + edge-fn
   guard** — a single `sbd_mfa_satisfied()` predicate, applied as a `RESTRICTIVE`
   policy (ANDs with every existing permissive policy, so no existing policy is
   edited), a TOTP enroll/challenge flow at the single login choke point, and the
   same predicate inlined in every role-gated edge function. **Chosen.**

## Choice + why

Supabase issues JWTs with an `aal` claim: `aal1` = password only, `aal2` = password
+ verified TOTP factor. The whole data interface is PostgREST-with-RLS, so one
restrictive policy (`sbd_mfa_gate`) per belt-platform table enforces "admin-tier
role ⇒ aal2 required" at the database, per role, regardless of which permissive
policy grants the reach — including the dashboard-created helpers T34 hasn't
reviewed yet. Non-admin roles are untouched (the predicate returns true for them),
`service_role` bypasses RLS as before, and `anon` is out of scope (policies are
`TO authenticated`). Edge functions act with the service role, so they get the same
predicate inlined (the deploy pipeline cannot resolve `../_shared` imports — #47
precedent; `scripts/verify-t33-security-tail.js` asserts the copies agree).

**Admin tier** (the one list, four copies asserted identical by the harness):
`master_admin, staff_admin, admin, master, sips_admin, system_admin`.
Facility-side leaders (`hospital`, `facility_admin`) and `staff_member` are not in
scope — the client ask was "admin accounts". The SIPS email allowlist branch that
`sbd_is_admin()` trusts is also treated as admin tier, so it cannot bypass MFA.

**Login flow:** `doLogin()` (the single door — the form and session restore both
funnel through it) fetches the caller's own profile at aal1 (an own-row exception
on `sbd_portal_users` SELECT permits exactly this and nothing else), and if the
role is admin-tier runs `MFA.ensureAal2()` before any data hydration: verified
TOTP factor → 6-digit challenge; no factor → forced enrollment (QR + confirm).
Cancel → signed out. The session returned by factor verification replaces the aal1
session in `localStorage['sbd_session']`.

## Blast radius

- `src/js/mfa.js` (new), `src/js/ui-views.js` (doLogin hook), `index.html` (script
  tag + cache-bust).
- Migration `20260904120000_t33_admin_mfa_aal2_gate.sql`: new fn
  `sbd_mfa_satisfied()`, `sbd_is_admin()` gains the aal2 gate, restrictive
  `sbd_mfa_gate` policies on all RLS-enabled `sbd_*`/`david_*`/belt-platform
  tables (other SIPS properties' tables — `bb_*`, `aip_*`, etc. — untouched).
- 15 edge functions gain the inline guard (every role-gated function with
  privileged actions; service/cron/candidate-flow functions — sbd-log-activity,
  sbd-generate-belt-test, sbd-score-assessment, the email/reminder/anomaly
  functions — are deliberately excluded):
  david-admin-api, david-chat, sbd-sync-user-claims, sbd-set-account-active,
  sbd-approve-registration, sbd-assign-free-agent, sbd-release-to-free-agent,
  bulk-upload-staff, sbd-admin-sessions, sbd-observer-pin,
  sbd-force-submit-placement, sbd-reset-test-assessment, sbd-record-assessment,
  sbd-assessor-pin, sbd-observation-unlock.
- `docs/DATA_RETENTION_POLICY.md` (new), verify artifacts, ARCHITECTURE.md.

**What could break:** an admin on the OLD frontend after the migration applies
gets an aal1 session and sees empty screens — hence the deploy order below. An
admin who loses their authenticator is locked out; break-glass is deleting their
row in `auth.mfa_factors` via the Supabase dashboard (documented in the retention
policy's access-control appendix).

## Deploy order (STRICT)

1. Confirm TOTP MFA is enabled in Supabase dashboard (Auth → Multi-Factor; it is
   on by default for hosted projects).
2. Deploy frontend (mfa.js + ui-views.js + index.html). Safe before the migration:
   admins simply start enrolling/verifying; aal2 is strictly more privileged.
3. Deploy the 15 edge functions (`supabase functions deploy <name>` each).
4. Apply migration `20260904120000_t33_admin_mfa_aal2_gate.sql` — this is the
   moment enforcement turns on. Any admin still holding an aal1 session loses data
   reach until their next sign-in completes the TOTP step.
5. Run `supabase/verify/t33_mfa_gate_check.sql` (read-back) and the real-session
   read-back procedure documented at the top of that file.

## Rollback

Frontend: revert the three files (admins stop being challenged). Database:
`drop policy sbd_mfa_gate on <table>` for each table (the verify SQL prints the
exact list), recreate `sbd_is_admin()` from the 20260903120000 baseline (same body as the archived 20260723130000), and
`drop function sbd_mfa_satisfied()`. Edge functions: redeploy prior versions —
guards are additive and independent.
