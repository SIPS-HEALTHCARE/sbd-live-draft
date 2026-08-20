# T119 — Retire the deployed edge functions that have no source in the repo

**Date:** 2026-08-20 · **Board:** #748 · **Family:** T110 (#711), T111 (#721)

The deployed function list carries twelve functions whose source is not in
`supabase/functions/` (23 folders + `_shared`). Nobody can review or redeploy them, two of
them report a `/Users/iiggie/…` laptop path as their entrypoint, and one of them
(`sbd-matrix-seeder`) was ordered deleted in the 18 Jul security EOD and is still ACTIVE
at v12.

## Evidence base

Repo-side sweep on 2026-08-20, this branch:

- **Production frontend** (`src/js/*.js`, `src/components/`, `index.html`): every
  `functions/v1/…` and `invoke(…)` call enumerated. Seventeen distinct functions called,
  all with source in the repo. None of the twelve appears.
- **Crons:** the only two `cron.schedule` migrations are `20260725010811` (calls
  `sbd-review-reminders`, in repo) and `20260819234000` (calls a SQL function, no edge
  function). No cron calls any of the twelve.
- **Function-to-function:** grep across `supabase/functions/` — no function invokes any of
  the twelve. The `david-grade-assessment` hit in `_shared/openrouter.ts` is a stale
  comment (fixed in this PR).
- **Legacy monolith** (`SBD_GOD_SOG.html`, not production): calls bare `sync-user-claims`,
  `bulk-upload-staff`, and three bare names not in the deployed list. Nothing else from
  the twelve.

**Limit of this evidence:** it proves nothing *in this repo* calls them. It cannot prove
an external caller (another SIPS property in the same Supabase project, a webhook, a
third-party scheduler) does not. TASKS.md already records that this project hosts tables
belonging to other SIPS properties. So the pre-delete log check below is mandatory,
especially for the two generically named functions.

## The observed deployed list (2026-08-20)

