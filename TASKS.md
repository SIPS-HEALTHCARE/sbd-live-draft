# SBD Belt Platform: Task Ledger

**Living document.** This is the single record of what has been built and what is left.
It is not regenerated. It is edited in place.

**Last updated:** 2026-07-27
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

**Closed 2026-07-26 and 27, except for four items waiting on a browser check.** It started as
T22 to T29 and grew while it was being worked: T53, T54, T55, T56, T57, T58, T60, T61 and T62
were all found inside it. Three of those, T53, T55 and T60, mattered more than anything on
the original list. Every database change here was applied, then probed per role inside a
transaction that was aborted, then the affected tables were re-read to confirm nothing
persisted.

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
  *Blocked on T55, found 2026-07-26 on opening this task.* `sbd_schedule` holds 0 rows and
  has never accepted a write, so there is nothing to mark published. T55 has to land first.
  *Code written 2026-07-26, box stays open until it is clicked through.* `publishSchedule`
  replaces the toast-only handler and stamps `published_by` on every filled, unpublished
  shift in the 30-day window. `getStaffSchedule` now returns only published rows, and it is
  the single definition of "my schedule", so leader and admin views still see everything.
  New shifts are created with `publishedBy: null`; previously they were stamped with the
  author's id at creation, which would have made every shift look published the moment the
  write started working. The modal now shows To Publish, Already Live and Unscheduled, and
  the button is disabled with "Nothing to Publish" when there is nothing pending.
  *Proven at the database level, rolled back:* staff sees 0 shifts before publish and 1
  after. Not yet clicked through in a browser, which is why this is not ticked.
  *Note:* larger than it looks. It implies deciding what staff see before publication,
  which is a product decision as much as a code change.
  *Goal:* A manager who presses Publish actually publishes, and staff see the published schedule. The button never again claims something it did not do.
  *Done when:* `published_by` is set on the affected `sbd_schedule` rows after pressing Publish; a staff account sees the shifts; nothing is visible to staff before Publish is pressed.
- [ ] **T27** Persist attendance edits (issue `B2`) · est 0.5d · **High**
  `markAttend`, `markAllAttend` and `assignCoverage` persist only when creating a record.
  On an existing record they mutate local state and return. `SB.updateAttendance` is
  defined at `api-supabase.js:374` and called from nowhere. First mark saves; every
  correction after it is lost on reload.
  *Corrected 2026-07-26 by T55:* "first mark saves" was wrong. `sbd_attendance` holds 0 rows
  and the mapper sends three columns that do not exist plus a uuid into an integer column, so
  the first mark never saved either. T55 has to land first.
  *Code written 2026-07-26, box stays open until it is clicked through.* All three paths
  (`markAttend`, `markAllAttend`, `assignCoverage`) now call `SB.updateAttendance` on an
  existing record instead of mutating local state and returning.
  A fourth fault turned up in `assignCoverage`: it ran `parseInt` on the selected staff id.
  Staff ids are uuids, so that produced NaN, the lookup never matched, and the toast named
  nobody. Now it uses the value as given.
  *Proven at the database level, rolled back:* mark present then correct to absent updates
  1 row as the leader. Not yet clicked through in a browser.
  *Goal:* Correcting somebody's attendance sticks. Present changed to absent survives a reload.
  *Done when:* Mark a person present, change to absent, reload, and the record still reads absent; the same for the mark-all and coverage paths; `SB.updateAttendance` appears in the call path.
- [ ] **T28** Persist quick-fill schedule overwrites (issue `B3`) · est 0.25d · Medium
  `ui-views.js:10259`. New rows save, but for a date and shift that already exists only
  local state changes, while the toast reports the full count as assigned.
  *Corrected 2026-07-26 by T55:* "new rows save" was wrong. No schedule row has ever saved.
  The overwrite path is still a separate bug on top, but it cannot be tested until T55 lands.
  *Code written 2026-07-26, box stays open until it is clicked through.* Quick fill and CSV
  import both call `SB.updateSchedule` on a day that already has a row, so the toast count
  and what is stored finally agree. The silent catches on both paths were replaced with
  `handleSyncError`, so a rejected write now says so instead of vanishing. That swallowing
  is what let this sit unnoticed.
  *Proven at the database level, rolled back:* overwriting an existing day updates 1 row as
  the leader. Not yet clicked through in a browser.
  *Goal:* Quick-fill writes every shift it claims to have filled, including days that already had a row.
  *Done when:* Run quick-fill over a range that includes an already-populated day, reload, and every day matches what the toast reported.
  - [ ] **T28a** Persist CSV import overwrites (issue `B4`) · est 0.25d · Medium
    `ui-views.js:17596`. Same shape as T28 and shares the fix.
    *Goal:* CSV import writes every assignment it claims to have imported, including days that already had a row.
    *Done when:* Import a CSV that overlaps existing days, reload, and the schedule matches the file.
