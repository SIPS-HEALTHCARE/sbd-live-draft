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

**6. Every open task carries a Goal and a Done when.** The goal states what is true once
the work is finished. The "done when" states the check that proves it. Without both, "done"
becomes a judgement call, and rule 5 needs something concrete to test against.

**7. Nothing here is executed without a go-ahead.** Unticked items are a plan.

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

- [x] ~~**T22** Lock down `placement_reviews` (issue `S1`)~~
  `done 2026-07-26` · est 1.0d · **High**
  Policy `pr_all_all` is `FOR ALL USING (true) WITH CHECK (true)` to `authenticated`, over
  49 live rows. Any signed-in user at any facility can read and modify every placement
  review. Replace with facility-scoped read plus master and assessor write.
  *Pass 1 gate:* read the new policy back from `pg_policy` and test one read and one write
  per role.
  *Goal:* No user can see or change a placement review outside their own facility, and only master admins and granted assessors can change one at all.
  *Done when:* `pg_policy` shows the new policy and `pr_all_all` is gone; a staff_member token reads only their facility and is refused a write; a master admin write succeeds; all 49 existing rows still readable by the right people.
  *Status 2026-07-26:* policy applied and measured. staff_member went from 49 rows readable and 49 writable to 1 readable and 0 writable; a facility leader sees only their own facility; a master admin still reads all 49 and writes all 49; a candidate can still insert their own row but not one for anyone else. Pass 2 found the protection could be walked around via T53, so this stayed open until T53 was closed on the same day. Re-measured afterwards: a staff member sees 1 row.
- [x] ~~**T23** Lock down `sbd_assessment_queue` (issue `S2`)~~
  `done 2026-07-26` · est 0.75d · **High**
  UPDATE is gated only on `auth.role() = 'authenticated'` and SELECT is `USING (true)`,
  over 56 live rows. A candidate can approve their own belt gate request. Restrict status
  changes to master admin and granted assessors; keep candidate self-insert.
  *Goal:* A candidate can raise a belt gate request but cannot decide it. Only master admins and granted assessors change status.
  *Done when:* A candidate token can INSERT but its UPDATE is refused; a master admin UPDATE succeeds; the 56 existing rows are untouched; policy read back from `pg_policy`.
  *Status 2026-07-26:* the three old policies were not checks at all. `auth.role()` returns
  `authenticated` for every signed-in user, so "Allow authenticated update" let anyone set
  any request to approved. Replaced with four policies: candidate self-insert and self-read,
  SIPS admins and granted assessors decide, facility leaders read their own facility, master
  admin deletes. Assessors were included on update because all four `resolveAssessmentQueue`
  call sites sit beside `SB.recordAssessment`, which is an assessor closing out a gate.
  *Measured, every probe rolled back:* candidate sees 15 of 56 rather than all of them and
  approves 0; a facility leader sees 12 and approves 0; an assessor and a master admin see
  and decide all. Raising a request still works.
  *Pass 2 caught a hole in the first version of this fix.* The insert policy checked whose
  row it was but not what it said, so a candidate could insert a row already marked
  `approved` and skip approval entirely. Pinned candidate self-inserts to `status = 'pending'`
  and re-probed: inserting an already-approved row is refused, raising a request for someone
  else is refused, approving one's own request affects 0 rows, and both normal submit paths
  still work including the one that omits status. Data re-read afterwards: 56 rows, 20
  pending, 7 approved, nothing created.
