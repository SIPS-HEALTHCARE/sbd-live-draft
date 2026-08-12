# T79 — A SIPS admin role, and splitting approval from PIN generation

**Date:** 2026-08-12 · **Status:** acknowledged 2026-08-12, implemented, pending apply/deploy · **Ledger:** T79 (est 1.5d, High)

**Decisions taken 2026-08-12:** Option 1 (additive only — role allow-lists kept as an OR branch,
narrowing them is a separate task). One `approve_assessment` grant covers both approving the
request and recording the outcome.

**Verification shipped with it:** `node scripts/verify-t79-assessment-grants.js` (33 assertions,
including the independence invariant read out of the shipped SQL and edge-function code) and
`supabase/verify/t79_assessment_grants_check.sql` for after the migration is applied.

## Problem

Asked 2026-07-30 in two messages five minutes apart, after the client was told PIN generation is
master-admin only:

> "We can add pin gen to role management so we can allow approved admin to gen pin… I guess we
> should create a sips admin role that is a blank role until we update it in role management"

> "Can we break apart permission to approve assements… we want them to be sips admin and be able
> to proctor the assessments… so generation"

Re-verified read-only against the repo on 2026-08-12. Three separate facts, all confirmed:

**1. There is no `sips_admin` role.** The roles that exist in the code are `staff_member`,
`hospital`, `facility_admin`, `master_admin`, `staff_admin`, `system_admin` (plus the legacy
strings `admin`, `master`, `assessor`, `educator`, `preceptor` that still appear in server-side
allow-lists). `sbd_portal_users.role` is free text with no CHECK constraint, so adding a value
needs no schema change — but nothing today knows what to do with a new one:

- `doLogin` (`ui-views.js:106-111`) maps role → portal via `roleMap[…] || 'hospital'`. An unknown
  role therefore lands in the **hospital portal**, which immediately reads `u.fid`. A SIPS admin
  with no facility gets a broken screen, not an empty one.

**2. Approving and PIN-generating are one bundle, and it is a *role* bundle, not a capability
bundle.** Neither write path reads `capabilities` at all:

| Action | Where it is enforced today | Gate |
|---|---|---|
| Generate a PIN (proctor) | `sbd-assessor-pin/index.ts:22,92` | `ASSESSOR_ROLES` = master_admin, staff_admin, system_admin, admin, master, educator, preceptor |
| Approve an assessment request | `aq_update` policy (`20260730070000`) | role in (master_admin, admin, staff_admin, system_admin) **or** `sbd_is_assessor(facility_id)` |
| Record an assessment result | `sbd-record-assessment/index.ts:37` | the same role list **+** facility_admin |

So holding one of those roles grants all three at once, and there is no way to hold one without
the others. The `capabilities.assessor` grant that Role Management already offers does **not**
grant PIN generation — it only widens RLS reach (observations, F&I, queue SELECT). That is the
actual bundle: the split the client wants does not exist in either direction.

**3. Role Management is already the right home for this.** `renderARoleMgmt`
(`ui-views.js:17793`) is a master-admin console with five working grants — Observer, Preceptor
access, gate waiver, Assessor rights (+ facility list), Facility educator (+ facility list) —
persisted through `sbd_set_user_capabilities`, a SECURITY DEFINER RPC that checks for master
admin, backed by the T53 privilege-guard trigger. Nothing new has to be invented to carry two
more grants.

## Options

1. **Two new capabilities in the existing `capabilities` jsonb, additive to the current role
   allow-lists.** `issue_pin` and `approve_assessment`, each optionally scoped by a facility
   list, following the exact `assessor` / `assessor_facilities` pattern T74 and T77 established.
   No existing account's reach moves. `sips_admin` is a new role string, so every `role in (…)`
   check in the database denies it structurally — it reaches nothing until granted.
2. **Two new capabilities, and strip the role allow-lists down to match.** Truer to the words
   "break apart": even `staff_admin` would need an explicit grant. Requires a backfill migration
   for every live holder and changes live permissions on the day it applies.
3. A `sips_admin` role with its own hardcoded permission set. Rejected: it recreates the bundle
   one role over, and the client's stated pattern — the same one behind T74 — is composable
   grants, not new bundles.

## Choice + why

