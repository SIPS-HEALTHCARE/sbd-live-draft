# Role Management tab / access-controls switchboard + audit trail (#73)

Date: 2026-07-22
Author: Shawn (DepreShawnNeverEnds)
Source of truth: Ignacio (WhatsApp Jul 22 + prior Access Controls Plan). Ignacio: a separate tab where
we can "search a system, facility, person and assign them specific roles outside of the roles based on
their staff roles" for hires/executives, master-admin controlled. He explicitly wants to talk through the
functions and UI first — this note is the basis for that talk-through.

## Problem
Access and role management is scattered and partly buried, and there is no single place to search a
person / facility / system and see or change what they can do:
- Base role (staff_member / facility_admin / hospital / assessor / system_admin / master_admin) is
  changed only through the Admin Users edit-user modal (`openEditUserModal` -> `saveEditUser` ->
  `sbd-sync-user-claims`).
- Extra, role-independent capabilities are ad-hoc toggles in different places: observer
  (`staff.observer` + `toggleObserver`), preceptor access (`preceptor_access` table, Phase 3), and the
  belt-assessment practice-gate waiver (`assessment_gate_override`, #120).
- There is no unified, human-readable audit trail of who granted or revoked what and when, even though a
  persisted `sbd_activity_log` exists and most of these actions already call `logActivity`.

SIPS needs to grant or remove access to a hire or executive independent of their base staff role, from
one place, with an auditable record.

## What already exists (build on this, do not duplicate)
- **Base-role change:** `sbd-sync-user-claims` edge fn (server-enforced), reached from the Admin Users tab.
- **Capability grants (precedents):** observer toggle; `preceptor_access` (granted/revoked/default,
  master-admin-only writes); `assessment_gate_override` ({waived, by, reason, at}, targeted PATCH).
- **Audit substrate:** `sbd_activity_log` (event_type, event_meta, staff_id, facility_id, created_at) with
  `SB.getStaffActivity` / `SB.getFacilityActivity`; `logActivity` already fires on many actions.
- **RLS helpers:** `sbd_is_master_admin()`, `sbd_is_assessor()`, `sbd_fi_leader_scope()`, etc.

## Options
1. **Leave scattered.** Rejected: Ignacio wants one place; audit is incomplete; new hires/executives are
   hard to set up without hunting through modals and toggles.
2. **New Role Management tab that orchestrates the existing writes + a unified audit trail (chosen).** One
   master-admin-only surface to search and manage base role + capabilities, every change written to the
   audit log. Reuses existing enforcement paths rather than inventing a new permission engine.
3. **Generic `sbd_access_grants` table that replaces observer/preceptor/override with one grants model.**
   Deferred: larger migration + re-plumbing live enforcement; higher audit-risk mid-onboarding. Revisit
   later if the capability list grows. v1 keeps each capability's existing store and unifies at the UI +
   audit layer.

## Choice + why
Option 2. It gives Ignacio the single tab and the audit trail with the least blast radius, because base-role
changes and each capability already have a working, permission-checked write path. The tab is an
orchestration + presentation layer plus an audit view; it does not change how any single grant is enforced.

## Scope (proposed — CONFIRM with Ignacio before build)
### Frontend
- New sidebar view `a-rolemgmt` ("Role Management"), **master-admin only** (hidden for every other role).
- **Search** by system, facility, or person (name/email), reusing existing lookups.
- **Per-person panel:**
  - Base role (shows current; "Change role" opens the existing edit-user flow / `syncUserClaims`).
  - Capability toggles, each role-independent, with grant/revoke + reason: Observer, Preceptor access
    (Phase 3), Assessment practice-gate waiver (#120), and any others we agree to expose (e.g. assessor
    rights). Each toggle calls its existing write path.
  - Facility / system scope shown for context.
- **Audit panel:** recent grant/revoke/role-change events for the selected person (from `sbd_activity_log`).
- Guided-tour step for the new view (tour-parity requirement).

### Backend / data
- No new enforcement engine. Add unified audit **event types** to `logActivity` for every change made from
  the tab: `role_change`, `capability_grant`, `capability_revoke` (with subject, capability, reason, actor).
- If a cross-capability read is needed for the audit panel, add a small read helper/view over
  `sbd_activity_log`; no new writable table in v1.

### Security (§3.0 least-privilege — non-negotiable)
- Every write stays on its existing server-enforced path (role via `sbd-sync-user-claims`; capabilities via
  their master-admin-only writes/RLS). The tab never becomes a new privileged bypass.
- The view and its actions are master-admin-only in the UI AND at each write's server check. No wide-open
  policy, no anon-reachable grant path.

## Blast radius
- New `a-rolemgmt` view + nav item + tour step; a per-person panel that CALLS existing handlers
  (`saveEditUser`/`syncUserClaims`, `toggleObserver`, preceptor access set, `grant/clearAssessmentOverride`).
- Additive audit event types; optional small read view over `sbd_activity_log`.
- No change to existing enforcement, no F&I impact, no live-contract break.

## Scalability sniff test (§5)
1. Two apps? Capability grants + one tab; no copy-paste engine.
2. 10x data? Search is indexed lookups; audit is a bounded `order by created_at desc limit`.
3. curl surface? Writes remain master-admin-only at their existing server checks; the tab adds no new
   privileged endpoint.
4. Provider change? None.
5. How do we know it broke? node --check + headless smoke on the tab; verify a non-master cannot see it or
   hit any write; confirm each toggle still routes to its existing (already-tested) path.
6. Undo? Frontend revert; no destructive migration in v1.

## Open questions for Ignacio (the talk-through)
1. Which capabilities should the tab expose beyond Observer / Preceptor access / Assessment-gate waiver?
   (e.g. assessor rights, master-admin, per-facility educator.)
2. Are capabilities purely additive on top of the base role, or do some replace it?
3. Do you need facility- or system-level grants (grant a capability across a whole facility), or person-only?
4. Any new "executive" role beyond the current five, or is this only about granular capabilities?
5. How much audit history should the panel show, and who besides master admin can read it?

## Out of scope (v1)
Generic `sbd_access_grants` table (option 3); custom role types beyond the five; bulk grants. Revisit once
the capability list and Ignacio's answers are settled.