- [x] ~~**T29** Collapse duplicate gate requests (issue `D1`)~~
  `done 2026-07-27` · est 0.75d · **High**
  One open request per person, per belt, per gate. A repeat refreshes the existing row
  instead of adding another.
  *Goal:* The review queue shows one row per real decision. Re-submitting the same request refreshes it rather than stacking another row.
  *Done when:* Submitting a repeat for the same person, belt and gate produces no new row; the queue count drops once the existing duplicates collapse.
  *Correction:* the earlier note said 14 of 24 rows. Measured, it was **27 open rows standing
  for 6 real decisions**. The worst case was Jody Mays with 11 pending copies of the same
  Yellow Competency request, first asked 25 June and re-asked until 16 July.
  *Cause:* `submitApply` inserted with no duplicate check at all. The other submit path, in
  the study view, did check, but only against the copy of the queue held in the browser, so
  it could not see a row that RLS filtered out or that another device created.
  *Fixed in the database, not just the browser:* a partial unique index on
  (staff_id, target_belt, assessment_type) where status is pending. The browser check was
  added to `submitApply` as well, so the candidate gets told plainly instead of meeting a
  database error, but the index is what actually holds.
  *Result:* 27 open rows to 8. 19 marked `superseded`, nothing deleted, so how often somebody
  asked is still on the record. Eleven requests in three weeks says something about that
  person's experience of the feature and is worth keeping.
  *Stopped short on purpose:* two people hold an `approved` row and a `pending` row for the
  same belt and gate at once. Jake Jacobs on Yellow Competency, and Jody Mays whose approval
  on 15 July is straddled by pending requests from 25 June to 16 July. Whether a request
  raised after an approval is a duplicate or a genuine second attempt is a question about how
  the programme works, not a data-cleaning question, so those pairs were left standing rather
  than guessed at.
  - [x] ~~**T29a** Close the two approved-beside-pending pairs~~
    `done 2026-07-27`
    Both answered, each for a different reason, so they were handled separately rather than
    by one rule.
    *Jake Jacobs, Yellow Competency:* Jake sits on the Free Agent facility and the client has
    already identified him as an active test account, the same fact T31 was written around.
    Test traffic, not a question about the programme. Shawn spotted this.
    *Jody Mays, Yellow Competency:* Boston Children's, Shift Supervisor, a real candidate.
    Her approval on 15 July was never acted on: `resolved_at` is null and her belt is still
    White. The request she raised on 16 July is therefore the same person asking again
    because nothing moved, not a second attempt at a gate she had already sat, so it
    collapses like any other repeat.
    *Nothing is hidden by this.* The admin queue screen buckets `status = 'approved'` into
    `adminQueue`, so Jody's approved Competency stays visible and actionable. Checked in the
    view before writing the migration rather than assumed.
    *Result:* 8 open rows to 6, one per real decision, which is what the T29 goal asked for.

- [x] ~~**T61** A real candidate has been waiting 12 days on an approved assessment~~
  `closed 2026-07-27 by the client` · est 0.25d
  *Ignacio answered directly:* "Jody is good... no worries there". So the 14 day and 12 day
  waits were not a service failure, and no chasing is needed. Closed as answered rather than
  as fixed, because nothing was changed.
  *Kept on the record anyway:* the finding was still worth raising. It was only visible
  because T29 collapsed eleven copies of the same request; before that the queue was noise.
  The software half of it stands and moves to T64: the review reminder covers pending
  requests and not approved-but-unactioned ones, so if a real one does stall, nothing says so.
  Found 2026-07-27 underneath the T29a duplicate. The duplicate was the symptom; this is the
  thing worth acting on.
  Jody Mays at Boston Children's, Shift Supervisor, still on White belt:

  | Request | Status | Asked | Days open |
  |---|---|---|---|
  | Yellow Simulation | pending | 13 Jul | 14 |
  | Yellow Competency | approved | 15 Jul | 12 |

  She asked repeatedly through late June and July, was approved on 15 July, and no assessment
  has followed. The eleven duplicate requests T29 collapsed were her asking again and again
  because nothing was happening. Shandolyn Harris and Jake Jacobs are at 5 days, which is
  ordinary; Jody is not.
  *This is a service question before it is a software one.* The queue now shows it clearly,
  which it did not while eleven copies of the same request were burying it.
  *Goal:* Nobody waits weeks on an approved assessment without somebody noticing.
  *Done when:* Jody's two Yellow gates are scheduled or explicitly deferred with a reason,
  and the review reminder covers approved-but-unactioned requests and not only pending ones.

### Phase 2: close the security tail and the committed client asks

- [ ] **T30** Read-only observation checklist view for facility leaders · est 1.0d
  **Already promised to the client in writing on 2026-07-25.** There is one checklist per
  belt shared platform-wide with no per-facility copy, so edit rights are not a permission
  toggle. Leaders get visibility; SIPS stays the only editor.
  *Goal:* A facility leader can read the checklist their people are scored against, and still cannot change it.
  *Done when:* A facility_admin sees the active checklist for each belt with no edit control; a write attempt is refused; SIPS editing is unchanged.
