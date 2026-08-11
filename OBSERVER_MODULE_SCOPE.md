# Observer Module (OVS) — Completion Scope (#58)

**Status:** scoping only — needs Shawn's go before any build. **Drafted:** 2026-07-13, grounded in a read of the current OVS code (`src/js/ui-views.js`, `src/js/api-supabase.js`, `src/js/auth-init.js`) and the observations RLS migration `20260703233921_observations_facility_scoping_rls.sql`.
**Build sequencing (unchanged):** after #50/#54 QA results land, and any RLS change follows the same one-owner migration discipline as #55.

## TL;DR — the plan's framing was stale; here's the corrected scope

The worklist (and the code comment at `ui-views.js:388-389`) says the **candidate request/PIN flow** is missing. It is **not** — that flow is already implemented (`requestObservation` at `ui-views.js:2870-2905`, candidate PIN shown on the dashboard `:7052`, two-PIN handshake validated at `ovsUnlock` `:3044-3059`). The one genuine gap is **per-observer gating**: nothing ties the Observations console — visibility or queue rows — to the logged-in observer, and the `staff.observer` flag grants no portal access. That is what actually remains.

## Already built (do not rebuild)

- **Observer identity:** `staff.observer` (bool) + a reusable 4-digit PIN; granted/generated master-admin-only (`ui-views.js:12828-12855`). **Updated by T37 (2026-08-04):** the PIN moved off `staff.observation_pin` into `public.sbd_observer_pins` (RLS on, no policies — service role only), because a column on `staff` shipped every observer's PIN to any role that can read a staff row. It is now generated and read by the master-admin-only `sbd-observer-pin` function; `staff.observer_pin_set` (bool) is all the browser gets.
- **Request/PIN flow:** candidate requests an observation (`requestObservation` `:2870`), a per-request `handshake.candidate_pin` is generated and shown to the candidate (`:7052`); wired from the Apply modal (`:7118`, `:8340`).
- **Two-PIN capture:** observer PIN + candidate PIN unlock scoring (`ovsUnlock` `:3044`); scoring, stop-work, save/resume, submit all work; submit records the observer as `assessor_id/assessor_name` and stamps the handshake.
- **Facility-scoped admin console:** `renderAObservations` (`:2908`) filters the queue by status + facility; `staff_admin` limited to `assignedFids`; system-wide admins get a facility dropdown. Review console `renderAObservationReviews` (`:3283`) + confirm/return gate writes exist.
- **RLS baseline:** `observations` + siblings are facility-scoped via `sbd_obs_facility_scope(fid)` with a candidate self-branch on SELECT/INSERT (migration `20260703140000`). This is the RLS-Addendum observations tier already in place.

## The gap to close

1. **Per-observer queue scoping.** Today every queued row shows a Conduct/Resume button to any admin who can see the page (`ui-views.js:2970`); the queue filters by facility/status only (`:2913-2926`). An observer sees the whole facility queue, not "observations I can act on."
2. **Observer → portal access link.** Onboarding copy tells observers to run observations "from the admin portal" (`auth-init.js:772-777`), but nothing wires `staff.observer` to portal access. The nav is opened to SIPS admins unconditionally (`ui-views.js:390-393`), with no `if(observer)` path. A pure observer (not also an admin) currently cannot reach the console at all.

## Decisions needed from Shawn (this is why it's a scope doc, not a build)

- **D1 — How does an observer reach the console?**
  - (a) **Reuse admin accounts** (observers are existing admins; add an observer-scoped view within the admin portal). Lowest effort, no new auth surface.
  - (b) **Observer as a first-class portal role** (the `observer` flag grants a lightweight, observation-only console). More work, new access path, likely an RLS touch. *Recommendation: (a) for now unless observers are routinely non-admins.*
- **D2 — What scopes an observer's queue?**
  - (a) **Facility** (observer sees requested observations in their facility) — matches the current model, no request-model change.
  - (b) **Explicit targeting** (a request names an observer or observer-pool; the observer sees only rows targeted to them). Requires adding a target to `requestObservation`/the observation row. *Recommendation: (a); the two-PIN handshake already prevents the wrong observer from scoring, so facility-scoping the queue is sufficient unless there's a policy reason to hide other rows.*
- **D3 — Is per-observer gating UI-only or also RLS-enforced?** Facility scope is already RLS-enforced; per-observer visibility can be **client-side** on top of it (like the current queue filter) without an RLS change. If Shawn wants observers to be *unable to read* other observers' rows at the DB layer, that's a new RLS tier and follows the #55 one-owner migration discipline. *Recommendation: UI-only gating on top of the existing facility RLS, unless a compliance requirement dictates DB-level isolation.*

## RLS impact

- With D1(a) + D2(a) + D3(UI-only): **no migration needed** — the existing facility RLS + candidate self-branch cover it; the work is a client-side queue filter + an observer-scoped entry point.
- With D1(b) or D3(DB-enforced): **new RLS tier required**, keyed to observer identity (`observer=true` and/or a request→observer link). Must be authored as a repo migration and applied by one owner (per #55), reviewed against the RLS Addendum so it doesn't loosen the facility tier.

## Risks / things to confirm before building

- **Untracked base schema.** The `observations` (and sibling) `CREATE TABLE` DDL is not in this repo's migrations — only the RLS migration alters them. Confirm the canonical schema source before any backend change (`fid`, `staff_id`, `handshake`, `assessor_id/name`, `review_status`, etc.).
- ~~**PIN mapper asymmetry.**~~ Resolved by T37: the PIN is no longer a `staff` column at all, so no staff-write path can clobber it. It is written only by the `sbd-observer-pin` function, into `sbd_observer_pins`.
- **Stale comment.** `ui-views.js:388-389` claims the request/PIN flow is unbuilt; correct the comment when this ships to avoid future confusion.

## Out of scope for #58

Backend edge functions (there are none for observations today, and none are required for gating), the review/confirm gate flow (already built), and any change to the two-PIN capture mechanic.

## Definition of done (scope phase)

This doc + Shawn's answers to D1–D3. **Build DoD** (later): observer-scoped console entry + per-observer queue filtering working end-to-end at phone width, with RLS unchanged (D3 UI-only) or a reviewed one-owner migration (D3 DB-enforced).
