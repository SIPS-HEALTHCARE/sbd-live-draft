# #1144 — Emailed code as a second factor for admins (Iggie ruling 9/3, T33 follow-up)

**Date:** 2026-09-10 · **Status:** code-complete, pending deploy · **Issue:** #1144 · **Branch:** `work/1144-email-mfa`

## Problem

T33 gates every admin-tier row read on an `aal2` JWT, and Supabase mints `aal2`
only for its own factors (TOTP, phone). Iggie ruled 9/3 that admins on hospital
floors often have no phone in hand, so an emailed code must open the same door.
Nothing in GoTrue produces an email factor, so `sbd_mfa_satisfied()` must accept a
second condition or the 48 gated tables stay empty for those admins.

## Options

1. **Custom `app_metadata` claim** written by a service-role function, read from the
   JWT by the predicate. Rejected: `app_metadata` is per-user not per-session, and
   `sbd-sync-user-claims` rewrites that object — one sync would silently revoke or
   resurrect the factor.
2. **Enroll a phone factor with a fake number and relay the SMS to email.** Rejected:
   fights the auth provider, needs an SMS provider, and the relay is a second
   delivery path to keep alive.
3. **One small table, one edge function, one extra `exists()` leg in the
   predicate.** The brief's shape. **Chosen.**

## The calls (the brief asked for these before building)

| Call | Decision | Why |
|---|---|---|
| Table | `sbd_mfa_email_codes`, PK `(auth_uid, session_id)`. One row per session carries the pending code (`code_hash`, `code_expires_at`, `failed_attempts`, `sent_at`) AND the verified state (`verified_at`, `verified_until`). `locked_until` lives on the row too. | One row per session is the brief's shape; keeping the pending code on the same row avoids a second table and a join. The composite PK is the index on both columns the predicate needs. RLS on, zero policies: only `service_role` (the function) and the `SECURITY DEFINER` predicate can reach it. |
| Who writes | Only `sbd-mfa-email` (service role). | Same posture as `sbd_observer_pins`. |
| Code | 6 digits, `crypto.getRandomValues`, weak patterns rejected, bcrypt at rest. | Matches the assessor PIN the same users already type; the hash means a DB read leaks nothing usable. |
| Code life | 10 minutes. | Same as the assessor PIN TTL; long enough for a slow mail hop. |
| Verified window | 12 hours, bound to the JWT `session_id`. | A new sign-in is a new session so it always re-challenges; refresh keeps `session_id`, so a workday survives token rotation. |
| Rate limit | 1 send per 60 s per session. 5 wrong codes → code voided and the account (all sessions) locked from sending/verifying for 15 min. | #60 numbers (5 / 15). Per-account lock so a password holder cannot reset the count by opening a new session. |
| Send path | `sbd_email_queue` → `sbd-send-emails` (Resend), new template `mfa_email_code`. | Existing trigger + retry loop. A queue retry re-sends the same row, so the same code — never a new one. |
| Option placement | Inside the existing MFA modal (both enroll and challenge modes): "Email me a code instead". Not on the password form. | The second factor is only asked once password + role are known; the modal is that moment. |
| Hardcoded emails | Dropped from the admin test in `sbd_mfa_satisfied()`. | The three SIPS accounts hold real `sbd_portal_users` roles; the email leg was redundant in the predicate. `sbd_is_admin()` keeps its own legacy list untouched (not this issue). |

## Choice + why

The predicate gains one `exists()` on the table bound to `auth.uid()` and the
JWT `session_id`, inside the verified window. It stays `STABLE` (`now()` is
transaction-stable) and `SECURITY DEFINER` so the zero-policy table is readable
from inside the RLS check. `sbd_is_admin()` calls the predicate at run time, so
it inherits the change without being redefined.

The edge function is the **only** admin-reachable surface at `aal1`: it verifies
the caller's own role via `sbd_portal_users`, and its three actions (`status`,
`send_code`, `verify_code`) never return data from a gated table.

## Blast radius

- **New:** `supabase/migrations/20260910120000_1144_mfa_email_code.sql` (table +
  predicate v2), `supabase/functions/sbd-mfa-email/index.ts`.
- **Edited:** `src/js/mfa.js` (email branch in the modal, `status` pre-check),
  `index.html` (v=3), `supabase/functions/sbd-send-emails/index.ts` (template),
  `scripts/verify-t33-security-tail.js`, `supabase/verify/t33_mfa_gate_check.sql`,
  `ARCHITECTURE.md`, `docs/DATA_RETENTION_POLICY.md`.
- **Not touched — known gap:** the 15 edge functions carrying the inlined T33
  guard still test `aal !== 'aal2'` only. An email-verified admin reads every gated
  table but gets "MFA required" from `sbd-approve-registration`,
  `sbd-set-account-active`, `sbd-assessor-pin generate_pin`, `david-chat`, etc.
  Closing it is one table lookup per function plus 15 redeploys; it is a separate
  decision (see the issue comment).

## Deploy order

1. `supabase functions deploy sbd-send-emails` (template; harmless before anything else).
2. `supabase functions deploy sbd-mfa-email`.
3. Apply the migration (table + predicate). Frontend can be live before or after:
   without the migration the `status` call 404s and the modal simply shows TOTP only.
4. Merge to main (Vercel deploys `mfa.js` v=3).
5. `node scripts/verify-t33-security-tail.js`; run `supabase/verify/t33_mfa_gate_check.sql`.

## Rollback

`drop table public.sbd_mfa_email_codes;` and re-run the `sbd_mfa_satisfied()` body
from `20260904120000` (the email leg is the only difference besides the dropped
allowlist). Delete the function. Revert `mfa.js` + `index.html`.