- [x] ~~**T31** Auto-close reviews with no real person behind them (issue `D2`)~~
  `done 2026-07-27` · est 0.5d
  Two placement reviews point at `staff_id` values with no staff row and no login, sitting
  since 8 May and 10 June. Close the review and record why.
  *Rule, set by the client:* key on the account being switched off or the record being
  gone, **never** on Free Agent membership. `kbansil` and Jake are active test accounts in
  Free Agent. **No account is ever deleted.**
  *Goal:* The queue only ever shows items somebody can actually act on. Nothing sits there pointing at a person who is gone.
  *Done when:* The two orphan placement reviews leave the queue with a recorded reason; every account still exists afterwards, `kbansil` and Jake included; a Free Agent member with an active account keeps their pending items.
  *Done 2026-07-27.* Both were verified individually rather than matched by a pattern: no row
  in `staff`, and no row in `sbd_portal_users` by either `auth_uid` or `staff_id`. Closed as
  `closed_no_person`, not as denied or confirmed, because nobody judged the work; the subject
  stopped existing. The reason is written into `review_notes` on each row.
  *The client's rule was followed exactly.* This keys on the record being gone. Free Agent
  membership is not consulted anywhere in the change. No account was touched: the migration
  writes to `placement_reviews` and nothing else.
  *Measured:* pending 4 to 2. The two that remain are Jake Jacobs and Theresa Mills, both
  real people who still exist, and Jake is a Free Agent test account keeping his pending item,
  which is the case the rule was written to protect.
  *Left alone on purpose:* six further orphan reviews exist, already marked confirmed or
  adjusted. They are in nobody's queue, and rewriting closed history would serve nothing.
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
  - [x] ~~**T35c** Make the years line legible now, ahead of the full redesign~~
    `done 2026-07-27` · est 0.25d · **was committed to the client**
    Shawn told Ignacio on 2026-07-27, at 2:16 AM in the thread, "I will make it bigger in
    the meantime". That is a commitment and it comes before the rest of T35, which is a
    full day's work and needs the layout built properly.
    Today the values render three different ways and all three are small: `9983` puts
    `3y in SBD . 2y certified` into a `pmeta` chip in the profile meta row, `5646` writes
    `3 yr(s) in the SBD program` into the background card, and `5696` folds it into the
    report subtitle. The profile one is the one Ignacio is looking at.
    *Goal:* Somebody opening a profile can read the two year values without hunting for them.
    *Done when:* The years read clearly on the profile at phone and desktop width, the
    background card and the report still show them, and nothing shifts when both values are
    absent.
    *Built 2026-07-27.* The chip is gone from the meta row. The two values now render as a
    pair of cards under the belt badge, using the platform's existing `stat-card` styles
    rather than a bespoke look, so the full redesign in T35 replaces them cleanly instead of
    having to undo something one-off. Reusing that class also means they already scale on a
    phone the way every other figure on the platform does.
    *Logic verified across every input shape:* both values set renders both; one set renders
    the other as "Not set"; neither set renders nothing at all, so the many profiles with no
    values do not grow an empty block; **0 renders as 0** rather than being treated as
    missing, which matters for somebody in their first year.
    The background card and the report subtitle are untouched and still show the values.
    *Amended the same day, and the number is the reason.* 62 of the 63 staff records have
    neither value set, so hiding the cards when empty meant almost every profile would show
    nothing and look untouched. Worse, these fields are filled in by an administrator or a
    facility leader, and a field that renders nothing is a field nobody knows to fill, which
    is very likely why exactly one person has them.
    So a leader or an administrator now sees both cards on every profile, reading "Not set"
    where there is no value. A staff member looking at their own profile still sees them only
    once there is something to show: they cannot set these themselves, and an empty pair on
    their screen would be two boxes describing a gap they cannot close.
    *Re-tested across viewer and value:* master_admin, facility_admin and hospital all see
    both cards in every case, including two "Not set" when nothing is filled. staff_member and
    a signed-out render still hide the block when both values are absent, and still show it
    when either is present.
    *Signed off 2026-07-27.* Checked on the live site: the two cards render under the belt
    badge and read "Not set" where nothing has been entered.
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
- [x] ~~**T38** Consolidate Avery onto the work account (issue `D3`)~~
  `closed 2026-07-27, not needed` · est 0.25d
  Client confirmed: SIPS employee, home office, no facility, work address is the real
  account. The plan was to move the training history across and close the personal login.
  *Closed by Shawn's decision on 2026-07-27:* both accounts are genuinely in use, so there
  is nothing to consolidate. Two logins for one person is the intended state here, not a
  duplicate. No production write was made.

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
- [x] ~~**T44** Lock or drop the five unused legacy tables (issue `S7`)~~
  `done 2026-07-27` · est 0.5d
  `assessment_queue`, `assessment_history`, `promotion_approvals`, `attendance`,
  `schedule`. All empty, all unreferenced by application code, all writable by any signed
  in user.
  *Goal:* No table exists that is writable by anyone and used by nobody.
  *Done when:* The five legacy tables are locked or dropped; the application is confirmed not to reference them; nothing breaks after the change.
  *Dropped, not locked, and checked first because a drop does not come back.* Every one of
  the five: 0 rows, 0 incoming foreign keys, no view or function mentioning it, no browser
  call, no edge function. Their own keys only pointed outwards at `facilities` and `staff`.
  `restrict` rather than `cascade`, so an unexpected dependency would have failed the drop
  loudly instead of being taken along quietly. Verified afterwards: 0 of the five remain.
  The full column definitions are written into the migration so the shapes are recoverable
  from version control, not only from a backup.
  *T57 was a subset of this and is closed by the same migration.*
  *Worth recording:* the duplicate set was typed more correctly than the tables actually in
  use, `fid uuid` and `staff_id uuid` against `facility_id text` and `staff_id integer`,
  which is exactly the mismatch T55 had to repair. The application had been pointed at the
  weaker pair.
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