- [x] ~~**T24** Restrict the `staff` UPDATE column grant (issue `S3`)~~
  `done 2026-07-26` · est 0.5d · **High**
  `authenticated` holds UPDATE on every column and `staff_update` permits
  `staff_member AND id = auth.uid()`, so a staff member can set their own `belt`, `stars`,
  `assessment_gate_override` and `window_override` by direct call.
  *Risk:* if an admin screen writes a restricted column through the staff-member path it
  will start failing. Check every write path before applying.
  *Goal:* A staff member can no longer set their own belt, stars or gate overrides from outside the app.
  *Done when:* `information_schema.column_privileges` shows the restricted columns no longer granted on the staff-member path; every admin screen that writes to `staff` still saves; a direct write to `belt` as a staff_member is refused.
  *Status 2026-07-26:* solved with a `BEFORE UPDATE` trigger, not a column revoke, and the
  full write audit is why. A revoke applies to `authenticated`, which is every signed-in
  user, so it would have broken the administrator writes **and the candidate**: the staff
  Position School view writes through `mapStaffPSToBackend`, which carries `stars`, so
  revoking `stars` would have stopped candidates starting a track at all. Those paths write
  `stars` with its existing value and never change it; only `completePSTrack` changes it,
  and that is a leader control. A trigger comparing old to new therefore lets the candidate
  through and stops the escalation.
  *Measured, every probe rolled back:* setting own belt to Black, self-granting 9 stars, a
  gate override, a window override, passing own gates, and making self an observer are all
  refused. An update that leaves `fid` and `role` unchanged still passes, so the rule is not
  over-strict. Still working: submitOIP, savePracticeScore, saveSbdBackground, placement
  submit, and beginPSTrack carrying stars unchanged, plus master admin full writes and
  service-role writes from `sbd-record-assessment`. Data re-read afterwards: 63 staff rows,
  none touched, 0 black belts, 0 stars, 0 gate overrides.
  *Note:* the probe first flagged `acknowledgePlacement` as broken. That was my own false
  alarm, not the trigger: the column it writes does not exist. Recorded separately as T54.
- [x] ~~**T25** Scope `facility_shifts` (issue `S5`)~~
  `done 2026-07-26` · est 0.25d · Medium
  Carries `FOR ALL USING (true) WITH CHECK (true)`. Empty today, but the feature that
  fills it shipped on 2026-07-24, so this is cheapest right now.
  *Goal:* Shift definitions are readable and writable only within the facility they belong to.
  *Done when:* Policy read back from `pg_policy`; a leader at one facility cannot read or write another facility's shift definitions; the shift manager still saves.
  *Status 2026-07-26:* read deliberately left open to **any signed-in user at that facility**,
  not leaders only. The staff schedule renders a shift label against each assigned block and
  that label comes out of this table, so a leaders-only read would leave staff looking at
  unlabelled shifts. Writes are SIPS admins anywhere, facility leaders on their own facility.
  `fid` is uuid here so the comparison against `sbd_get_user_facility()` casts to text.
  *Measured, every probe rolled back, two probe shifts seeded at two different facilities:*
  staff at facility A reads 1 of 2, edits 0, is refused creating one. Leader at facility A
  reads 1 of 2, edits their own, affects 0 rows on the other facility's, is refused creating
  one there, deletes 0 there, and creating one at their own facility works. Leader at facility
  B reads 1 of 2, the other one. Master admin reads all and edits any. Data re-read
  afterwards: 0 rows, nothing created.
  - [x] ~~**T25a** Scope `free_agents` (issue `S4`)~~
    `done 2026-07-26` · est 0.25d · Medium
    Same policy shape, 12 live rows. Shares the migration with T25.
    *Goal:* The free agent pool is readable and writable only by the roles that manage it.
    *Done when:* Policy read back; the 12 existing rows still load in the free agent view; a staff_member token is refused a write.
    *Status 2026-07-26:* tightened harder than T25 because the rows are more sensitive. Each
    one holds a departed person's name, belt, star count, release reason, release notes and
    their whole OIP blob, and it was readable by all 66 non-SIPS accounts. Now SIPS admins
    only, with no browser INSERT policy at all: `purgeFreeAgent` exists at
    `api-supabase.js:345` but is never called, and the real release and assign paths run
    through the `sbd-release-to-free-agent` and `sbd-assign-free-agent` edge functions on the
    service role, which bypasses RLS. Every `DB.freeAgents` consumer is an admin portal screen.
    *Measured:* staff and facility leader both read 0 of 12 and change 0 rows; master admin
    reads all 12 and writes all 12. Data re-read afterwards: 12 rows, no notes altered.
    *Known effect:* `getFreeAgents()` runs during hydration for every signed-in user, so staff
    and leaders now receive an empty list instead of 12 rows. That is a filtered read, not an
    error, and nothing on their screens consumes it.
- [ ] **T26** Make Publish to Staff actually publish (issue `B1`) · est 1.0d · **High**
  The button's entire handler is
  `closeModal();toast('Schedule published. Staff can now view their shifts.','ok')`.
  It changes nothing. `sbd_schedule` already has a `published_by` column, so this is an
  unfinished feature. Set `published_by` and surface the published schedule in the staff
  portal.
  *Note:* larger than it looks. It implies deciding what staff see before publication,
  which is a product decision as much as a code change.
  *Goal:* A manager who presses Publish actually publishes, and staff see the published schedule. The button never again claims something it did not do.
  *Done when:* `published_by` is set on the affected `sbd_schedule` rows after pressing Publish; a staff account sees the shifts; nothing is visible to staff before Publish is pressed.
