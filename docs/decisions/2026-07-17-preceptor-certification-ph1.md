# 2026-07-17 — Preceptor Certification (#11) — Phase 1 scoping & design

> **Phase 1 progress artifact** for the 1 PM sync. This is a *scoping/design doc + phase
> plan*, **not** a build (ETA list #11 Ph.1). It defines the problem, fixes the phase
> boundaries, surfaces the one decision that blocks everything downstream (#11d ↔ #55),
> and lists the requirement questions Iggie/Shawn must answer before Phase 2 can start.
>
> Source: ETA list `plans/ETA-Task-List-for-Shawn-2026-07-15.md` (#11 Ph.1/#11d/#11 Ph.2/3),
> `plans/NEW_TASKS_20260715.md` (§gating decision). Verified against repo HEAD `7c1b1a1`.
> Requirement fields marked **[PENDING Iggie/Shawn]** stay open until the 1 PM sync — that
> open state is the intended shape of a Phase 1 milestone.

---

## Problem

There is **no Preceptor Certification concept in the codebase today.** "Preceptor" appears
only as curriculum text — the career-ladder answer options in `foundations.js`
(`Educator/Preceptor`) — never as a role, a credential, or a data structure. So "certify a
preceptor" currently has nowhere to be stored, no way to be granted or revoked, and no
effect on what a person can do in the platform.

The ask (Iggie/Shawn) is to let the platform **certify individuals as preceptors** and then
**let the right roles assign/remove preceptor duties** (#11d). Because the feature is
greenfield, the very first decision — *which existing surface it attaches to* — determines
whether it collides with work we just shipped (#55). That decision, not the UI, is the
Phase 1 deliverable.

---

## Scope boundaries (what is / isn't in each phase)

| Phase | In scope | Out of scope | Status |
|---|---|---|---|
| **Ph.1 (this doc)** | Problem framing, surface decision, data-model sketch, phase plan, requirement questions | Any code, schema, or RLS | **This artifact** |
| **Ph.2** | Greenfield build: cert data model + grant/revoke + **#11d** permission widening + RLS | Renewal automation, reporting dashboards | Blocked (see gates) |
| **Ph.3** | Renewal/expiry lifecycle, audit/reporting, notifications | — | Blocked on Ph.2 |

**#11d** (assignment-permission widening — SIPS admin + assessor + facility admin can
assign/remove) lives **inside Ph.2**, not Ph.1. It is called out separately only because it
is the piece that can contradict #55.

---

## THE decision that gates everything: #11d ↔ #55 surface (resolve at the 1 PM sync)

This is the single blocker. **Neither #11d nor further #55 work is safe until it is pinned.**

**Background.** #55 (shipped, PR #110, migration `20260707120000_fi_assign_block_assessor_writes.sql`)
enforces *server-side* that **`staff_admin` (Assessor) and plain staff CANNOT
INSERT/UPDATE** the two Foundations & Instruments assignment tables:
`foundations_assignments` and `instrument_assignments`. #11d wants to *widen* assign
rights to **include assessors**. These pull in opposite directions **only if they touch the
same tables.**

| Option | Surface #11d writes | Interaction with #55 | Our read |
|---|---|---|---|
| **A — Position School / preceptor surface** (`staff.ps_tracks` JSONB, PS track system — ARCHITECTURE.md §16) | Separate path; #55 never touches it | **No conflict.** Preceptor duties modeled as a PS track; assign/remove writes `ps_tracks`, governed by its own (new) RLS. | **Recommended.** |
| **B — F&I tables** (`foundations_assignments` / `instrument_assignments`) | Same tables #55 just locked | **Direct contradiction.** #11d would have to *re-open* assessor INSERT/UPDATE on exactly the policies #55 closed — reverting a live security fix. | Reject unless Iggie/Shawn explicitly want F&I duties, not preceptor duties. |

**Our position (for confirmation): Option A — PS/preceptor surface, not F&I.** Preceptor
certification is a *credential/duty* concept, which is what Position School already models
(`staff.ps_tracks`, `seedPSTracks()`, `beginPSTrack()`/`completePSTrack()`). F&I assignments
are a *different* concept (who is assigned which foundations/instruments coursework) and are
deliberately locked down by #55. Building #11d on F&I would undo #55.

> **Decision needed at 1 PM:** *"Does widened preceptor assign write the Position-School/
> preceptor surface (Option A) or the F&I tables (Option B)?"* If A, #11d and #55 coexist
> cleanly and Sriman scopes new PS RLS. If B, #55 must be re-litigated first — flag the
> security regression.

---

## Data-model sketch (Option A — for discussion, not final)

Assuming Option A, a minimal shape that reuses the PS track system rather than adding a new
domain to `ui-views.js` (ENGINEERING_STANDARDS §B7):

- **Certification state** — a preceptor credential per staffer: who certified them, when,
  evidence, and expiry. Candidate homes (Ph.2 to decide): a dedicated
  `preceptor_certifications` table (cleaner audit, own RLS) **or** a structured entry inside
  `staff.ps_tracks` (no migration, but heavier JSONB on the hot login path). *Leaning toward
  a dedicated table* for auditability and clean RLS — a certification is a grant/revoke
  event trail, which JSONB blobs model poorly.
- **Grant / revoke** — an edge function (`sbd-*`) that writes the cert row atomically + an
  audit entry, mirroring `sbd-record-assessment`'s atomic pattern. Never a partial staff
  PATCH (ENGINEERING_STANDARDS §B11).
- **#11d permission** — RLS on the cert surface allowing `master_admin`, `staff_admin`
  (assessor), and `facility_admin` (facility-scoped) to grant/revoke. Scoped exactly like
  #55's `sbd_fi_can_manage_assignments()` helper, but on the PS/preceptor surface.

All of the above is **Ph.2**. It is sketched here only to make the surface decision concrete.

---

## Phase plan & dependency chain

```
Ph.1 doc (today) ──► 1 PM sign-off ──► #11d surface decision (Option A vs B)
                                             │
                                             ▼
                              [if A] Sriman scopes PS/preceptor RLS
                                             │
   #55 (done, PR #110) ───────────────────► ▼
                                          Ph.2 build (cert model + grant/revoke + #11d + RLS)
                                             │
                                             ▼
                                          Ph.3 (renewal/expiry, audit, reporting)
```

**Ph.2 cannot start until:** (1) Ph.1 sign-off, (2) the surface decision resolved to A (or B
with #55 re-litigated), (3) Sriman confirms the RLS scope. Ph.2 build is greenfield/multi-week —
targets **late Jul → Aug** per the ETA list.

---

## Open questions for Iggie/Shawn (bring to 1 PM)

**Certification requirements** *(all [PENDING Iggie/Shawn])*:
1. **Who can certify a preceptor?** SIPS master admin only, or also assessors / facility leaders?
2. **What is the credential's basis?** A belt level reached, a specific assessment/observation
   passed, manual grant, or a combination?
3. **Does it expire / renew?** If so, on what cadence, and who renews? (Drives Ph.3 scope.)
4. **What evidence is captured** at grant time (assessor, date, notes, supporting record)?
5. **What does being certified *unlock*?** Ability to run observations, sign off placements,
   appear in a preceptor directory, something else? (Determines how it wires into existing flows.)
6. **Facility scope** — is a preceptor certification global to the person, or per-facility?

**The gating decision** *(must resolve at the sync)*:
7. **#11d surface: Option A (PS/preceptor) or Option B (F&I)?** — see the decision section above.
   Our recommendation is A.

---

## Blast radius (Phase 2 — for planning only, no code yet)

- **New:** likely one migration (cert table + RLS), one edge function (grant/revoke + audit),
  one new `src/js/` module for the preceptor UI (**not** added to `ui-views.js` — §B7).
- **Touched:** whichever flows "certified" gates (observations/placements) — enumerated once
  Q5 is answered.
- **Must NOT touch:** `foundations_assignments` / `instrument_assignments` RLS (that is #55;
  changing it is the Option-B regression).

## Rollback (Phase 2, when built)

Additive: a new table + new policies + a new script tag are all independently droppable, and
the feature is dark until its UI ships. No existing data is migrated or overwritten.