- [x] ~~**T55** The schedule, attendance and promotion tables have never been written to~~
  `done 2026-07-26` · est 1.0d · **High**
  Found 2026-07-26 while opening T26. The three tables behind Schedule, Attendance and
  Promotions hold **0 rows each**, and the reason is not that nobody used the feature. The
  data mappers in `api-supabase.js` do not match the tables they write to, so every write
  has been rejected by the database and the rejection swallowed by a silent catch.

  | What the code sends | What the table has | Result |
  |---|---|---|
  | `sbd_schedule.assigned_staff_ids` | column is `assigned_staff` | unknown column, insert rejected |
  | `sbd_schedule.id` = `"sch-3"` | column is `uuid` | invalid uuid, insert rejected |
  | `sbd_attendance.arrived_at`, `left_at`, `note` | none of the three exist | unknown column, insert rejected |
  | `sbd_attendance.staff_id` = a uuid | column is `integer` | type mismatch |
  | `sbd_promotions.staff_id` = a uuid | column is `integer` | type mismatch |

  `published_by` and `notes` on `sbd_schedule` and `points` on `sbd_attendance` are never
  mapped at all. Nothing here goes through an edge function, so there is no second path
  quietly making it work: `SB.createSchedule` posts the mapper output verbatim.

  There is also a duplicate set of tables, `schedule`, `attendance` and `promotion_approvals`,
  also empty, which use `fid uuid` and `staff_id uuid` and are closer to what the app means.
  The application talks to the `sbd_` prefixed set. Which set survives is part of the fix.

  *This reframes four ledger items.* T26, T27, T28 and T28a were each written as "this one
  path does not persist". They share one root cause and none of them can be verified until
  this is fixed, because there is no saved row to check against.

  *One thing it makes easier:* with every table empty there is no backfill and no migration
  risk. T26 can make unpublished schedules invisible to staff without stranding anybody,
  because there is no existing schedule to strand.

  *Goal:* A schedule, an attendance mark and a promotion request written in the app are still there after a reload, on any device.
  *Done when:* Creating one of each writes a real row; the row is read back into the app after a reload; a deliberate bad write surfaces an error to the user instead of being swallowed; and the duplicate table set is either adopted or dropped with the reason recorded.
  *Status 2026-07-26:* fixed in two migrations and three browser files. Probing found two
  more faults that reading the schema had missed, which is the only reason they were caught:
  `sbd_schedule.assigned_staff` was **integer[]**, so even a master admin could not write a
  schedule row; and neither `sbd_schedule` nor `sbd_attendance` granted INSERT or UPDATE to
  `hospital` or `facility_admin`, although the schedule builder and the attendance register
  are facility leader screens. Leaders now write their own facility, scoped the same way as
  T22 and T25. DELETE is deliberately not granted: clearing a shift is an update that empties
  the assignment, so nothing needs it and a mistake cannot erase who was scheduled.
  *Measured end to end, rolled back:* leader saves a shift, overwrites an existing day,
  marks present, corrects to absent (1 row each); saving at another facility is refused;
  deleting affects 0 rows. Staff sees 0 shifts before publish and 1 after, reads their own
  attendance, and editing the schedule affects 0 rows. Tables re-read afterwards: 0, 0, 0.
  *Left open on purpose:* the duplicate `schedule` / `attendance` / `promotion_approvals`
  tables were not touched. All three are empty and nothing reads them. Recorded as T57.
  *Also confirmed:* a leader at one facility can still read another facility's schedule.
  That is `auth_read_all` and it is T32, not a regression from this work.

- [ ] **T56** A promotion with no belt change cannot be stored · est 0.25d · Low
  Found 2026-07-26 while fixing T55. `sbd_promotions` requires `from_belt` and `to_belt` to
  be NOT NULL, but `mapPromotionApprovalToBackend` sends `to_belt: ap.proposedBelt || null`.
  A role promotion that does not move the person's belt therefore cannot be written. Not
  guessed at here because it is a question about what such a request means, not a typo.
  *Goal:* A promotion request that changes role but not belt can be raised and stored.
  *Done when:* The intended meaning is settled, the column is either made nullable or given
  a defined value, and a role-only promotion round-trips through a reload.

- [x] ~~**T57** Decide what happens to the duplicate table set~~
  `done 2026-07-27, closed by T44` · est 0.25d · Low
  Found 2026-07-26 during T55. `schedule`, `attendance` and `promotion_approvals` sit
  alongside the `sbd_` prefixed tables the application actually uses. All three are empty,
  nothing reads them, and their column types (`fid uuid`, `staff_id uuid`) are closer to
  what the app means than the ones that were in use. They were left untouched rather than
  dropped, because dropping a table is not something to do in passing.
  *Goal:* One set of tables, with the reason the other went recorded.
  *Done when:* The three are dropped after confirming nothing reads them, or kept with a
  written reason.
  *Checked 2026-07-27, at Shawn's request, before anything is dropped:* nothing references
  them. No foreign key points at any of the three; their own keys only point outwards at
  `facilities` and `staff`. No view, materialised view or function mentions them. No browser
  code calls `/rest/v1/schedule`, `/rest/v1/attendance` or `/rest/v1/promotion_approvals`,
  and no edge function touches them. All three are empty. So dropping them breaks no
  referential integrity and orphans nothing.