**Option 1.** It satisfies all three Done-when lines with no live-permission regression. The two
permissions become independently holdable (demonstrable on any account outside the legacy role
lists, which is exactly the new `sips_admin` account the client described); a fresh `sips_admin`
reaches nothing because no policy and no allow-list contains that string; and enforcement sits in
RLS and in the two edge functions, not in hidden buttons.

Option 2 is the honest reading of "break apart", but it moves live reach for every `staff_admin`,
`educator` and `preceptor` account on the day it applies. The 2026-07-30 staff-list outage came
from exactly this shape of change (a permission narrowing applied without a per-account
backfill), so it is proposed as a **separate, sequenced follow-up** once the grants exist and can
be backfilled and verified account by account — not bundled into the same migration.

The one thing Option 1 leaves standing: `staff_admin` keeps both permissions bundled. If the
client's intent is that Avery-style assessor accounts must also be split, that is Option 2 and it
needs its own ledger line.

### Shape

Reusing the existing column — no new table, no new column:

```jsonc
capabilities: {
  "issue_pin": true,
  "issue_pin_facilities": ["<fid>", …],           // absent/empty = everywhere (T74 semantic)
  "approve_assessment": true,
  "approve_assessment_facilities": ["<fid>", …]   // absent/empty = everywhere
}
```

Absent-or-empty means system-wide, matching `sbd_is_assessor(uuid)` and what the Role Management
UI already tells the admin ("None chosen, so it currently applies everywhere"). Revoking a grant
drops its facility list with it, mirroring `rmSetCapability`'s existing rule so a later re-grant
cannot silently inherit a scope nobody chose.

Two SQL helpers, copied in shape from `sbd_is_assessor(uuid)` (stable, security definer,
`search_path = public`, `authenticated` + `service_role` only):

- `sbd_can_issue_pin(p_fid uuid)`
- `sbd_can_approve_assessment(p_fid uuid)`

Neither includes a master-admin bypass, matching `sbd_is_assessor(uuid)`: every calling policy
already ORs in its own master check, so adding one here would widen reach rather than mirror it.

### Where each grant is enforced (server side)

| Grant | Enforcement point | Change |
|---|---|---|
| `issue_pin` | `sbd-assessor-pin` → `generate_pin` | allow when the role is in `ASSESSOR_ROLES` **or** `capabilities.issue_pin` is held for that staff member's facility. Facility check reuses the existing step-3 logic. |
| `approve_assessment` | `aq_update`, `aq_select` policies on `sbd_assessment_queue` | add an `or sbd_can_approve_assessment(facility_id)` branch. SELECT is required too, or the grantee cannot see the row they are entitled to approve. |
| `approve_assessment` | `sbd-record-assessment` | add the capability to `allowedRoles`, so an approve-granted SIPS admin can record the outcome as well as approve the request. |

`validate_pin` is deliberately untouched — it is the candidate's side of the handshake and is
gated by the PIN itself, not by a role.

### Client side (cosmetic only, stated as such)

- `roleMap` gains `sips_admin: 'admin'` so the account reaches the admin portal shell instead of
  falling through to the hospital portal and breaking on a missing `fid`.
- `enterPortal`'s admin branch currently reveals almost every nav item to any non-master admin
  (placement reviews, observations, observation reviews, promo queue at lines 486-501). A
  `sips_admin` branch hides all of them and reveals only what its grants cover, plus Settings.
  This is presentation. The guarantee that a fresh SIPS admin reaches nothing is that the string
  `sips_admin` appears in **zero** policy role lists and zero server allow-lists.
- `effCanIssuePin()` / `effCanApproveAssessment()` beside the existing `eff*` helpers, mirroring
  the two SQL functions so the screen and the policy agree. The PIN and Approve buttons
  (`ui-views.js:14910`, `15022`, `15147`, `15319`, `preceptor.js:8020`) consult them.
- Two more rows in `_rmPanel` and two more badges in `_rmCapBadges`, following the Assessor-rights
  row (grant toggle + facility picker) verbatim.

## Blast radius

