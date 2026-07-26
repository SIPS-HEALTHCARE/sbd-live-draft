# SBD Belt Platform: Closing Scope

**Date of audit:** 2026-07-25
**Purpose:** one bounded list of everything left, so a delivery date can be committed and
the platform stops being an open-ended daily build.

Every issue below was verified against the live project or the live code on the audit date.
Anything that could not be substantiated is in [Discarded findings](#5-discarded-findings)
with the reason. Day estimates are engineering estimates, not measurements.

Nothing in this document has been executed. It is a plan awaiting go-ahead.

---

## 1. Confirmed issues

### 1.1 Security

| ID | Issue | Evidence | Severity |
|---|---|---|---|
| S1 | `placement_reviews` has policy `pr_all_all` = `FOR ALL USING (true) WITH CHECK (true)` to `authenticated`. Any signed-in user of any role, at any facility, can read and modify every placement review. | `pg_policy`; 49 live rows | **High** |
| S2 | `sbd_assessment_queue` UPDATE is gated only on `auth.role() = 'authenticated'`, and SELECT is `USING (true)`. Any signed-in user can change the status of any belt gate request, including their own. | `pg_policy`; 56 live rows | **High** |
| S3 | `staff` grants UPDATE on **every** column to `authenticated`, and `staff_update` permits `staff_member AND id = auth.uid()`. A staff member can set their own `belt`, `stars`, `assessment_gate_override`, `window_override` by direct REST call. | `information_schema.column_privileges`, `pg_policy` | **High** |
| S4 | `free_agents` has `fa_all_all` = `FOR ALL USING (true) WITH CHECK (true)`. | `pg_policy`; 12 live rows | Medium |
| S5 | `facility_shifts` has `fs_all_all` = `FOR ALL USING (true) WITH CHECK (true)`. Table is empty today but the feature that fills it shipped 2026-07-24. | `pg_policy` | Medium |
| S6 | Cross-facility read leak: `sbd_schedule`, `sbd_attendance`, `sbd_promotions` each carry an `auth_read_all` SELECT policy `USING (true)`. Writes on all three are correctly scoped; reads are not. Any signed-in user can read every facility's schedule, attendance and promotion records. | `pg_policy` | Medium |
| S7 | Legacy duplicate tables `assessment_queue`, `assessment_history`, `promotion_approvals`, `attendance`, `schedule` all carry `FOR ALL USING (true) WITH CHECK (true)`. All are empty and unreferenced by application code, but they remain writable by any signed-in user. | `pg_policy`; row counts 0; no code references | Low |
| S8 | `david_analytics_summary` is a `SECURITY DEFINER` view. | Supabase advisor, ERROR level | Low |
| S9 | Auth leaked-password protection is disabled. | Supabase advisor | Low |
| S10 | 35 functions have a mutable `search_path`. | Supabase advisor | Low |
| S11 | 55 `SECURITY DEFINER` functions are executable by `authenticated` and 53 by `anon`. None have been reviewed for whether that grant is intended. | Supabase advisor | Medium |
| S12 | The observer PIN in `ovsUnlock` is compared client side against `DB.staff`, so the check runs entirely in the browser. Observation *writes* are separately gated server side, so this is not an authorisation hole; it is an identity-of-observer weakness. | `src/js/ui-views.js:3117` | Medium |
| S13 | Remaining security-review tail, already committed to the client for **Wednesday 29 July**: admin multi-factor sign-in, written data retention policy, per-role restrictions on the data interface. | prior commitment | Medium |

### 1.2 Controls that report success without saving

This is the class the client noticed. The three scheduling cases were fixed and shipped on
2026-07-24. The sweep was then re-run across every function body **and** every inline
`onclick` handler in `src/js/*.js` and `index.html`. What remains:

| ID | Issue | Evidence | Severity |
|---|---|---|---|
| B1 | **Publish to Staff does nothing at all.** The button's entire handler is `closeModal();toast('Schedule published. Staff can now view their shifts.','ok')`. No state change, no write. `sbd_schedule` already has a `published_by` column, so this is an unfinished feature rather than a deliberate no-op. | `src/js/ui-views.js:10610` | **High** |
| B2 | **Attendance edits never save.** `markAttend`, `markAllAttend` and `assignCoverage` persist only when creating a new record. When a record already exists they mutate local state and return. `SB.updateAttendance` is defined in `api-supabase.js:374` and is called from nowhere in the codebase. First mark saves; every correction after it is lost on reload. | `src/js/ui-views.js:11007, 11025, 11043`; grep for `updateAttendance` | **High** |
| B3 | **Quick-fill schedule does not overwrite.** For a date and shift that already has a row, only local state is updated, while the toast reports the full count as assigned. New rows do save. | `src/js/ui-views.js:10259` | Medium |
| B4 | **Schedule CSV import does not overwrite.** Same shape as B3. | `src/js/ui-views.js:17596` | Medium |

### 1.3 Data quality

| ID | Issue | Evidence | Severity |
|---|---|---|---|
| D1 | The pending review queue reads as 24 items but is roughly 3 real decisions. 14 rows are one person re-submitting the same request (Jody Mays: Yellow Competency 11 times between 25 Jun and 16 Jul, Yellow Simulation 3 times). 5 belong to a test account. 2 point at people with no staff record and no login, sitting since 8 May and 10 Jun. | queue query, audit date | **High** |
| D2 | Two placement reviews reference `staff_id` values with no `staff` row and no `sbd_portal_users` row. They cannot be actioned by anyone. | `placement_reviews` join, audit date | Medium |
| D3 | Avery Henderson has two active `staff_admin` accounts. The personal address carries the training record and has not been signed into since 15 April; the work address is in daily use and holds the Assessor capability. The client has confirmed: SIPS employee, no facility, work address is the real one. | `sbd_portal_users`, `auth.users`, `staff` | Medium |
| D4 | The EOD sent on 2026-07-24 stated the oldest waiting review was six days old. The true figure is 8 May, 78 days. Already corrected to the client in writing. | queue query | Low, closed |

---

## 2. Task list

Estimates are in engineering days. Ordering within a phase is the recommended build order.

### Phase 1: Make the platform honest and safe (est. 5.5 days)

Nothing here needs a client answer. After Phase 1 no control lies about saving, and no
signed-in user can read or write another facility's records.

| # | Task | Est. | Depends on |
|---|---|---|---|
| T1 | S1: replace `pr_all_all` on `placement_reviews` with facility-scoped read plus master/assessor write | 1.0 | |
| T2 | S2: replace the `sbd_assessment_queue` policies so only master admin and granted assessors can change status; candidate keeps self-insert | 0.75 | |
| T3 | S3: restrict the `staff` UPDATE column grant so a staff member cannot set `belt`, `stars`, `assessment_gate_override`, `window_override` | 0.5 | |
| T4 | S5 + S4: scope `facility_shifts` and `free_agents` | 0.5 | |
| T5 | B1: make Publish to Staff actually publish, set `published_by`, and surface the published schedule in the staff portal | 1.0 | |
| T6 | B2: wire `SB.updateAttendance` into all three attendance edit paths | 0.5 | |
| T7 | B3 + B4: persist overwrites in quick-fill and CSV import | 0.5 | |
| T8 | D1: collapse duplicate requests to one open row per person, per belt, per gate | 0.75 | |

### Phase 2: Close the security tail and the client's committed asks (est. 7.5 days)

| # | Task | Est. | Depends on |
|---|---|---|---|
| T9 | I1: read-only observation checklist view for facility leaders. **Already promised in writing to the client** | 1.0 | |
| T10 | D2: auto-close reviews whose person record or login is gone, with a reason recorded. Keys on inactive or missing, never on Free Agent membership. No account is ever deleted | 0.5 | |
| T11 | S6: remove the `auth_read_all` policies on `sbd_schedule`, `sbd_attendance`, `sbd_promotions` and replace with facility scope | 0.5 | |
| T12 | S13: admin multi-factor sign-in, retention policy, per-role data interface restrictions. **Committed for Wed 29 July** | 1.5 | |
| T13 | S11: review all 108 `SECURITY DEFINER` execute grants and revoke the unintended ones | 1.0 | |
| T14 | I2: profile redesign to the layout the client supplied, SBD years in a proper card | 1.5 | client example received |
| T15 | I3: reorganise the staff sidebar into sections, matching the admin panel | 1.0 | |
| T16 | S12: move the observer PIN check server side | 0.5 | |
| T17 | D3: consolidate Avery onto the work account, move training history, close the personal login | 0.25 | your explicit go, production write |

### Phase 3: Remaining scope (est. 9.5 days)

| # | Task | Est. | Depends on |
|---|---|---|---|
| T18 | I4: "See As". Open any person's account and see their dashboard as they see it. Read only, fully audited | 2.5 | client's read-only vs login-as answer |
| T19 | #89: Foundations and Instruments status, dates and assessor notes into all three report levels | 1.5 | |
| T20 | #77: tour parity. Every view shipped since June is missing from the guided tour | 1.0 | |
| T21 | #73b: Role Management portal-routing parity | 1.0 | |
| T22 | #81: voice dictation | 1.5 | |
| T23 | S7: lock or drop the five unused legacy tables | 0.5 | |
| T24 | S8, S9, S10: security-definer view, leaked-password protection, function search paths | 0.5 | |
| T25 | #16: usage cost detail, cached versus new | 0.5 | |
| T26 | #82: app packaging options document | 0.5 | |
| T27 | I6: arm the David chat protection | 0.25 | client's alert-only vs auto-limit answer |

### Blocked: not on our critical path

| # | Task | Blocked on |
|---|---|---|
| X1 | #99: strip and rotate the PSOP credentials, gate the public page | client |
| X2 | #46: David inside PSOP | X1 |
| X3 | #32: Black Belt observation checklist content | Dr. Jake |
| X4 | #33: old audio note | file re-send |

### Totals

| Phase | Est. days |
|---|---|
| Phase 1 | 5.5 |
| Phase 2 | 7.5 |
| Phase 3 | 9.5 |
| **Total, excluding blocked** | **22.5** |

At five working days a week, and assuming no new client asks land mid-flight, Phase 1 and
Phase 2 together are about **three weeks**. Phase 3 is the part that can run alongside
other work rather than blocking it.

---

## 3. Possible risks

1. **New asks keep arriving mid-flight.** Between 24 and 25 July the client added four
   items that are not in any earlier plan: See As, the profile redesign, the sidebar
   sections, and the stale-review trigger. This list is only a closing scope if new asks
   are queued into Phase 3 rather than inserted into Phase 1 and Phase 2.
2. **Tightening RLS can break working screens.** Every policy in Phase 1 currently lets
   everything through, so some screen may be depending on that permissiveness without
   anybody knowing. Each policy change needs a per-role read and write check before it
   goes live, which is inside the estimates but is the most likely source of slippage.
3. **T3 changes column grants on `staff`.** If an admin screen writes a restricted column
   through the staff-member path, it will start failing. Needs a full write-path check.
4. **B1 is larger than it looks.** Publish is not just a flag. It implies deciding what
   staff see before publication, which is a product decision, not only a code change.
5. **See As is the highest-risk item in the whole list.** Built as a real login-as with
   write access, it would let a master admin record an observation under somebody else's
   name and would undo the audit trail built between 22 and 24 July. It must be read only
   and audited, and that position should be held.
6. **The estimates are estimates.** They come from reading the code, not from having built
   these particular changes. Treat Phase 1 as firm, Phase 2 as good, Phase 3 as indicative.
7. **A single Supabase project hosts other SIPS properties.** The `bb_*`, `aip_*`, `demo_*`,
   `tco_*`, `hfl_*`, `op44_*`, `underwriting_*` and `page_events` tables belong to other
   sites and were excluded from this audit. They carry their own permissive policies. If
   the compliance review covers the whole project rather than the belt platform, that is
   additional scope not counted here.

---

## 4. What is already done

Shipped and verified live before this audit, listed so the scope above is not mistaken for
the whole picture: preceptor apply, approve and PIN handshake; the observation write
lockdown and its overrides; the assessor PIN rate limiter and its three corrections;
Role Management with the Assessor capability; the capability-setter silent-success fix;
Position School sign-off requests reaching a leader; staff self-serve SBD background;
review reminders twice daily with a dashboard notice; the three scheduling persistence
fixes; My Profile relocation; and the retirement of two orphaned services.

---

## 5. Discarded findings

Claims that did not survive verification. Recorded so they are not raised again.

| Claim | Why discarded |
|---|---|
| "8 core tables are wide open for read and write, including schedule, attendance and promotions" | Wrong table names. The application uses `sbd_schedule`, `sbd_attendance` and `sbd_promotions`, and all three have correctly scoped **write** policies. The permissive `schedule`, `attendance` and `promotion_approvals` tables are legacy, empty, and unreferenced. The real remaining problem on the live tables is read scope only, which is now S6. |
| "53 always-true RLS policies need fixing" | The raw advisor count includes tables belonging to other SIPS properties in the same project. Only the belt-platform subset is actionable here, which is S1, S2, S4, S5, S7. |
| `prcApply` shows success without saving | False positive. It calls `_prcSaveAccess(...)`. |
| `prcEnterAssessorPin` shows success without saving | False positive. The toast fires inside the success callback of `showAssessorPinGate`. |
| `archiveHospitalSystem` shows success without saving | False positive. It awaits `SB.updateHospitalSystem`; the detection regex missed the `(window.SB || SB).` form. |
| `downloadCSVTemplate`, `downloadScheduleCSVTemplate` | False positives. They generate a file download; there is nothing to persist. |
| `foundations.js:851` observation confirm does not persist | False positive. The enclosing function calls `_fndSaveProgress(p)` before returning. |
| `autoAssignZones` reports success without saving | Technically true but not a defect. It fills the form controls, and the user then saves the shift. At most the wording could be clearer. Not scheduled. |
| "Staff can escalate their own role" | Overstated. `get_user_role()` reads `sbd_portal_users`, not `staff.role`, so writing `staff.role` grants nothing. The real issue is narrower and is S3, training-record integrity. |
| "The review backlog is 24 decisions" | Wrong reading of the same data. It is roughly 3 decisions plus duplicates, test accounts and orphans, which is D1. |
| `staff_history`, `sbd_email_queue`, `sbd_password_resets` and similar are exposed | Checked and safe. RLS is on with no policy, so they are unreachable over REST and only the service role can read them. |

---

*Verification method: Supabase policy and grant tables read directly, Supabase security and
performance advisors, live row counts, and a static sweep of `src/js/*.js` and `index.html`
covering both function bodies and inline event handlers.*