- [ ] **T27** Persist attendance edits (issue `B2`) · est 0.5d · **High**
  `markAttend`, `markAllAttend` and `assignCoverage` persist only when creating a record.
  On an existing record they mutate local state and return. `SB.updateAttendance` is
  defined at `api-supabase.js:374` and called from nowhere. First mark saves; every
  correction after it is lost on reload.
  *Goal:* Correcting somebody's attendance sticks. Present changed to absent survives a reload.
  *Done when:* Mark a person present, change to absent, reload, and the record still reads absent; the same for the mark-all and coverage paths; `SB.updateAttendance` appears in the call path.
- [ ] **T28** Persist quick-fill schedule overwrites (issue `B3`) · est 0.25d · Medium
  `ui-views.js:10259`. New rows save, but for a date and shift that already exists only
  local state changes, while the toast reports the full count as assigned.
  *Goal:* Quick-fill writes every shift it claims to have filled, including days that already had a row.
  *Done when:* Run quick-fill over a range that includes an already-populated day, reload, and every day matches what the toast reported.
  - [ ] **T28a** Persist CSV import overwrites (issue `B4`) · est 0.25d · Medium
    `ui-views.js:17596`. Same shape as T28 and shares the fix.
    *Goal:* CSV import writes every assignment it claims to have imported, including days that already had a row.
    *Done when:* Import a CSV that overlaps existing days, reload, and the schedule matches the file.
- [ ] **T29** Collapse duplicate gate requests (issue `D1`) · est 0.75d · **High**
  One open request per person, per belt, per gate. A repeat refreshes the existing row
  instead of adding another. This alone removes 14 of the 24 queue rows.
  *Goal:* The review queue shows one row per real decision. Re-submitting the same request refreshes it rather than stacking another row.
  *Done when:* Submitting a repeat for the same person, belt and gate produces no new row; the queue count drops from 24 to roughly 10 once the existing duplicates collapse.

### Phase 2: close the security tail and the committed client asks

- [ ] **T30** Read-only observation checklist view for facility leaders · est 1.0d
  **Already promised to the client in writing on 2026-07-25.** There is one checklist per
  belt shared platform-wide with no per-facility copy, so edit rights are not a permission
  toggle. Leaders get visibility; SIPS stays the only editor.
  *Goal:* A facility leader can read the checklist their people are scored against, and still cannot change it.
  *Done when:* A facility_admin sees the active checklist for each belt with no edit control; a write attempt is refused; SIPS editing is unchanged.
- [ ] **T31** Auto-close reviews with no real person behind them (issue `D2`) · est 0.5d
  Two placement reviews point at `staff_id` values with no staff row and no login, sitting
  since 8 May and 10 June. Close the review and record why.
  *Rule, set by the client:* key on the account being switched off or the record being
  gone, **never** on Free Agent membership. `kbansil` and Jake are active test accounts in
  Free Agent. **No account is ever deleted.**
  *Goal:* The queue only ever shows items somebody can actually act on. Nothing sits there pointing at a person who is gone.
  *Done when:* The two orphan placement reviews leave the queue with a recorded reason; every account still exists afterwards, `kbansil` and Jake included; a Free Agent member with an active account keeps their pending items.
- [ ] **T32** Remove the cross-facility read leak (issue `S6`) · est 0.5d
  `sbd_schedule`, `sbd_attendance` and `sbd_promotions` each carry an `auth_read_all`
  SELECT policy `USING (true)`. Writes on all three are correctly scoped; reads are not.
  *Goal:* Schedule, attendance and promotion records are readable only within the facility they belong to.
  *Done when:* The `auth_read_all` policies are gone from all three tables; a leader at one facility cannot read another facility's rows; existing screens still load.
- [ ] **T33** Security review tail (issue `S13`) · est 1.5d · **committed for Wed 29 July**
  Admin multi-factor sign-in, a written data retention policy, per-role restrictions on
  the data interface.
  *Goal:* The compliance one-pager can be signed off without an open item against it.
  *Done when:* Multi-factor is enforced on admin sign-in; the retention policy is written and stored; per-role interface restrictions are applied and read back.