`supabase functions list` run by the user on 2026-08-20: **57 functions**. All twelve
targets are present. The 22 repo functions are all deployed, and
`sbd-assessment-notifications` is correctly absent (undeployed under T110 / PR #200).

The remaining ~23 functions (`underwriting-*`, `ty-*`, `cert-prep-*`, `obi-assessment`,
`obi10-journal`, `membership-sweep`, `about-contact`, `careers-interest`,
`leadership-interest`, `form-proxy`, `get-subscription`, `renew-member`, `or-keyinfo`,
`serve-app`, `simvoly-debug`, `sync-spd911`, `sbd-demo-request`) belong to other SIPS
properties sharing the project. **Out of scope — not touched.** This means the ticket's
literal done-when ("the deployed list matches `supabase/functions/`") is unachievable
while the project is shared; the achievable end state, and the one this task delivers, is
*no SBD-side function without source in the repo*.

**Open question for the PR:** `sbd-demo-request` is SBD-prefixed, has no source in this
repo, and is not in the ticket's twelve. Zero references here; same 5-month vintage as the
website form handlers, so it is presumed to be a marketing-site endpoint. Left deployed;
worth confirming ownership with the client rather than deleting on a guess.

## Decision per function

| Function | Decision | Why |
|---|---|---|
| `tmp-donell-pr` | **DELETE** (step 1, no download) | Throwaway PR-test artifact by name. Zero references anywhere. Ordered deleted by the ticket itself. |
| `sbd-matrix-seeder` | **DELETE** (step 1, no download, never re-check-in) | Retired #61. Security hazard: seeded fake auth users/facilities (`test-sbd.com`, hardcoded password) with `verify_jwt=false`. 18 Jul EOD ordered deletion; still ACTIVE v12 on 23 Jul. Deliberately removed from the repo — downloading it back defeats the retirement. |
| `david-grade-assessment` | **DELETE** | Retired #61. Orphaned AIP open-ended grader duplicating `sbd-score-assessment`. Zero callers. ARCHITECTURE.md already marks it 🗑️ pending dashboard deletion. |
| `sync-user-claims` | **DELETE** | Pre-prefix duplicate of `sbd-sync-user-claims` (which is in the repo and is what production calls). Its only caller is the legacy monolith, which is not deployed. |
| `sbd-bulk-upload` | **DELETE** | Superseded by `bulk-upload-staff` (in repo, called by the production frontend). Zero references. |
| `sbd-data` | **DELETE** | Zero references anywhere, including the legacy monolith. |
| `sbd-auth` | **DELETE** | Zero references anywhere, including the legacy monolith. |
| `sbd-ai-proxy` | **DELETE** | Zero references. AI traffic goes through `david-chat` / `_shared/openrouter.ts`. Source confirms an old proxy against a bare `users` table; `verify_jwt=false`; laptop-path entrypoint. |
| `admin-analytics` | **⚠️ DELETED anyway 2026-08-21 — was WHEALTHY's, recoverable** | Reclassified after reading the source: header reads *"retrieves WHEALTHY dashboard metrics"*, queries `approved_members` / `page_events` (WHEALTHY tables, a different SIPS property). The ticket wrongly listed it as SBD-side; the analysis said keep. It was deleted in the 2026-08-21 sweep regardless. **If WHEALTHY's dashboard breaks, this is why.** Recoverable: deployed source downloaded at `supabase/functions/admin-analytics/index.ts` (uncommitted), redeploy with `supabase functions deploy admin-analytics`. Aside: it shipped a hardcoded default admin password `whealthy-admin-2026` and ran `verify_jwt=false` — flag to WHEALTHY's owner. |
| `calculate-points` | **DELETE — after log check** | Genuine SBD belt-scoring (belt points, gates, attendance, position school), but legacy: it reads bare `attendance` / `staff` / `staff_history`, not the `sbd_*` tables production uses, and writes a `staff.points` cache nothing in the repo reads. Zero callers, laptop-path entrypoint. Because it is SBD-flavored and could conceivably have an external caller, confirm zero recent invocations before deleting. |
| `sbd-rag-search` | **DELETE** | Zero references, reads `staff_profiles`. RAG lives inside `david-chat` against the Pinecone index directly. |
| `sbd-observation-notify` | **DELETE** | Zero references in repo or crons. Genuine OVS-Gate-3 notification sender (`sbd_portal_users` / `user_profiles`), but orphaned — the live observation path is `sbd-observation-unlock` (in repo). The notifications family was already retired (`sbd-assessment-notifications`, T110 / PR #200). |

### What actually happened (2026-08-21)

The analysis-time verdict above was overtaken by the invocation logs. Final outcome, 57
deployed functions → 49:

- **Deleted (7):** `tmp-donell-pr`, `sbd-matrix-seeder`, `sbd-data`, `calculate-points`,
  `david-grade-assessment`, `sbd-rag-search`, `sbd-observation-notify`, and `admin-analytics`
  (the last against the analysis — it was WHEALTHY's; recoverable, see its row).
- **Kept (4):** `sbd-auth`, `sbd-bulk-upload`, `sbd-ai-proxy`, `sync-user-claims` — their
  dashboard invocation logs showed real traffic, so they were left deployed. Repo grep finds
  no caller, so the traffic is external to this repo (the legacy `SBD_GOD_SOG.html` monolith
  calls the un-prefixed `sync-user-claims` etc., or an old cached client is still live).

**These four are now KEEP-pending, not retired.** Per the ticket's own rule — "anything the
app or a cron still calls gets checked into the repo" — a function that demonstrably receives
traffic can't just be left source-less. Resolve each: check its downloaded source into the
repo so it is reviewable and redeployable, **or** find and migrate the external caller and
then retire it. Do not commit the legacy `verify_jwt=false` / laptop-path source blindly —
decide per function. Downloads sit uncommitted at `supabase/functions/<slug>/`.

## Source verification (2026-08-21)

The deployed source for all ten was downloaded (`supabase functions download`, into
`supabase/functions/<slug>/`, left uncommitted) and read. This is what reclassified
`admin-analytics` and confirmed the rest. Two ticket claims verified in the source:
`sbd-data`, `sbd-auth`, `sbd-bulk-upload`, `sbd-ai-proxy` run `verify_jwt=false`; the
laptop-path entrypoints are `sbd-ai-proxy` (`/Users/iiggie/Desktop/…`) and
`calculate-points` + `sync-user-claims` (`/Users/iiggie/.gemini/antigravity/…`).

## Runbook (needs your Supabase credentials — CLI has no token in agent sessions)

```sh
supabase login

# 0. Confirm the deployed list matches the ticket's twelve
supabase functions list --project-ref mhijaqahbceuahfzezbh

# 1. The two already-decided deletions
supabase functions delete tmp-donell-pr    --project-ref mhijaqahbceuahfzezbh
supabase functions delete sbd-matrix-seeder --project-ref mhijaqahbceuahfzezbh

# 2. DONE 2026-08-21: the source of all ten was downloaded into supabase/functions/<slug>/
#    (left uncommitted, for review). Reading it reclassified admin-analytics as WHEALTHY's.

# 3. Log check (dashboard → Edge Functions → <fn> → Invocations, last 30 days).
#    Mandatory for calculate-points (SBD-flavored, could have an external caller);
#    cheap insurance for the rest. Any function with recent 2xx traffic:
#    STOP, find the caller, check the source in. (A stray 4xx is a scanner/probe — the
#    only hit so far was one 400 on sbd-auth at 2026-08-14 14:01Z, the T110 probe.)

# 4. Delete the nine confirmed SBD orphans (admin-analytics DELIBERATELY EXCLUDED — not ours)
for f in sbd-data sbd-auth sbd-bulk-upload sbd-ai-proxy \
         calculate-points sync-user-claims david-grade-assessment \
         sbd-rag-search sbd-observation-notify; do
  supabase functions delete "$f" --project-ref mhijaqahbceuahfzezbh
done

# 5. Verify. The deployed list will NOT equal the repo list (other properties' functions
#    remain, admin-analytics among them). The real check: no SBD-side function lacks source.
supabase functions list --project-ref mhijaqahbceuahfzezbh
git clean -n supabase/functions/   # then git clean -f to drop the downloaded archives
```

## After deletion

- Update ARCHITECTURE.md rows for `sbd-matrix-seeder` and `david-grade-assessment`
  (currently "delete the deployed function from the Supabase dashboard to fully
  undeploy") to record the deletion date.
- Tick T119 pass 1 with the post-delete `functions list` output as evidence.