**Files:** `supabase/migrations/<new>_t79_split_assessment_grants.sql`;
`supabase/functions/sbd-assessor-pin/index.ts`; `supabase/functions/sbd-record-assessment/index.ts`;
`src/js/ui-views.js` (`roleMap`, `enterPortal`, the `eff*` helpers, `_rmPanel`, `_rmCapBadges`,
`rmSetCapability` cleanup rules, `ROLE_LABELS`, the two user-role `<select>`s at 16346/18325 and
`openAddUserModal`'s `sips` `roleOpts`); `index.html` (`?v=` bump); `ARCHITECTURE.md` §8;
`TASKS.md` T79.

**Tables:** none created or altered. `sbd_portal_users.capabilities` gains two optional keys.
`sbd_assessment_queue` policies `aq_select` / `aq_update` are re-created.

**Edge functions:** `sbd-assessor-pin` and `sbd-record-assessment` must be redeployed from git
(`supabase functions deploy`) — the migration alone does not split anything.

**What could break.** Two things carry real risk and both are one-way doors if got wrong:

1. Re-creating `aq_select` / `aq_update` means re-typing every existing branch. Dropping one
   silently removes reach for a live role — the T77 note is explicit that these two policies are
   the only ones on this table referencing `sbd_is_assessor`. The new branches are appended; no
   existing branch is edited.
2. `ASSESSOR_ROLES` in `sbd-assessor-pin` is a module constant used only by `generate_pin`. The
   change is an `or`, not a replacement, so no current holder loses PIN generation.

**Not verified, and cannot be from here.** Whether production carries a policy or grant that
would give an unknown role incidental reach. The Supabase MCP has no access to this project, so
this was verified against the migration files only. A `supabase/verify/` query ships with the
migration for the client to run: it lists every policy on the affected tables plus a
`sbd_get_user_role()`-shaped probe for a `sips_admin` row. Note that `sbd_get_user_role()` itself
exists in **no** migration file (a pre-existing B2 violation) — it is read but not re-created here.

## Rollback

- Policies: re-create `aq_select` / `aq_update` from `20260730070000` verbatim.
- Helpers: `drop function if exists public.sbd_can_issue_pin(uuid), public.sbd_can_approve_assessment(uuid);`
- Edge functions: redeploy the previous commit — both changes are additive `or` branches, so the
  prior code is correct on its own.
- Capability keys: `sbd_set_user_capabilities` with the keys removed. No data loss; nothing else
  reads them.
- Any `sips_admin` account: change its role in the existing edit-user modal. It holds nothing.

## Resolved: what "approve an assessment" covers

"Approve an assessment" maps to two write paths in this codebase: approving the *request* to sit
an assessment (`approveGateRequest` → `aq_update`) and recording the *outcome*
(`sbd-record-assessment`). Both sit behind the single `approve_assessment` grant, on the reading
that a person who may approve an assessment may also record it. Deny is the same `aq_update` write
as approve, so it rides the same grant. If the client later wants the request and the outcome
split, that is a third grant and its own ledger line.

## Three gaps found during implementation, all fixed here

None was in the ask, and each would have made the feature untestable or unusable as specified:

0. **A PIN-only grant could write but not read.** `staff_select` (`20260730170000`) admits a
   capability assessor via `sbd_is_assessor(fid)`, but a PIN grant is not
   `capabilities.assessor` — so a SIPS admin holding only `issue_pin` would call `generate_pin`
   successfully and still see an empty candidate list, because RLS fails silently by returning
   fewer rows. Telling the admin to also grant Assessor rights to make PIN generation work would
   re-bundle the permissions through the back door, so `staff_select` gains a read branch for
   each grant instead. **Reads are shared; the writes stay split** — that asymmetry is the design,
   and the harness asserts both halves of it.

1. **Role Management could not see a SIPS admin at all.** `_rmPeople` was built from `DB.staff`
   alone, and `sbd-sync-user-claims` only creates a staff row when the role is `staff_member`. A
   fresh SIPS admin therefore had no staff row and never appeared in the console that is supposed
   to grant it something — the second Done-when line was unreachable. Staff-less portal users are
   now synthesised into the list, keyed on `u.sid` (which `mapUserFromBackend` falls back to
   `auth_uid`, so it is always set). The three staff-record capabilities (Observer, Preceptor,
   gate waiver) are hidden for those accounts rather than shown as togglable-but-broken.
2. **A created SIPS admin was invisible in Admin Users.** `renderAAdminUsers` groups by role and
   had no group matching `sips_admin`, so the account could not be found again to edit. Added to
   the SIPS group.

## Follow-up this deliberately does not do

`staff_admin`, `educator` and `preceptor` keep both permissions bundled through the role
allow-lists. Narrowing those lists is the honest reading of "break apart" and needs a per-account
backfill plus account-by-account verification; it is logged as its own ledger line rather than
bundled into this migration.