- [ ] **T34** Review the `SECURITY DEFINER` execute grants (issue `S11`) · est 1.0d
  55 such functions are executable by `authenticated` and 53 by `anon`. None has been
  reviewed for whether that grant is intended. Revoke the ones that are not.
  *Goal:* Every function reachable by a signed-in or anonymous caller is reachable on purpose.
  *Done when:* Each of the 108 grants is either kept with a recorded reason or revoked; the advisor count drops; the app still works end to end after the revocations.
- [ ] **T35** Profile redesign to the client's supplied layout · est 1.0d
  Two-column bio card, avatar panel, labelled field pairs, badges, tags, availability
  pill. The SBD years values move into a proper card instead of the small meta line.
  Example received 2026-07-26. Shawn confirmed on 2026-07-26 that it applies to **both**
  the staff profile and My Profile, so the layout is built once as a shared component and
  used in both places rather than written twice.
  *Applies to:* `renderHProfile` (the staff record an admin or leader opens from the
  roster).
  *Goal:* The staff profile reads like the layout the client sent, and the SBD years are
  legible rather than buried in the meta line.
  *Done when:* The two-column bio card, avatar panel, badges, tags and availability pill
  render on a staff profile; the years values sit in their own card; the client confirms it
  matches.
  - [ ] **T35a** Same layout on My Profile · est 0.5d
    `renderSOIP` is currently the Operator Intelligence Profile assessment screen rather
    than a profile page, so this means giving My Profile a real bio section built from the
    shared component, with the assessment result becoming one part of it instead of the
    whole page.
    *Goal:* A staff member opening My Profile sees their own details in the same layout an
    admin sees, not an assessment intro.
    *Done when:* My Profile renders the shared bio card for the signed-in person, the
    operator assessment still starts and displays from within it, and the SBD Background
    editor added in T21 still saves.
  - [ ] **T35b** Give administrators a profile page at all · est 0.5d
    Found 2026-07-26 while checking the above: an administrator has no profile screen.
    Clicking their own name in the sidebar footer lands on Account and Settings, which is a
    form (display name, title, initials, read-only email, password, session info), not a
    profile. So the client's design currently has nowhere to live for an admin account.
    Decide whether the name click should open a profile with Settings reachable from it, or
    whether administrators simply keep Settings and no profile.
    *Goal:* Clicking your own name takes you somewhere that matches what the platform calls
    a profile, whatever role you hold.
    *Done when:* An administrator clicking their name reaches a profile in the shared
    layout, and Account and Settings is still reachable in one step from there.
  *Goal:* The profile reads like the layout the client sent, and the SBD years are legible rather than buried.
  *Done when:* The two-column bio card, avatar panel, badges, tags and availability pill render; the years values sit in their own card; the client confirms it matches.
- [ ] **T36** Reorganise the staff sidebar into sections, matching the admin panel · est 1.0d
  Requested 2026-07-26.
  *Goal:* A staff member finds things in the sidebar as quickly as an admin does.
  *Done when:* Staff sidebar entries are grouped into sections mirroring the admin panel; every existing view is still reachable; tour steps still resolve.
- [ ] **T37** Move the observer PIN check server side (issue `S12`) · est 0.5d
  `ovsUnlock` compares the observer PIN client side against `DB.staff`. Observation writes
  are separately gated server side, so this is an identity-of-observer weakness rather
  than an authorisation hole.
  *Goal:* Who observed an assessment is decided by the server, not by the browser.
  *Done when:* The PIN comparison happens server side; a forged client-side unlock does not produce a valid observation; the normal observer flow is unchanged.
- [ ] **T38** Consolidate Avery onto the work account (issue `D3`) · est 0.25d
  Client confirmed: SIPS employee, home office, no facility, work address is the real
  account. Move the training history across and close the personal login.
  *Gate:* production write. Needs an explicit go on the day.
  *Goal:* There is one Avery on the platform, on the work account, with the training history intact.
  *Done when:* The training record resolves under the work account; the personal login no longer signs in; no observation or queue history is lost; the account is closed rather than deleted.

### Phase 3: remaining scope, can run alongside other projects