- [ ] **T58** A SIPS admin has no schedule or attendance screen at all · est 0.5d · Medium
  Found 2026-07-26 while trying to verify T26, T27 and T28 as a master admin. There is
  nowhere to do it from. The SIPS admin portal has no Schedule or Attendance nav item, and
  the facility drill-down offers Overview, Staff, Assessments, Intel & Focus and Reports
  and nothing else. The schedule builder and the attendance register exist only in the
  facility leader portal (`h-schedule`, `h-attendance`) and the system admin portal
  (`x-schedule`).

  Two consequences, both real today:

  * A master admin holds the write rights on `sbd_schedule` and `sbd_attendance` and has no
    screen to use them from. The rights and the interface disagree.
  * The only accounts that can reach a schedule are facility leaders at Alta Bates, Boston
    Children's and Mount Sinai, plus three system admin accounts that are all inactive. So
    the test facility, which is the safe place to try any of this, has no account that can
    open a schedule at all.

  *Goal:* Somebody at SIPS can see and manage a facility's schedule and attendance without borrowing a leader's login.
  *Done when:* A master admin can open a facility's schedule and attendance from the admin
  portal, scoped by the facility switcher already on that screen, and the write rights they
  already hold are reachable from the interface.

- [ ] **T59** Close out the test leader account when the schedule testing is done · est 0.1d · Medium
  Created 2026-07-26 so that T26, T27, T28 and T28a could be verified in the interface at
  all. There is no leader account at Test Hospital Facility and the SIPS admin portal has
  no schedule screen (T58), so there was no other way to press the buttons.
  `dev@thisisatest.com`, facility leader at Test Hospital Facility.
  It is a real production account and it should not be left lying around: stray accounts in
  this database have caused trouble before. The domain is not deliverable, so password
  recovery will never work on it, which is a second reason not to keep it.
  *Goal:* No account outlives the reason it was created.
  *Done when:* The four schedule tasks are verified and the account is deactivated, along
  with any schedule and attendance rows created purely for the test.

- [ ] **T60** Every signed-in account can read 96 people's passwords in the clear · est 0.5d · **Critical**
  Found 2026-07-26, by accident, while registering the test leader account for T59. This is
  the worst thing in the audit and it outranks everything else still open.

  `public.registrations` has a `password` column. 96 rows hold a value, none of them hashed:
  no `$2`, `$argon` or `$scrypt` prefix, and lengths run 6 to 20 characters, which is the
  shape of a typed password and not of any digest. The table then carries `reg_all_all`,
  `FOR ALL USING (true) WITH CHECK (true)` to `authenticated`, plus two more permissive
  policies on top.

  So every signed-in account on the platform, all 35 staff members included, can read the
  password of all 96 people who have ever registered. Those are real people at the client's
  facilities with real work email addresses, and password reuse across systems is the normal
  case, so the blast radius reaches well past this application.

  *Measured as an ordinary `staff_member`, every probe rolled back:*

  | Attempt | Result |
  |---|---|
  | read registration rows | 97 |
  | read stored passwords | 96, covering 96 distinct people |
  | approve a pending registration | 1 row |
  | delete a pending registration | 1 row |
  | overwrite other people's passwords | 12 rows |

  So it is not only a disclosure. A staff member can approve their own account request, and
  can rewrite or delete anybody's registration.

  *Why the column cannot simply be blanked:* `sbd-approve-registration` reads
  `regData.password` and uses it as the credential when it creates the auth user, so pending
  rows still need it until they are approved. Already-approved rows do not: the auth user
  exists and the copy here is pure residue.

  *Goal:* No password is ever stored where anything but the auth system can read it, and a candidate cannot approve their own account.
  *Done when:* The permissive policies are gone and registrations are readable and decidable
  only by the roles that review them; the password on every non-pending row is purged; the
  flow no longer parks a password in a table at all; and everyone whose password sat here is
  told to change it.

  *Step 1 of 3 applied 2026-07-27.* The three permissive policies are gone. Reading and
  deciding is SIPS admins only; deleting is master admin only; the anonymous submit policy
  is untouched, because without it nobody could request an account.
  *Measured, every probe rolled back:*

  | Who | Before | After |
  |---|---|---|
  | staff_member reads rows | 97 | **0** |
  | staff_member reads passwords | 96 | **0** |
  | staff_member approves a request | 1 row | **0** |
  | staff_member deletes a request | 1 row | **0** |
  | staff_member rewrites passwords | 12 rows | **0** |
  | facility leader reads rows | 97 | **0** |
  | master admin reads rows | 97 | 97 |
  | master admin presses Deny | works | 1 row |
  | anonymous submits a registration | works | ALLOWED |
  | anonymous reads rows | | 0 |

  Data re-read afterwards: 97 rows, 1 pending, 86 approved, 10 denied, no probe row left.
  Login was never in scope and never at risk: authentication runs against `auth.users`
  through `/auth/v1/token` and has no relationship to this table.

  *Step 2 of 3 applied 2026-07-27.* 95 stored passwords cleared: 85 approved and 10 denied.
  The single pending row keeps its password on purpose, because approving it is what turns
  that value into the auth credential; without it the account could not be created.
  A `BEFORE INSERT OR UPDATE` trigger now nulls the column the moment a row stops being
  pending, so the residue cannot build up again. That is safe against the approval path:
  `sbd-approve-registration` sets the status only after it has created the auth user, and it
  keeps the password in a local variable for the welcome email, so nothing it still needs is
  taken away.
  *Counts after:* approved 86 rows holding 0 passwords, denied 10 holding 0, pending 1
  holding 1.

  *Decision recorded 2026-07-27, Shawn's call:* nobody is being asked to change their
  password for now, and the client is not being told separately. Written down rather than
  left implicit, because the exposure was real while it lasted and this decision is the
  reason no notice went out. If it is ever revisited, the window is from whenever the table
  was created until 2026-07-27, and it covered every signed-in account.

  **Step 3 is still open and this is not closed until it lands.** The flow still parks a
  password in a table for as long as a request is pending, and nothing here can undo what
  may already have been read.

