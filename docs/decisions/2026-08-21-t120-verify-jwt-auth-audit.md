# T120 — Audit every `verify_jwt=false` function: does each one check who is calling?

**Date:** 2026-08-21 · **Board:** #749 · **Family:** T110 (#711), T119 (#748)

Re-audit of every function the gateway lets in unauthenticated (`verify_jwt=false`). The
last edge-fn auth sweep was 18 Jul (`plans/security-2026-07-18/SWEEP_edge-functions_verify-jwt.md`);
functions have been added and changed since, and T110 found one function anyone could call.

## What changed since 18 Jul

- **`sbd-score-assessment` — cost-abuse gap CLOSED.** The 18 Jul verdict was "permissive
  bearer by design, fix with rate-limiting not an auth block." That rate-limit shipped:
  `sbd_rate_limit_check` RPC (`migrations/20260720120000_security_sweep_2026_07_20.sql`),
  called per client IP (60/min, 600/hr, fail-open) in `index.ts:200-232`. The auth check
  (`:190-192`, anon-key OR any bearer) is unchanged and still intentional — a hard JWT check
  401s candidates whose session goes stale mid-assessment. **The ticket's headline premise
  ("anyone can spend our credits") is now stale: the credit vector is IP-throttled.**
- **`sbd-emails` — one branch fixed, one still latent.** `registration_denied` now has a full
  JWT + admin-role check (`:55-78`). The webhook branch is still **fail-open** (see below).
- **T119 deletions (2026-08-21).** `sbd-data` and `admin-analytics` in the ticket's deployed
  list are **already gone** — both probe `404`. The ticket's list is one day stale.

## The table (one row per `verify_jwt=false` fn in the ticket)

Guard read from source; unauth response = live `POST {}` with **no** bearer, apikey, or
`x-sbd-user-id` (a caller-off-the-street probe, non-manipulating — no identity for any
function to trust).

| Function | In-code guard | Unauth `POST {}` | Verdict |
|---|---|---|---|
| **sbd-score-assessment** | anon-key OR any-bearer (`:190`), **+ per-IP rate limit** (`:200`) | `401 {"error":"Unauthorized"}` | **OK** — permissive by design, credit abuse now IP-throttled. No change. |
| **sbd-emails** | placement=JWT-only (`:59`); reg-denied=JWT+admin (`:55`); webhook=`if(WEBHOOK_SECRET)` **fail-open** (`:149`) | `403 {"error":"Unauthorized"}` | **FIXED THIS PR** — webhook branch made mandatory/fail-closed. |
| **sbd-sync-user-claims** | `getUser(jwt)` + role check (`:38,:54`) | `400 Missing Authorization header` | OK |
| **sbd-release-to-free-agent** | payload-shape first, then `getUser` + allowedRoles (`:42,:60`) | `400 Invalid payload format` | OK (auth after payload parse; still unreachable unauth) |
| **sbd-assign-free-agent** | payload-shape first, then `getUser` + allowedRoles (`:41,:61`) | `400 Invalid payload format` | OK |
| **david-admin-api** | `getUser` + `master_admin` (`:43,:64`) | `401 Missing authorization header` | OK |
| **sbd-auth** *(orphan)* | none — it IS the legacy login issuer; plaintext password compare (`:41`), `validate` returns `valid:true` for any token (`:111`) | `400 Invalid action` | **INSECURE, defer to T119** — legacy auth, not the prod path. Retire, don't patch. |
| **sbd-bulk-upload** *(orphan)* | trusts `x-sbd-user-id` header, no session validation (`:48`) | `401 Authentication required` | **SPOOFABLE, defer to T119** — a known admin UUID → create staff as that admin. |
| **sbd-ai-proxy** *(orphan)* | `getUser()` + role from bare `users` (`:29,:32`) | `400 Unauthorized` | Validates JWT, but orphan against a bare table. Defer to T119 (retire). |
| **sbd-data** *(orphan)* | trusted `x-sbd-user-id` (was) | `404 NOT_FOUND` | **DELETED by T119 today.** |
| admin-analytics *(WHEALTHY)* | — | `404 NOT_FOUND` | **DELETED by T119 today.** Not SBD's. |
| serve-app *(other property)* | — | `302` redirect | Out of scope — not SBD. |
| sbd-demo-request *(other property)* | input validation only | `422 Valid email is required` | Out of scope — marketing endpoint, confirm ownership. |
| sync-spd911 *(other property)* | **none** | `500 YOUTUBE_API_KEY not set` | Out of scope, but **fully open** — flag to its owner. |

## Fix applied (this PR)

`sbd-emails/index.ts` — the webhook branch was gated only `if (WEBHOOK_SECRET)`, so an unset
env would fail **open** and let any anon-key holder queue registration emails to arbitrary
recipients + alert every master_admin (18 Jul finding (b), never closed). Made it mandatory:
refuse unless `WEBHOOK_SECRET` is set **and** matches. **Safe to deploy now** — the live 403
probe proves the secret is currently set and the DB webhook already sends it, so no working
path breaks; only the latent unset-env hole closes.

**Re-probe:** deferred to deploy. The current prod response is already `403` (secret set), so
a bare unauth probe returns `403` before and after — the fix only changes the secret-unset
case, which cannot be exercised from outside.

## Not fixed, on purpose

- **sbd-score-assessment** — the agreed 18 Jul remediation (rate-limit, not auth-block) is
  already shipped. Re-tightening auth re-introduces the stale-session regression it was
  written to survive. No change.
- **The three insecure orphans (`sbd-auth`, `sbd-bulk-upload`, `sbd-ai-proxy`)** — the ticket
  (step 4) defers these to the orphan-functions card. Their correct remediation is retirement
  (migrate the external caller, then delete), not patching auth into a function slated for
  deletion. Recorded in T119's done-when.

## Cross-cutting (unchanged from 18 Jul, still open)

- `verify_jwt` is still not pinned per-function in `config.toml` — only `david-anomaly-detector`
  pins it. Deployed values remain invisible to code review.
- `sbd-emails` placement branch is still JWT-only (any authed user can trigger a templated
  placement email to all master_admins). Low severity, left as-is.