- [ ] **T39** "See As": open any person's account and see their dashboard as they see it · est 2.5d
  Read only and fully audited. **Do not implement by flipping the role client side**; that
  is the exact pattern being removed everywhere else. A master admin recording an
  observation while signed in as an assessor would stamp the assessor's name on the record
  and undo the audit trail built between 22 and 24 July.
  *Blocked on:* the client's answer, read only versus login as.
  *Goal:* A SIPS admin can look at any person's dashboard exactly as that person sees it, cannot change anything while doing so, and every use is recorded.
  *Done when:* Viewing another account renders their view; every write attempt while viewing is refused server side; each use appears in the audit log with who looked at whom and when.
- [ ] **T40** Foundations and Instruments status, dates and assessor notes into all three report levels · est 1.5d
  Design already locked.
  *Goal:* Foundations and Instruments progress is visible in the reports leaders actually read.
  *Done when:* Status, dates and assessor notes appear at facility, network and personal report level and match the underlying records.
- [ ] **T41** Guided tour parity · est 1.0d
  Every view shipped since June is missing from the tour. Tour parity is meant to be part
  of shipping a view, so this is catch-up debt.
  *Goal:* The guided tour covers the platform as it is today, for every role.
  *Done when:* Every sidebar `data-view` in `index.html` has a matching tour step for each role that can see it.
- [ ] **T42** Role Management portal-routing parity · est 1.0d
  A granted user should see the elevated tools in the app, not only the badge.
  *Goal:* A granted capability shows up as working tools in the app, not just a badge in Role Management.
  *Done when:* A user granted a capability sees and can use the matching tools without a re-grant or a sign-out.
- [ ] **T43** Voice dictation for typed answers and David · est 1.5d
  *Goal:* Anywhere a person types a long answer they can speak it instead.
  *Done when:* Dictation works in assessment writing and in David; the privacy claim about where audio goes is verified before it ships.
- [ ] **T44** Lock or drop the five unused legacy tables (issue `S7`) · est 0.5d
  `assessment_queue`, `assessment_history`, `promotion_approvals`, `attendance`,
  `schedule`. All empty, all unreferenced by application code, all writable by any signed
  in user.
  *Goal:* No table exists that is writable by anyone and used by nobody.
  *Done when:* The five legacy tables are locked or dropped; the application is confirmed not to reference them; nothing breaks after the change.
- [ ] **T45** Remove `SECURITY DEFINER` from the `david_analytics_summary` view (issue `S8`) · est 0.25d
  The only ERROR-level item the advisor reports.
  *Goal:* The advisor reports no ERROR-level item.
  *Done when:* `david_analytics_summary` no longer carries SECURITY DEFINER; the advisor ERROR count is zero; the views that read it still work.
  - [ ] **T45a** Enable leaked-password protection in Auth (issue `S9`) · est 0.1d
    A single setting. Checks sign-ups against known breached passwords.
    *Goal:* A known-breached password cannot be set on the platform.
    *Done when:* The setting is on and a known-breached password is refused at sign-up.
  - [ ] **T45b** Fix the mutable `search_path` on 35 functions (issue `S10`) · est 0.25d
    Hardening. No behaviour change expected.
    *Goal:* No function resolves objects through a caller-controlled path.
    *Done when:* All 35 functions carry a fixed `search_path` and the advisor no longer flags them.
- [ ] **T46** David usage cost detail, cached versus new · est 0.5d
  *Goal:* Usage cost can be read accurately enough to bill and forecast against.
  *Done when:* Cached and new token counts are reported separately and reconcile with the provider's numbers.
- [ ] **T47** App packaging options document, web versus installed · est 0.5d
  *Goal:* The client can make the web versus installed app decision from a written comparison rather than a conversation.
  *Done when:* The document covers the options, the cost of each, and a recommendation, and is handed over.
- [ ] **T48** Arm the David chat protection · est 0.25d
  *Blocked on:* the client's answer, alert only versus auto-limit.
  *Goal:* Runaway David usage is caught before it becomes a bill.
  *Done when:* The threshold is set from real usage, the chosen policy is applied, and a synthetic spike triggers it while normal usage does not.

### Found during Phase 1