- [x] ~~**T62** In-app notice asking the affected people to change their password~~
  `done 2026-07-27` · est 0.5d · **High**
  Built 2026-07-27. Closes the part of T60 that no migration could: T60 shut the hole and
  cleared the stored copies, but neither undoes what was read while `registrations` was open
  to every signed-in account. Those people still hold that password, and many will have
  reused it elsewhere.

  **A notice, not an enforcement.** It never blocks a sign in, never expires a password and
  never forces a reset. Somebody who closes it carries on exactly as before. That is
  deliberate: the point is to give people the information, not to take their access away
  over something that was not their fault.

  *What they see, once the portal has painted:*

  > 🔒 Security update
  > As part of a security review we have tightened how account details are stored. Please
  > change your password.
  > If you use the same password on another system, change it there too.
  > [ Later ]  [ Change my password ]

  *Behaviour:* **Change my password** opens Settings and puts the cursor in the password
  field. **Later** and the close cross both dismiss for that session only, so it returns at
  the next sign in. Only a successful password change stops it for good, recorded in
  `password_notice_ack_at`. Dismissing never writes that column. A notice shown once and
  then silent is a notice most people never act on, which is why it comes back.

  *Who sees it:* 64 of the 75 portal accounts, keyed on the person's email appearing in
  `registrations`. 96 of those 97 rows held a stored password, so membership is the accurate
  marker; the passwords themselves were cleared in T60 step 2, which is why the column itself
  could not be used.

  *Measured as an ordinary staff_member, rolled back:* sees the notice, records their own
  acknowledgement (1 row), cannot acknowledge for anybody else (0 rows), and an attempt to
  smuggle `role = 'master_admin'` alongside the acknowledgement is refused, so the T53 guard
  still holds over the new columns. Counts after: 75 accounts, 64 with a notice due, 0
  acknowledged.

  *Goal:* Everyone whose password was exposed is told, in the app, and can act on it in two clicks.
  *Done when:* An affected account signing in sees the notice; Later returns it next sign in;
  changing the password stops it permanently; an unaffected account never sees it.
  *Signed off 2026-07-27.* Checked on the live site: the notice appears after sign in, Later
  closes it for the session and it returns at the next sign in, Change my password lands on
  the right field, and it never blocks a sign in. That last one was the condition it was not
  allowed to fail.
  - [x] ~~**T62a** Cover the people whose password was exposed but who have no account~~
    `done 2026-07-27`
    T62 reaches 64 of the 75 accounts, but 96 people had a password stored. About 32 of them
    have no account at all: denied, still waiting, or never approved. A popup cannot reach
    somebody who cannot sign in.
    *Shawn's instruction, and it was the right shape:* do nothing special for them now, and
    if they ever do get in, show them the notice then. This makes that automatic rather than
    something to remember.
    A `BEFORE INSERT` trigger on `sbd_portal_users` sets the notice when the new account's
    email matches a registration submitted before **2026-07-27 00:04:35 UTC**, the moment
    migration `20260727000435_registrations_rls_t60` closed the table. Before that a stored
    password was readable by every signed-in account; after it, only SIPS admins could read
    one and the purge trigger clears it as soon as the request stops being pending. So a
    registration after the cutoff was never exposed and its owner should not be told it was.
    *Measured, rolled back:* an account created for a pre-cutoff registration carries the
    notice; one for a post-cutoff registration correctly does not; one for somebody who never
    registered correctly does not. Counts after: 75 accounts, 64 with a notice due, unchanged.
    *Also covers T59.* The test leader registration went in on 2026-07-26, before the cutoff,
    so that account will carry the notice when it is approved. Correct rather than incidental:
    its password sat in the open table for the few minutes before step 1 landed.

