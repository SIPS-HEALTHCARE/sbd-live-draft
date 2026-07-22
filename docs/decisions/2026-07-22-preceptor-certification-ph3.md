# Preceptor Certification — Phase 3 (master-admin access control + enforcement)

Date: 2026-07-22
Author: Shawn (DepreShawnNeverEnds)
Source of truth: Dr. Jake synopsis §4 (master admin access control) + §3.3 (Gate-3 authority)
+ §5 build checklist. Follows Phase 1 + Phase 2 (live) and content polish (PR #123).

## Problem
Preceptor curriculum access is currently governed only by assignment. SIPS needs to hand-pick
who becomes a preceptor, independent of belt: grant a White Belt early, or cut off a drifting
preceptor immediately without touching their belt. Belt-gating alone is too rigid. Also, the
higher levels must require the lower certification, and a preceptor's own Gate-3 must be
confirmed by someone qualified — neither is enforced yet.

## Options
1. Compute access from belt only. Rejected: the synopsis explicitly requires a belt-independent,
   auditable, master-admin-controlled grant that overrides belt in both directions.
2. **Explicit access record + master-admin toggle (chosen).** A `preceptor_access` row per user
   (granted / revoked / default), master-admin-only writes, read first at curriculum entry.

## Choice + why
Option 2, per synopsis §4. An auditable record (not a computed value) because it overrides belt
logic and every grant/revocation must be traceable. Master-admin only, consistent with belt
confirmation authority staying at SIPS.

## Scope
### Migration (additive) — `preceptor_access`
Columns: `staff_id uuid unique`, `state text` (`granted`/`revoked`/`default`), `granted_by text`
(assigner display name, like `assigned_by`), `granted_at timestamptz`, `reason text`,
`updated_at`. RLS:
- SELECT: `staff_id = auth.uid() OR sbd_fi_leader_scope(staff_id)` (a user reads own; leaders/
  master read across scope, for the toggle + entry check).
- INSERT/UPDATE/DELETE: **master-admin only** — `sbd_is_master_admin() OR jwt email in
  (jjacobs/izambrano/dpayne@sipsconsults.com)`. (`sbd_is_master_admin()` alone lacks the SIPS
  email fallback, so Ignacio — who writes via email — is added explicitly, mirroring the master
  tier of `sbd_fi_leader_scope`.)
Explicit GRANTs to authenticated (RLS governs). No default rows seeded (absence = belt-based).

### Frontend
1. **`prcHasAccess(staffId)`** (preceptor.js) — reads the access record FIRST, belt SECOND:
   `revoked` → false; `granted` → true (any belt); `default`/no-row → belt eligibility
   (Green+, the existing Educator/Preceptor 02B gate). Used by the assign flow and
   `renderSPreceptor`.
2. **Master-admin toggle** on the per-user admin surface (`openAdminProfile`, master-admin only):
   Grant / Revoke / Default, any user any belt, with a reason prompt. Writes `preceptor_access`
   via a new `SB.upsertPreceptorAccess` (mirrors the assignment write). Educators/managers/
   assessors never see it.
3. **Revoke preserves + locks progress** — on revoke, `renderSPreceptor`/`hPrcStaffDetail` show a
   locked state; assignment/progress rows are NOT deleted, so a later re-grant restores them.
4. **L2/L3 prerequisite enforcement** — a candidate cannot be assigned/enter a Level-2 module
   until Level-1 is complete (all L1 modules complete), and Level-3 until Level-2 complete.
   Enforced in the assign flow + shown as a locked reason in the reader.
5. **Gate-3 qualified-confirmer** — the leader confirming a preceptor candidate's Gate-3 must be
   a certified preceptor or above (master_admin/assessor always qualify; a facility educator
   qualifies only if they hold the preceptor cert). Enforced in the confirm handler with a clear
   message; belt-confirmation authority stays at SIPS.

### Hydration + SB
`DB.preceptorAccess` hydrated at login (mirror the other preceptor hydration); `SB.getPreceptorAccess`
+ `SB.upsertPreceptorAccess`.

## Blast radius
- **New table only** (`preceptor_access`) — additive; nothing else reads it, no live-contract break.
- **preceptor.js** — new `prcHasAccess` + toggle handlers + gate checks; Phase-1/2 logic reused,
  not changed.
- **ui-views.js** — the toggle control added into `openAdminProfile` (master-admin branch only);
  minimal, beside existing per-user actions. `api-supabase.js` + `auth-init.js` — new fetch/write/
  hydration mirroring the other preceptor calls. Bump `?v=` on edited src/js.
- No F&I impact.

## Rollback
Frontend revert + `drop table if exists preceptor_access;` (additive, unread by anything else).

## Scalability sniff test (§5)
1. Two apps? Access is per-user data + one helper; no copy-paste.
2. 10× data? One indexed row per user; trivial.
3. curl surface? Writes are master-admin-only at the RLS layer (not the UI) — a non-master
   `curl` to `preceptor_access` is rejected by policy. Reads are own-or-leader scoped.
4. Provider change? None.
5. How do we know it broke? node --check + headless toggle/gate smoke; verify RLS blocks a
   non-master write.
6. Undo? One migration + one frontend revert, both in git.

## Out of scope
Module 7 reader (blocked on source). Everything else in the synopsis is now covered by P1–P3.