- [x] ~~**T53** Stop users from editing their own role and capabilities~~
  `done 2026-07-26` · est 0.5d · **Critical**
  `sbd_portal_users` carries `authenticated_update_own_profile`, which is
  `FOR UPDATE USING (auth_uid = auth.uid()) WITH CHECK (auth_uid = auth.uid())` with no
  column restriction, and `authenticated` holds UPDATE on every column of that table
  including `role` and `capabilities`.
  A staff member can therefore run one update against their own row, set
  `role = 'master_admin'`, and every access rule on the platform that reads
  `sbd_get_user_role()`, `sbd_is_master_admin()` or `sbd_is_assessor()` then treats them as
  an administrator. Reproduced end to end on 2026-07-26 inside a transaction that was
  rolled back: after self-promotion the account read all 49 placement reviews and could
  write all 49, and self-granting the assessor capability made `sbd_is_assessor()` return
  true.
  This sits underneath T22, T23, T24 and T32, and underneath the observation write lockdown
  already shipped as T9 and T18. Those controls are correct but cannot hold while this is
  open, so this is the first thing to fix in Phase 1 despite being numbered last.
  *Goal:* A user can maintain their own profile details and cannot change what they are
  allowed to do. Role, capabilities, facility assignment and active state move only through
  an administrator.
  *Done when:* A staff_member token updating its own `role` is refused; the same for
  `capabilities`, `facility_id`, `assigned_facility_ids` and `active`; ordinary profile
  self-edits that the app performs today still succeed; the escalation probe that worked on
  2026-07-26 no longer reaches administrator state.
  *Fixed by:* a `BEFORE UPDATE` trigger rather than a column grant. A column-level revoke
  applies to the `authenticated` role, which is every signed-in user including master
  admins, so it would also have broken the admin screen that changes a person's portal
  access and could not tell an edge function from a candidate. RLS cannot express it
  either: an update policy sees the old row in `USING` and the new row in `WITH CHECK` but
  cannot compare them, and column immutability is exactly that comparison.
  *Measured 2026-07-26, every probe rolled back:* self-promote to master_admin refused
  (42501); self-grant of the assessor capability refused; moving one's own facility
  refused; role after all three attacks still `staff_member`; placement_reviews visible to
  that account 1, not 49. Still working: the self-service profile editor (name, initials,
  title) 1 row updated; a master admin editing another user allowed; the service role
  changing account state allowed, so registration approval and activate/deactivate are
  intact. Bypass attempts also closed: deleting one's own profile row affects 0 rows,
  inserting a new master_admin row is refused, and `sbd_set_user_capabilities` refuses a
  self-grant. Role and capability counts re-read afterwards and unchanged.

- [ ] **T54** Placement acknowledgement does not follow the person to another device · est 0.25d · Low
  Found 2026-07-26 while auditing the `staff` write paths for T24. `acknowledgePlacement`
  (`ui-views.js:7153`) writes `placement_acknowledged: true` to the `staff` table, and that
  column does not exist. The request has always failed and is swallowed by a deliberately
  silent catch, with the code comment "no console warnings if column doesn't exist yet".
  It is not as bad as it first looks: the same function also writes to `localStorage`, so
  the acknowledgement holds on the browser where it was given. It is lost on another device,
  another browser, or after the browser is cleared, and it is invisible to any report.
  *Goal:* Acknowledging a placement is recorded against the person, not against one browser.
  *Done when:* The column exists, the acknowledgement survives signing in on a different
  device, and anyone already acknowledged in `localStorage` is not asked to do it again.

### Blocked, not on the critical path

- [ ] **T49** Strip and rotate the PSOP credentials, gate the public page
  *Blocked on:* the client.
  *Goal:* The PSOP page carries no credentials in its source and is not reachable by anyone who should not see it.
  *Done when:* The credentials are gone from the file, the old ones are rotated, and the public page is gated. Rotation confirmed by the client.
- [ ] **T50** David inside PSOP
  *Blocked on:* T49.
  *Goal:* The SOP tool runs the same David as the belt platform, with usage attributed separately.
  *Done when:* David answers inside PSOP and its usage appears under the SOP tool column, not mixed into the belt platform's.
- [ ] **T51** Black Belt observation checklist content
  *Blocked on:* Dr. Jake.
  *Goal:* The Black Belt observation instrument has real items in it instead of being an empty shell.
  *Done when:* The checklist content is received from Dr. Jake, loaded, and a Black Belt observation can be scored end to end.
- [ ] **T52** Old audio note from 2026-05-29
  *Blocked on:* the file being re-sent.
  *Goal:* Whatever was recorded in that note is captured in writing and acted on or closed.
  *Done when:* The file is re-sent, transcribed, and the contents are either turned into ledger items or recorded as nothing actionable.

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