- [ ] **T63** Clean up the assessment authorisation queue · est 0.5d · Medium
  Requested by the client 2026-07-27: "all people from Scrubball SBD can be removed from the
  auth que (jun 26 date) and let's see where we stand".
  The queue is `DB.staff.filter(s => s.placementNeeded)`, so removing somebody means setting
  `placement_needed = false`. It touches no account, which matters given the standing rule
  that no account is ever deleted.

  **What he asked for is 2 rows. What is actually in there is 24.** Counted 2026-07-27:

  | Facility | In the queue | Note |
  |---|---|---|
  | **no facility at all** | **15** | the `--` rows on his screenshot |
  | Test Hospital Facility | 2 | |
  | Alta Bates | 2 | |
  | Mount Sinai | 2 | |
  | **Scrubball Sbd** | **2** | the facility is switched off |
  | DEV TEST HP | 1 | the test account made last night |

  Scrubball Sbd is inactive, so removing those two matches the rule already agreed for T31:
  key on the facility or record being switched off, never on Free Agent membership.

  The 15 with no facility are the real mess and he has not asked for them yet. They are a
  mix of plain test data (TEST TEST, TEST USER, Test David OG, Shan -, Royond, Darius) and
  real-looking names (Aaron Law, Andre Westmoreland, Krystal Westmoreland, Stacey Law,
  Michael Gudejko, David Williams, Darius Love), plus **Regina Randle twice**. Some hold a
  login. Guessing which is which is exactly how somebody real gets removed by accident.

  *Also worth telling him:* not one of the 24 has a placement review against them. Nobody in
  this queue has ever sat their placement, so this is not a backlog of half-finished work.

  *Goal:* The authorisation queue lists only people somebody actually intends to assess.
  *Done when:* The Scrubball pair are out; the no-facility 15 are resolved one way or the
  other with his answer on the record; no account is deleted; and the remaining list is short
  enough to read at a glance.

- [ ] **T64** The review reminder ignores approved-but-unactioned requests · est 0.25d · Medium
  Split out of T61 when the client closed it. The reminder chases `pending` requests only, so
  a request that is approved and then never assessed is chased by nobody. Jody Mays sat that
  way for 12 days and it took collapsing eleven duplicates to make it visible.
  *Goal:* A request that stalls after approval is chased the same way a pending one is.
  *Done when:* The reminder counts approved requests with no assessment recorded, and one
  that has sat past the threshold appears in the reminder and on the admin notice.

