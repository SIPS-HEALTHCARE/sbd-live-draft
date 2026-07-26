# SBD Belt Platform: Task Ledger

**Living document.** This is the single record of what has been built and what is left.
It is not regenerated. It is edited in place.

**Last updated:** 2026-07-26
**Audit basis:** 2026-07-25, verified against the live project and the live code.

---

## How this file works

**1. Numbers are permanent.** `T1` is always `T1`. A task is never renumbered, never
deleted, never reordered once it has a number. That is what makes it a ledger instead of a
snapshot.

**2. The list is chronological.** Items appear in the order they are meant to be worked.
Everything already shipped sits at the top, checked off, in the order it shipped.

**3. New work goes to the end.** A new request gets the next free number and is appended.
It does not jump the queue and it does not get inserted in the middle.

**4. Linked work nests instead of appending.** If new work belongs to an existing task,
it becomes `T12a`, `T12b`, `T12c` under that task rather than a new number at the end.
Use this only when the work genuinely cannot stand alone.

**5. A box is ticked only after both passes.**

- **Pass 1:** built, and verified against the live system rather than assumed. For a
  database change that means reading the policy or grant back. For a code change it means
  a test or a live check, not "it should work now".
- **Pass 2:** the claim is attacked. Anything unsupported is removed or downgraded before
  the box is ticked. If Pass 2 kills the finding, the task moves to
  [Discarded](#discarded-findings) with the reason rather than being silently dropped.

Only when both passes are done does the item become `- [x]` with the title struck through
and a `done` date. Half-finished work stays unticked.

**6. Nothing here is executed without a go-ahead.** Unticked items are a plan.

---

## Ledger

### Shipped

- [x] ~~**T1** Preceptor Module 7 reader, all 15 workbook readers re-extracted to structured blocks~~
  `done 2026-07-22` · live-verified
- [x] ~~**T2** Belt-request practice gate leak fix, plus master-admin waiver~~
  `done 2026-07-22` · live-verified
- [x] ~~**T3** Assessment-ready begin card, routed into Study and Practice~~
  `done 2026-07-22` · live-verified
- [x] ~~**T4** Sidebar footer name block opens the profile~~
  `done 2026-07-22` · live-verified
- [x] ~~**T5** Role Management tab v1 and v1.1, grant Assessor and Facility educator~~
  `done 2026-07-22` · live-verified
- [x] ~~**T6** David grading cost tracking, separated from chat allowance~~
  `done 2026-07-22` · live-verified
- [x] ~~**T7** Retired `sbd-matrix-seeder` and `david-grade-assessment`, source removed and deployed functions replaced with inert 410 stubs~~
  `done 2026-07-23` · both stubs re-read from prod on 2026-07-25 and confirmed inert
- [x] ~~**T8** Closed the self-elevation path across all role checks (`user_metadata`)~~
  `done 2026-07-23` · live-verified
- [x] ~~**T9** Observation record write lockdown, master and assessor only, read-only UI for oversight roles~~
  `done 2026-07-23` · live-verified
- [x] ~~**T10** Assessor PIN rate limiter, 5 failures in 10 minutes gives a 15 minute lockout~~
  `done 2026-07-23` · live-verified
- [x] ~~**T11** Preceptor certification: apply, master-admin approve, PIN handshake on Simulation and Observation~~
  `done 2026-07-23` · live-verified
- [x] ~~**T12** Profile SBD Background fields, years in programme and years certified~~
  `done 2026-07-23` · columns confirmed on prod
- [x] ~~**T13** Assessor PIN lockout corrections: full 15 minute hold, new PIN actually unlocks, no stale-digit resubmit~~
  `done 2026-07-24` · live-verified
- [x] ~~**T14** Capability setter no longer reports success when nothing was granted~~
  `done 2026-07-24` · migration read back from prod
- [x] ~~**T15** Granted Avery Henderson the Assessor capability~~
  `done 2026-07-24` · `sbd_is_assessor()` confirmed passing, exactly 1 user holds it
- [x] ~~**T16** Review reminders twice daily until approved or denied, plus the admin dashboard notice~~
  `done 2026-07-24` · function v1 and cron job 5 confirmed active on prod
- [x] ~~**T17** Scheduling controls that only changed the screen: clear shift, create and edit shift, delete shift now persist~~
  `done 2026-07-24` · live-verified
- [x] ~~**T18** Observation overrides write lockdown~~
  `done 2026-07-24` · live-verified
- [x] ~~**T19** My Profile moved into the Support section~~
  `done 2026-07-24` · live-verified, closes the point raised on the client's video
- [x] ~~**T20** Position School sign-off requests persist and reach a leader queue with approve and deny~~
  `done 2026-07-24` · 5 headless checks, migration read back from prod
- [x] ~~**T21** Staff can set their own SBD Background from My Profile, no forced setup step~~
  `done 2026-07-24` · 6 headless checks, prod serving v182 confirmed by curl

### Phase 1: make the platform honest and safe

No client answer needed for any of these. After Phase 1, no control claims to save when it
does not, and no signed-in user can read or write another facility's records.

- [ ] **T22** Lock down `placement_reviews` (issue `S1`) · est 1.0d · **High**
  Policy `pr_all_all` is `FOR ALL USING (true) WITH CHECK (true)` to `authenticated`, over
  49 live rows. Any signed-in user at any facility can read and modify every placement
  review. Replace with facility-scoped read plus master and assessor write.
  *Pass 1 gate:* read the new policy back from `pg_policy` and test one read and one write
  per role.
- [ ] **T23** Lock down `sbd_assessment_queue` (issue `S2`) · est 0.75d · **High**
  UPDATE is gated only on `auth.role() = 'authenticated'` and SELECT is `USING (true)`,
  over 56 live rows. A candidate can approve their own belt gate request. Restrict status
  changes to master admin and granted assessors; keep candidate self-insert.
- [ ] **T24** Restrict the `staff` UPDATE column grant (issue `S3`) · est 0.5d · **High**
  `authenticated` holds UPDATE on every column and `staff_update` permits
  `staff_member AND id = auth.uid()`, so a staff member can set their own `belt`, `stars`,
  `assessment_gate_override` and `window_override` by direct call.
  *Risk:* if an admin screen writes a restricted column through the staff-member path it
  will start failing. Check every write path before applying.
- [ ] **T25** Scope `facility_shifts` (issue `S5`) · est 0.25d · Medium
  Carries `FOR ALL USING (true) WITH CHECK (true)`. Empty today, but the feature that
  fills it shipped on 2026-07-24, so this is cheapest right now.
  - [ ] **T25a** Scope `free_agents` (issue `S4`) · est 0.25d · Medium
    Same policy shape, 12 live rows. Shares the migration with T25.
- [ ] **T26** Make Publish to Staff actually publish (issue `B1`) · est 1.0d · **High**
  The button's entire handler is
  `closeModal();toast('Schedule published. Staff can now view their shifts.','ok')`.
  It changes nothing. `sbd_schedule` already has a `published_by` column, so this is an
  unfinished feature. Set `published_by` and surface the published schedule in the staff
  portal.
  *Note:* larger than it looks. It implies deciding what staff see before publication,
  which is a product decision as much as a code change.
- [ ] **T27** Persist attendance edits (issue `B2`) · est 0.5d · **High**
  `markAttend`, `markAllAttend` and `assignCoverage` persist only when creating a record.
  On an existing record they mutate local state and return. `SB.updateAttendance` is
  defined at `api-supabase.js:374` and called from nowhere. First mark saves; every
  correction after it is lost on reload.
- [ ] **T28** Persist quick-fill schedule overwrites (issue `B3`) · est 0.25d · Medium
  `ui-views.js:10259`. New rows save, but for a date and shift that already exists only
  local state changes, while the toast reports the full count as assigned.
  - [ ] **T28a** Persist CSV import overwrites (issue `B4`) · est 0.25d · Medium
    `ui-views.js:17596`. Same shape as T28 and shares the fix.
- [ ] **T29** Collapse duplicate gate requests (issue `D1`) · est 0.75d · **High**
  One open request per person, per belt, per gate. A repeat refreshes the existing row
  instead of adding another. This alone removes 14 of the 24 queue rows.

### Phase 2: close the security tail and the committed client asks

- [ ] **T30** Read-only observation checklist view for facility leaders · est 1.0d
  **Already promised to the client in writing on 2026-07-25.** There is one checklist per
  belt shared platform-wide with no per-facility copy, so edit rights are not a permission
  toggle. Leaders get visibility; SIPS stays the only editor.
- [ ] **T31** Auto-close reviews with no real person behind them (issue `D2`) · est 0.5d
  Two placement reviews point at `staff_id` values with no staff row and no login, sitting
  since 8 May and 10 June. Close the review and record why.
  *Rule, set by the client:* key on the account being switched off or the record being
  gone, **never** on Free Agent membership. `kbansil` and Jake are active test accounts in
  Free Agent. **No account is ever deleted.**
- [ ] **T32** Remove the cross-facility read leak (issue `S6`) · est 0.5d
  `sbd_schedule`, `sbd_attendance` and `sbd_promotions` each carry an `auth_read_all`
  SELECT policy `USING (true)`. Writes on all three are correctly scoped; reads are not.
- [ ] **T33** Security review tail (issue `S13`) · est 1.5d · **committed for Wed 29 July**
  Admin multi-factor sign-in, a written data retention policy, per-role restrictions on
  the data interface.
- [ ] **T34** Review the `SECURITY DEFINER` execute grants (issue `S11`) · est 1.0d
  55 such functions are executable by `authenticated` and 53 by `anon`. None has been
  reviewed for whether that grant is intended. Revoke the ones that are not.
- [ ] **T35** Profile redesign to the client's supplied layout · est 1.5d
  Two-column bio card, avatar panel, labelled field pairs, badges, tags, availability
  pill. The SBD years values move into a proper card instead of the small meta line.
  Example received 2026-07-26.
- [ ] **T36** Reorganise the staff sidebar into sections, matching the admin panel · est 1.0d
  Requested 2026-07-26.
- [ ] **T37** Move the observer PIN check server side (issue `S12`) · est 0.5d
  `ovsUnlock` compares the observer PIN client side against `DB.staff`. Observation writes
  are separately gated server side, so this is an identity-of-observer weakness rather
  than an authorisation hole.
- [ ] **T38** Consolidate Avery onto the work account (issue `D3`) · est 0.25d
  Client confirmed: SIPS employee, home office, no facility, work address is the real
  account. Move the training history across and close the personal login.
  *Gate:* production write. Needs an explicit go on the day.

### Phase 3: remaining scope, can run alongside other projects

- [ ] **T39** "See As": open any person's account and see their dashboard as they see it · est 2.5d
  Read only and fully audited. **Do not implement by flipping the role client side**; that
  is the exact pattern being removed everywhere else. A master admin recording an
  observation while signed in as an assessor would stamp the assessor's name on the record
  and undo the audit trail built between 22 and 24 July.
  *Blocked on:* the client's answer, read only versus login as.
- [ ] **T40** Foundations and Instruments status, dates and assessor notes into all three report levels · est 1.5d
  Design already locked.
- [ ] **T41** Guided tour parity · est 1.0d
  Every view shipped since June is missing from the tour. Tour parity is meant to be part
  of shipping a view, so this is catch-up debt.
- [ ] **T42** Role Management portal-routing parity · est 1.0d
  A granted user should see the elevated tools in the app, not only the badge.
- [ ] **T43** Voice dictation for typed answers and David · est 1.5d
- [ ] **T44** Lock or drop the five unused legacy tables (issue `S7`) · est 0.5d
  `assessment_queue`, `assessment_history`, `promotion_approvals`, `attendance`,
  `schedule`. All empty, all unreferenced by application code, all writable by any signed
  in user.
- [ ] **T45** Remove `SECURITY DEFINER` from the `david_analytics_summary` view (issue `S8`) · est 0.25d
  The only ERROR-level item the advisor reports.
  - [ ] **T45a** Enable leaked-password protection in Auth (issue `S9`) · est 0.1d
    A single setting. Checks sign-ups against known breached passwords.
  - [ ] **T45b** Fix the mutable `search_path` on 35 functions (issue `S10`) · est 0.25d
    Hardening. No behaviour change expected.
- [ ] **T46** David usage cost detail, cached versus new · est 0.5d
- [ ] **T47** App packaging options document, web versus installed · est 0.5d
- [ ] **T48** Arm the David chat protection · est 0.25d
  *Blocked on:* the client's answer, alert only versus auto-limit.

### Blocked, not on the critical path

- [ ] **T49** Strip and rotate the PSOP credentials, gate the public page
  *Blocked on:* the client.
- [ ] **T50** David inside PSOP
  *Blocked on:* T49.
- [ ] **T51** Black Belt observation checklist content
  *Blocked on:* Dr. Jake.
- [ ] **T52** Old audio note from 2026-05-29
  *Blocked on:* the file being re-sent.

---

## Totals

| Phase | Open tasks | Est. days |
|---|---|---|
| Phase 1 | T22 to T29 | 5.5 |
| Phase 2 | T30 to T38 | 7.75 |
| Phase 3 | T39 to T48 | 9.75 |
| Blocked | T49 to T52 | not counted |
| **Total, excluding blocked** | **26 tasks** | **23.0** |

At five working days a week, Phase 1 and Phase 2 together are about **three weeks**, after
which other projects can be scheduled. Phase 3 runs alongside rather than blocking.

Estimates come from reading the code, not from having built these particular changes.
Treat Phase 1 as firm, Phase 2 as good, Phase 3 as indicative.

---

## Risks

1. **New asks arriving mid-flight.** Four landed between 24 and 26 July that appear in no
   earlier plan: See As, the profile redesign, the sidebar sections, the stale-review
   trigger. This is only a closing scope if new asks append at the end under rule 3 rather
   than being inserted into Phase 1 or Phase 2.
2. **Tightening a permissive policy can break a working screen.** Every policy in Phase 1
   currently lets everything through, so a screen may depend on that without anyone
   knowing. Each change needs a per-role read and write check before it goes live. This is
   inside the estimates and is still the most likely source of slippage.
3. **T24 changes column grants on `staff`.** The most likely single breakage in Phase 1.
4. **T26 is a product decision as much as a build.** Publishing implies defining what staff
   see before publication.
5. **T39 is the highest-risk item in the list.** Built with write access it would undo the
   audit trail built between 22 and 24 July. The read-only position should be held.
6. **One Supabase project hosts other SIPS properties.** The `bb_*`, `aip_*`, `demo_*`,
   `tco_*`, `hfl_*`, `op44_*`, `underwriting_*` and `page_events` tables belong to other
   sites and are outside this audit. They carry their own permissive policies. If a
   compliance review covers the whole project rather than the belt platform, that is
   additional scope not counted here.

---

## Discarded findings

Claims that did not survive Pass 2. Recorded so they are not raised again.

| Claim | Why it was dropped |
|---|---|
| Eight core tables are wide open for read and write, including schedule, attendance and promotions | Wrong tables. The application uses `sbd_schedule`, `sbd_attendance` and `sbd_promotions`, and all three have correctly scoped **write** policies. The permissive tables of the same name are legacy, empty and unreferenced. What actually remains on the live tables is a read leak, now T32. |
| 53 always-true policies need fixing | The raw advisor count includes tables belonging to other SIPS properties in the same project. Only the belt-platform subset is actionable: T22, T23, T25, T44. |
| `prcApply` reports success without saving | False positive. It calls `_prcSaveAccess(...)`. |
| `prcEnterAssessorPin` reports success without saving | False positive. The toast fires inside the success callback of `showAssessorPinGate`. |
| `archiveHospitalSystem` reports success without saving | False positive. It awaits `SB.updateHospitalSystem`; the detection missed the `(window.SB \|\| SB).` form. |
| `downloadCSVTemplate`, `downloadScheduleCSVTemplate` | False positives. They generate a file download; there is nothing to persist. |
| `foundations.js:851` observation confirm does not persist | False positive. The enclosing function calls `_fndSaveProgress(p)` before returning. |
| `autoAssignZones` reports success without saving | True but not a defect. It fills the form controls and the user then saves the shift. At most the wording could be clearer. Not scheduled. |
| Staff can escalate their own role | Overstated. `get_user_role()` reads `sbd_portal_users`, not `staff.role`, so writing `staff.role` grants nothing. The real and narrower issue is T24, training-record integrity. |
| The review backlog is 24 decisions | Wrong reading of the same data. It is roughly 3 decisions plus duplicates, test accounts and orphans. Now T29 and T31. |
| `staff_history`, `sbd_email_queue`, `sbd_password_resets` and similar are exposed | Checked and safe. RLS is on with no policy, so they are unreachable over the data interface and only the service role can read them. |
| The oldest waiting review is six days old | Wrong. It is 8 May, 78 days. This went out in the 2026-07-24 report and has been corrected to the client in writing. |

---

*Verification method: policy and grant tables read directly, Supabase security advisors,
live row counts, and a static sweep of `src/js/*.js` and `index.html` covering both
function bodies and inline event handlers.*