- [ ] **T65** Placement scoring: one threshold table, no placeholder belts, and the Dangerous provision · est 1d · **High**
  Raised 2026-07-27 from the client's own reading of David Williams' report, and confirmed
  against the Scoring Logic Specification v2.0 (Dr. Jake, 12 May 2026).

  **Four defects, all in the same place.** The placement report was carrying its own copies of
  the spec's numbers instead of reading the one table the platform already has.

  1. **A placeholder printed as a determination.** `deriveOutcome` fell back to `'White'`
     whenever the review carried no stored belt. Williams had none, so his report came out
     headed WHITE BELT with White's thresholds, White's floors and a certification basis
     written against White. The engine had actually placed him at Green.
  2. **Three copies of the section 9 table.** `SBD_BELT_THRESHOLDS`, `RPT_STANDARDS.belts`
     and `BELT_THRESHOLDS`, one of them annotated "these MUST match" -- the note you write
     when nothing enforces it. Section 9 says in as many words not to hardcode these inline.
     The real table lives in `belt-test-engine.js` as `BELT_TEST_CONFIG` and the belt test
     already reads it.
  3. **Flat per-level floors.** Knowledge 80 at every level, simulation 75/70/65/65/65, the
     same for every belt. The spec gates by belt and gates fewer levels lower down: at Green
     simulation L4 and L5 are not gated at all. Williams scored 67.5 on both and the report
     marked them FAIL against floors that do not apply to him.
  4. **Knowledge overall computed as correct-over-total.** Section 5.2 says the average of
     the five level scores. The two agreed until L5 dropped to 7 questions when TIR34 was
     pulled at the client's request. Williams came out 97.4 where the spec gives 97.5. **The
     client was right and we were wrong**, and his corrected report had the right figure.

  **The Dangerous provision.** The client ruled on 2026-07-28: the belt is issued on the
  scores, and the dangerous answer becomes a patient-safety provision on the person's
  account. It does not touch the belt already held; it holds advancement to the next belt
  until a master admin or a SIPS admin clears it, and the record keeps who cleared it and
  when. *Who may clear, confirmed 2026-07-27:* `master_admin` and `staff_admin`, the same pair
  the belt override uses. Facility-side roles are deliberately not on the list, since the
  provision is a SIPS determination and the facility is not the party that clears it. Until now the
  flag existed only inside the report, recomputed every time it was opened, so there was
  nowhere for a provision to live. `staff.dangerous_provisions` gives it one, and the T24
  guard was extended to it so a candidate cannot clear their own.

  *Goal:* One threshold table, read not copied; a report that never prints a belt nobody
  earned; and a safety finding that lives on the person rather than inside a PDF.
  *Done when:* Williams comes out Green Belt Conditional with K 97.5 and blended 83.5, his
  L4/L5 read "not gated" rather than FAIL, the two scoring engines return the same belt for
  the same responses, an open provision blocks the next-belt request while leaving the
  current belt alone, and a master admin clearing one is recorded by name and date.

  **Measured 2026-07-27, 51 checks, all passing** (`scratchpad/t65/harness.js`, run against
  Williams' stored responses with no DB and no DOM):
  K overall 97.50 · simulation 62.50 · blended 83.50 · belt Green, derived from the scores
  with nothing stored · outcome Conditional · simulation floors 78/75/70/none/none · L4 and
  L5 not failures · knowledge floors 90/85/80/none/none · both engines agree on belt,
  blended and knowledge overall · a candidate below every threshold is awarded nothing rather
  than being handed White.

  **One deliberate difference from the fix note.** The note expected three blocking
  conditions from the individual responses, reading against the old flat 50. That 50 appears
  nowhere in the spec; section 9 sets the individual minimum per belt and Green's is 72. On
  Williams that produces 12, not 3. His simulation overall is 62.5 against a 78 floor, so a
  dozen responses under 72 is what actually happened. Flagged rather than quietly changed.

  *Not in this change, and deliberately:* Williams' own row is untouched. Regenerating it is
  a production write and waits for an explicit go-ahead after this deploys.

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

**Updated 2026-07-27, after a working night.** 35 items done, 36 open.

| Group | Open | Items | Est. days |
|---|---|---|---|
| Phase 1, awaiting a click-through | 5 | T26, T27, T28, T28a, T61 | 2.25 |
| Phase 2 | 9 | T30, T32, T33, T34, T35, T35a, T35b, T36, T37 | 7.50 |
| Phase 3 | 11 | T39 to T48 | 9.35 |
| Found during Phase 1 | 6 | T54, T56, T58, T59, T60, T62 | 2.10 |
| Raised by the client | 3 | T63, T64, T65 | 1.75 |
| Blocked on somebody else | 4 | T49 to T52 | not counted |
| **Total, excluding blocked** | **34** | | **22.95** |

The five Phase 1 items are not really 2.25 days of building. The code for T26, T27, T28 and
T28a is written, merged and live; what is left is somebody pressing the buttons in a browser
and saying whether it behaved. T61 is a conversation, not a change.

Phase 1 closed on 2026-07-26 and 27, and it grew while it was being closed. It started as
T22 to T29 at 5.5 days. Eight items were found while working through it: T53, T54, T55, T56,
T57, T58, T60, T61, T62. Three of them, T53, T55 and T60, were more serious than anything on
the original list. That is what an audit is for, and it is also why the estimate moved.

At five working days a week, what is left outside Phase 3 is about **two and a half weeks**.
Phase 3 runs alongside rather than blocking.

Estimates come from reading the code, not from having built these particular changes.
Treat what is left of Phase 1 as firm, Phase 2 as good, Phase 3 as indicative.

---

## Risks

**Reviewed 2026-07-27.** Risks 2, 3 and 4 were live risks while Phase 1 was being built and
are now settled. They are kept, marked closed, rather than deleted, because the record of
what was feared and what actually happened is worth more than a tidy list.

1. **New asks arriving mid-flight.** Still open, and it is now the main threat to a date.
   Four landed between 24 and 26 July that appear in no earlier plan: See As, the profile
   redesign, the sidebar sections, the stale-review trigger. This is only a closing scope if
   new asks append at the end under rule 3 rather than being inserted into Phase 1 or 2.
2. **~~Tightening a permissive policy can break a working screen.~~** Closed. Nine tables
   were tightened between 26 and 27 July and each was probed per role, with the probe rolled
   back and the data re-read. Two screens did change behaviour and both were expected and
   recorded: staff and leaders now get an empty free agent list, and an empty registration
   list. Nothing broke.
3. **~~T24 changes column grants on `staff`.~~** Closed, and the fear was correct enough to
   matter. A column revoke would have broken the candidate's own Position School writes,
   which carry `stars`. That is why it shipped as a trigger comparing old to new instead.
4. **~~T26 is a product decision as much as a build.~~** Closed. Staff see nothing until
   Publish is pressed, and T55 made the question free: every schedule table was empty, so
   there was no existing schedule to strand.
5. **T39 is the highest-risk item in the list.** Unchanged. Built with write access it would
   undo the audit trail built between 22 and 24 July. The read-only position should be held.
6. **One Supabase project hosts other SIPS properties.** Unchanged. The `bb_*`, `aip_*`,
   `demo_*`, `tco_*`, `hfl_*`, `op44_*`, `underwriting_*` and `page_events` tables belong to
   other sites and are outside this audit. They carry their own permissive policies. If a
   compliance review covers the whole project rather than the belt platform, that is
   additional scope not counted here.
7. **The exposure in T60 happened and cannot be un-happened.** 96 people's passwords were
   readable by every signed-in account for as long as that table existed. The hole is shut,
   the stored copies are cleared, and 64 accounts now see a notice asking them to change
   their password. What is not known is whether anyone read them, because the sign-in
   records have not been examined. Recorded as a standing risk rather than closed.
8. **Five people can reach a schedule; nobody at SIPS can.** T58. The write rights and the
   interface disagree, which is how a whole feature area went two months without anyone
   noticing it had never saved a row.

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
| The review backlog is 24 decisions | Wrong reading of the same data. It is roughly 3 decisions plus duplicates, test accounts and orphans. Became T29 and T31, both now done: 27 open gate requests collapsed to 6, and the two orphan placement reviews closed. Measured on 2026-07-27, the real backlog was 6 gate requests across 3 people and 2 placement reviews. |
| `staff_history`, `sbd_email_queue`, `sbd_password_resets` and similar are exposed | Checked and safe. RLS is on with no policy, so they are unreachable over the data interface and only the service role can read them. |
| The oldest waiting review is six days old | Wrong. It is 8 May, 78 days. This went out in the 2026-07-24 report and has been corrected to the client in writing. |

---

*Verification method: policy and grant tables read directly, Supabase security advisors,
live row counts, and a static sweep of `src/js/*.js` and `index.html` covering both
function bodies and inline event handlers.*
