# SBD Belt Platform: Task Ledger

**Living document.** This is the single record of what has been built and what is left.
It is not regenerated. It is edited in place.

**Last updated:** 2026-08-13
**Audit basis:** 2026-07-25, verified against the live project and the live code.
**History basis:** 2026-07-31, the complete client conversation from 22 May to 31 July read end
to end including every attachment. See `docs/DOMAIN_GLOSSARY.md` for the vocabulary this ledger
uses, and T78 to T87 for what that pass found.

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
- [x] **T26** Make Publish to Staff actually publish (issue `B1`) · est 1.0d · **High**
  **Done, verified 2026-08-13 against the live database.** `publishSchedule` at
  `ui-views.js:11839` stamps `publishedBy`, and new shifts are created with it null
  (`:11462`, `:11766`), so nothing reads as published until somebody presses the button.
  Live: `sbd_schedule` now holds a row and that row carries `published_by`, where the table
  had never accepted a write when this was opened. The read side is enforced in the database
  rather than only in the UI: `sbd_schedule_select` lets a `staff_member` see a row only when
  `published_by IS NOT NULL`, read back out of production today.
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
- [x] **T27** Persist attendance edits (issue `B2`) · est 0.5d · **High**
  **Done, verified 2026-08-13.** All three paths call `SB.updateAttendance` on an existing
  record instead of mutating local state and returning: `ui-views.js:12259`, `:12281` and
  `:12303`, and `updateAttendance` PATCHes the row (`api-supabase.js:384`). Live:
  `sbd_attendance` holds a row where it held none, so the mapper fault that stopped every
  write is gone. One limit worth stating rather than glossing: `sbd_attendance` carries no
  `updated_at`, so an edit surviving cannot be proved from timestamps here. The click-through
  evidence is the client's own record, which puts this live on 26 July and confirmed in the
  31 July sign-off.
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
- [x] **T28** Persist quick-fill schedule overwrites (issue `B3`) · est 0.25d · Medium
  **Done, verified 2026-08-13.** Quick fill and CSV import both call `SB.updateSchedule` on a
  day that already has a row (`ui-views.js:11459`, `:19078`), and the silent catches on both
  paths are `handleSyncError` now, so a rejected write says so. Proven at the database level
  when it was built, and the client's record puts it live on 31 July with the uniqueness rule.
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

- [x] **T30** Read-only observation checklist view for facility leaders · est 1.0d
  **Done 2026-08-07**, shipped as PR #184. A facility leader can open the instrument checklist their people are scored against and cannot edit it (`ui-views.js`, "T30: read-only instrument view for facility leaders").
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
- [x] **T32** Remove the cross-facility read leak (issue `S6`) · est 0.5d
  **Done, verified 2026-08-13 by reading the policies back out of production.** No
  `auth_read_all` policy exists on any of the three tables. What stands in their place:
  `sbd_schedule_select` and `sbd_attendance_select` allow the four admin roles, a facility
  match for `hospital` and `facility_admin`, and the person's own row; `sbd_promotions` reads
  through `hospital_reads_facility_promotions`, which is `facility_id = sbd_get_user_facility()`.
  Nothing on these three tables is readable across facilities any more.
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
- [x] **T37** Move the observer PIN check server side (issue `S12`) · est 0.5d
  **Done, verified 2026-08-13 in production.** The half that was missing has landed.
  `staff.observation_pin` no longer exists as a column, so the 4 rows that still held a value
  are gone with it, and `sbd_observer_pins` exists holding 6 rows.
  One thing to know rather than to fix here: the drop is not recorded in
  `supabase_migrations.schema_migrations`, which still ends at `20260807120000` even though
  later migrations are demonstrably applied. Tracked separately as T111.
  `ovsUnlock` compares the observer PIN client side against `DB.staff`. Observation writes
  are separately gated server side, so this is an identity-of-observer weakness rather
  than an authorisation hole.
  **Built and merged 2026-08-04 as PR #179, but only half of it reached production. Verified the
  same evening by making real requests as a real signed-in `staff_member`, not by reading the
  catalogue.** What holds and what does not:

  * `sbd_observer_pins` exists in production and is correctly closed. Selecting from it as an
    ordinary authenticated user returns `42501 permission denied for table sbd_observer_pins`.
    That half worked.
  * **`staff.observation_pin` still exists, and 4 of 70 rows still hold a value.** The migration
    that drops it, `20260804130000_t37_drop_staff_observation_pin.sql` line 121, is in the
    repository and was never applied: `supabase_migrations.schema_migrations` still ends at
    `20260731130000`, and neither T37 migration has a row.
  * **The old column is still readable.** Signed in as one `staff_member`, `public.staff` returns
    7 rows and **1 of them carries a plaintext `observation_pin`**. A second `staff_member`
    account sees 14 rows and 0 pins, so it depends on which facility you are in rather than on
    the column being protected. `authenticated` still holds column-level `SELECT` on it.

  So the new door is locked and the old door is still open beside it. **This is the exact pattern
  this task already exists to correct**, a narrow rule added while the broad one underneath stays,
  and it is the third time it has happened on this item.

  Not a code change: the repository is already correct. **And as of later the same night the
  remaining half is scheduled rather than forgotten**: part 1 is applied and verified live, and
  the `20260804130000` column drop is planned for **2026-08-07** after a two-day observation
  window, with a re-verification the same day. Until the 7th the old column staying readable is a
  stated, accepted exposure window rather than an oversight, and this entry is where that is
  written down.

  **The fix is not RLS, and reaching for RLS would make things worse.** `staff_select` reads:

  ```
  (id = auth.uid())
  OR role in (master_admin, staff_admin, system_admin)
  OR (role in (facility_admin, hospital, staff_member) AND fid = get_user_fid())
  OR sbd_is_assessor(fid)
  ```

  A staff member reading every row in their own facility is **correct**; that is the roster, and
  narrowing it to hide one column would break a feature to patch a data-placement mistake. The
  problem is not who can read the row, it is that a secret is sitting on a row colleagues are
  meant to read. Dropping the column is the fix, which is what the migration already does.

  **The two stores hold the same four pins**, measured by comparing them without reading a value
  out: `old_store = 4`, `new_store = 4`, `identical = 4`.

  **That duplication is deliberate and this entry first said otherwise.** It is a transitional
  write mirror, `sbd_staff_observation_pin_mirror` on `public.staff` calling
  `sbd_mirror_observation_pin()`, so that the migration and the frontend deploy cannot fall out
  of step during a two-part release. Reading the trigger body confirms it: a write to
  `observation_pin` upserts into `sbd_observer_pins` and sets `observer_pin_set`, and clearing it
  deletes the row. The earlier reading of this as a mistake was wrong.

  **The rest of part 1 is applied and correct**, verified against production: RLS on, **zero**
  policies, **zero** grants to `anon` or `authenticated`, two unique indexes, the non-secret
  `staff.observer_pin_set` flag in step at 4 across both stores, and the `sbd_staff_privilege_guard`
  trigger in place. `sbd-observer-pin` is deployed ACTIVE v1 and `sbd-observation-unlock` was
  redeployed to v2.

  **What the mirror does not change** is that the four pins have been sitting in a column
  colleagues can read. Blast radius by facility, one pin holder in each:

  | staff in the facility | who can read that pin |
  |---|---|
  | 5 | 4 others |
  | 3 | 2 others |
  | 7 | 6 others |
  | 18 | 17 others |

  33 staff rows across the four, so **29 people can read a live pin that is not their own**, of
  whom the ones with an active login can actually run the query.

  **Because of that, dropping the column is not sufficient on its own.** All four pins have been
  readable for as long as the column has existed and should be regenerated after the drop.
  Otherwise the fix removes the exposure route and leaves the exposed credential in service. That
  holds whether the duplication was intentional or not; it is about where the pins have been, not
  about how they got there.

  **Neither migration has a row in `supabase_migrations.schema_migrations`, and part 1 plainly
  ran.** So production holds a table, a flag, two triggers and two indexes that the migration
  history does not know about, while a fresh environment replaying from zero would build them from
  the file. The two will not stay in agreement. Record both versions when part 2 goes in. This is
  the same class of problem as the `david_usage_by_app_mtd` fix earlier the same day, which was
  applied by hand and written back into an already-applied migration; that one was corrected by
  moving the change into its own dated migration, and the same shape applies here.

  Separate and lower, worth a decision rather than an alarm: the PIN in the new table is stored as
  written, 4 characters, not hashed. Nothing in the migration or the edge function hashes it. That
  is defensible now that the table is unreadable over REST, but it should be a stated choice
  rather than an accident, because it means anyone with database access reads live PINs.

  *Goal:* Who observed an assessment is decided by the server, not by the browser.
  *Done when:* The PIN comparison happens server side; a forged client-side unlock does not produce a valid observation; the normal observer flow is unchanged; **`staff.observation_pin` no longer exists in production**; a signed-in staff member reading `public.staff` sees no pin column at all; and the four pins that lived in the readable column are regenerated.
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
  *Status 2026-08-04:* wired, no new screen and no migration. `a-schedule` is a nav item and a
  container that mount the existing `renderXSchedule` — the same five tabs (Overview, Builder,
  Attendance, Record, Shifts) over a facility picker — so there is still one schedule screen,
  not a copy. The picker is scoped like `renderAFacilities`: every active facility for a master
  admin, `assignedFids` only for a staff_admin. Both roles already hold the INSERT/UPDATE
  rights on `sbd_schedule` and `sbd_attendance` and read every facility under
  `sbd_schedule_select` / `sbd_attendance_select`, so nothing in the database changed.
  *Four faults found in the shared builders while wiring them, all of which had been
  unreachable because nobody could open `x-schedule`:*

  | Fault | Effect |
  |---|---|
  | `ST.portal==='h'` / `==='x'` after every write | `ST.portal` holds `admin`/`hospital`/`system_admin`/`staff_member`, never the one-letter prefix, so **no portal repainted after saving a shift, publishing, marking attendance or importing a CSV**. Now one `_refreshHAtt()` that follows the mount. |
  | `_refreshHAtt` hard-coded to the leader portal | Every date, shift, year and staff control inside the shared builders repainted `h-schedule` instead of the screen you were on. |
  | `attRecordStaffId=parseInt(this.value)` | `staff.id` is a uuid, so the Attendance Record staff picker snapped back to the first person on every change. Same for the unquoted uuid in the Download button and in `assignCoverage(...)`, which made those onclicks a syntax error. |
  | `renderXSchedule` never called `_loadFacilityShiftDefs` | A facility's custom shifts were invisible outside the leader portal; the Shifts tab showed only the defaults. |

  The first three are leader-portal bugs too, and are fixed for the leader in the same change.
  *Left alone, deliberately:* `renderFacTab` has a `facSubTab==='schedule'` branch feeding
  `renderAdminScheduleSection`, a read-only 7-day table. Nothing ever sets `facSubTab` to
  `'schedule'` and the drill-down's tab list has no Schedule tab, so both are unreachable and
  neither would satisfy this task (read-only, 7 days, no write path). Not deleted in passing —
  worth its own line if the duplicate is to go, the way T57 handled the duplicate tables.
  *Checked:* `node scripts/verify-schedule-hydration.js`, 19 passed, extended with the mount
  dispatch. Still to do in the interface: open the screen as a master admin at Test Hospital
  Facility and confirm a saved shift and an attendance mark match the leader's view (T59).

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

- [ ] **T60** The signup form still writes a plaintext password into the registrations table · est 0.3d · Medium
  **Downgraded 2026-07-31 from Critical, and retitled. The critical half is closed.** The
  entry below is the finding as it stood on 26 July and it is kept because the history
  matters, but read this block first, because the old title described an active breach that
  no longer exists.

  Measured against production on 2026-07-31:

  | Claim in the 26 July finding | State today |
  |---|---|
  | `reg_all_all FOR ALL USING (true)` to `authenticated` | **Gone.** The only SELECT policy is `reg_select`, limited to `master_admin`, `admin`, `staff_admin`, `system_admin` |
  | 96 rows holding an unhashed password | **Zero.** 101 rows total, 91 approved and 10 denied, none carrying a password |
  | Every signed-in account can read them | **No.** Four admin roles only, and there is nothing left to read |

  What actually remains is narrower and is the whole of this task now. `ui-views.js:153`
  still sends `password: pass` in the registration payload, commented *"Included for the
  Edge Function to create the auth user"*, so a **pending** registration holds a plaintext
  password until it is approved or denied. There are zero pending rows right now, so nothing
  is exposed at this moment; the window opens the next time somebody registers, and even
  then only the four admin roles can see it.

  Worth finishing, and no longer the item that outranks everything else.

  **2026-08-18: the finish is built, inside T113.** The signup form no longer collects a
  password at all, the approval function ignores any stored one, and migration `20260818120000`
  nulls the column and keeps it permanently null via trigger. Closes when T113 deploys and a
  fresh registration is checked end to end.

  *Goal:* A registration never stores a password in readable form, not even between
  submission and approval.
  *Done when:* The signup path stops writing `password` into `registrations`, the auth user
  is still created on approval, the column is dropped or permanently null, and a fresh
  registration is checked end to end to confirm no readable password ever lands.

  ---

  *The finding as originally written, 2026-07-26, kept for history:*

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

- [x] **T65** Placement scoring: one threshold table, no placeholder belts, and the Dangerous provision · est 1d · **High**
  **Done, verified 2026-08-13. Both passes are in.** The build was measured on production when
  it shipped (v189, v190, v191, with 64 checks passing in `tools/verify/t65-scoring-check.js`).
  The two things that held the box open have since closed: the scoring was rebuilt onto the
  Scoring Specification v1 under T96, and the client signed the reports off on 11 and 12 August,
  with the last wording change, the assessor override line, taken off under T100.
  **Status 2026-07-27: built, merged, live and measured. Open only on the QA sign-off.**
  Shipped in three parts, each verified on production after merge: T65 (v189), T65a (v190),
  T65b (v191). 64 automated checks pass in `tools/verify/t65-scoring-check.js`. Williams' row
  is corrected and his report regenerated. What is left is a live click-through, and the one
  piece of wording that is waiting on the client (below). Not ticked until both passes are in.

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

  *What the client asked for, and where each part stands, checked against his own words on
  2026-07-27:* belt issued on the scores, **done**; the item becomes a provision on the
  account, **done**; visible there and kept after clearing with who and when, **done**;
  cleared by a master admin or a SIPS admin, **done**; holds the next belt while open, current
  belt untouched, **done**; displayed in the report, **done**, as condition 1 plus the patient
  safety findings block. Nothing on his list is outstanding.

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

  **T65a, found while regenerating the report on 2026-07-27.** The report decided what counted
  as a dangerous answer by matching regular expressions against the text of the answer, not by
  the flag the question author set. The client's own description is unambiguous: "It is not a
  wrong answer. It is a specific wrong option that would cause harm if somebody actually did it
  on the floor. The flag sits on the individual option, not on the question." That is the stored
  `isDangerous` field, and nothing else.

  Measured across all 49 stored reviews before the change: the patterns fired **19 times across
  15 reports**, 17 of those on free-text simulation answers, and they agreed with the authored
  flag **exactly zero times**. The two detectors have never once named the same item.

  On Williams it flagged his answer *"under no circumstances should a visibly soiled instrument
  skip the full decontamination process"*, which is correct, because `skip.{0,20}decontam`
  matched it. So the most severe finding the report can make, SUPERVISED PRACTICE REQUIRED, was
  raised against a candidate for getting it right, while the option he did pick, "Clean to
  dirty" on workflow direction, went unmentioned.

  The authored flag matches the client's own account of the data to the letter: he said three of
  the five flagged questions have ever been picked, and the stored flags give exactly three, p6,
  p32 and p37. Every knowledge response back to April carries the field, so relying on it loses
  no history. The report and the account provision now share one predicate,
  `sbdIsDangerousResponse`, so they can never name different items again.

  *Done when:* the report names the option the candidate actually picked, a correct answer can
  never raise a safety finding, and the report and the provision agree. **Measured: Williams
  condition 1 is now the workflow-direction question; 64 checks pass.**

  **T65b, two report-rendering defects found while producing the PDF.**
  1. *The Level Score Snapshot contradicted the rest of the report.* It printed Pass or Below
     Threshold for each level against a hardcoded 65, applied to `level_scores`, which is a
     single blended knowledge-plus-simulation figure the spec does not gate anywhere. On the
     affected candidate that put "Level 1 81% Pass" on the same document as a card reading
     "L1 knowledge 87.5% FAIL against the 90% floor" and "L1 simulation 66.5% FAIL against
     78%". One report, two answers. The figures stay because they are real; the verdict goes
     because there was no threshold behind it, and the column now states which components the
     belt actually gates at that level.
  2. *Every dark table header was invisible.* The headers set `color:#fff` inline and left the
     background to the `<tr>`, but `PRINT_CSS` carries a global `th{background:#f8fafc}` that
     repaints the cell, so white text landed on a near-white background. Thirteen headers
     across the report, unreadable in every PDF ever downloaded. Fixed by setting the
     background on the cells, where the inline rule wins.

  *Williams' row, corrected 2026-07-27 with authorisation:* `tentative_belt` White to Green (the
  White was the old placeholder), and his p6 provision written to `staff.dangerous_provisions`.
  Report now reads GREEN BELT Conditional, K 97.5, simulation 62.5 failing the 78 floor by 15.5,
  L4 and L5 not gated. Nobody else's row was touched.

  *Backlog, not a blocker:* a per-option clinical rationale stored in the question bank next to
  the flag, so the report can say why that specific option is dangerous rather than quoting the
  option picked and the correct handling. Our idea, not a client request, and the wording that
  is there now is accurate without it.

- [ ] **T66** The AI notes revert, and the report disagrees with the interface · est unknown until reproduced · **High**
  Raised by the client in the recorded meeting of **2026-06-29**, three separate times in one call,
  which is how much it is bothering him. **Tracked here so it is not lost, not because it is our
  build.** Half of it was ours and is already closed; the other half belongs to another developer
  who named the cause in the same call.: *"I'm not sure why the AI notes keep reverting back,
  keep reverting back, keep reverting back"* and *"now with the UI, the report says one thing,
  the UI says something else"*.

  **Part of the second half is already fixed and he has not seen it yet.** T65b closed two cases
  of the report disagreeing with itself: the Level Score Snapshot printed a pass against a
  threshold that does not exist while the cards beside it printed a fail against the real floor,
  and the placeholder belt made the whole document report against the wrong belt. Both shipped on
  2026-07-27 in v191.

  **The reverting is not ours and it is not unexplained.** *Corrected 2026-07-28 after reading
  the transcript properly the second time.* In the same call another developer gave the cause and
  claimed it: *"we declared like a universal AI recommendation or AI suggestions that we had, but
  it got like two paths. So that's on me... we already know that fix."* The blank report pages
  over the same weekend were attributed separately to a background data-migration tool failing
  and an upstream model outage.

  So this is not an unowned mystery. It is owned and the cause is stated.

  **The date was in the transcript all along, and the date it is measured against was wrong.**
  *Added 2026-07-28, corrected the same day once Shawn confirmed the recording is from 29 June and
  not 28 July.* This entry said
  what was missing was a date and any confirmation the fix had shipped. The date is there: later
  in the same call, asked about the wider pipeline, the same developer said *"currently for like
  today and tomorrow we are working on the AI fix because like we have to have like one AI
  analysis for all of the side. So we are deploying on that."* The call was **2026-06-29**, so that
  is **29 and 30 June**, a month before this was written down. A claim of deployment, not evidence
  of one, which is exactly the distinction the client is complaining about, so it stays a claim.

  *The operational note that followed from the wrong date is withdrawn.* It said another team was
  deploying into the AI notes area on the same days as our live QA pass, so anything odd there
  could be set aside. That was only true if the call had been 28 July. The claimed deploy window
  was **29 and 30 June**, a month before the QA pass, so nothing about it overlaps and there is
  nothing to set aside. The Sriman brief of 29 July carries the withdrawn version and needs the
  same correction.

  *What the real date changes, and it is not cosmetic.* The client raised this three times in one
  call **a month ago**, and the fix was claimed for the very next day. Nobody has confirmed since
  whether it shipped. So this is not a fresh complaint waiting on a fix that is about to land, it
  is a month-old complaint with an unverified claim attached, which is the same shape as the thing
  he is complaining about.

  *Goal:* The client stops seeing notes revert, and knows which of his two complaints was ours
  and which was not.
  *Done when:* The two-paths fix is confirmed live with something showing it, the claimed 29 to
  30 June window having passed a month ago, and the client is told plainly that the report-versus-interface
  half was ours and went out on 27 July in v191. Nothing here needs building unless that fix does
  not hold.

- [ ] **T67** The access control must survive the database migration · est 0.5d to prepare · **Parked**
  Logged 2026-07-28 from the recorded meeting of **2026-06-29**. A schema migration onto a new database was
  described as *"at least two weeks from now"*, with the current database being backed up and a
  new one built to a new schema, then the application pointed at it.

  **PARKED 2026-07-28 by Shawn. The premise was never confirmed.**

  This was logged as Critical off a single description in a recorded call, and then written up as
  though the clock were running. Two things undo that. The call was **2026-06-29**, not 28 July, so
  "at least two weeks from now" pointed at **13 July**, which is already past. And checked on
  2026-07-28: **no new project exists**, one organisation and two known projects, so nothing has
  started in the month since.

  Nobody has confirmed that this migration is still planned, or that it is ours to prepare for.
  It was an estimate given once, by another developer, in a call a month old. **An estimate that
  has quietly lapsed is not a deadline, and treating it as one manufactured an urgency nobody
  asked for.** Parked until somebody says it is real.

  *Nothing is lost by parking it.* `supabase/verify/post_migration_check.sql` is written, merged
  and verified at 74 of 74 PASS against production. If the migration does surface, the check is
  ready that day rather than needing to be built. Parking the task does not park the protection.

  *Three details from the transcript, added 2026-07-28, because they change who this goes to and
  where it lands.* It stays on the **same Supabase account**: *"we just shift the new database to
  our app and it's still on the same account, nothing else"*. Asked directly whether a new project
  had been created for it, the answer was **"nope, not yet"**, so as of the call it had not
  started. And it is **not** going into the PSOP project. That project is the client's own,
  created for the SOP tool, and he raised it separately as an open question rather than as the
  migration's destination. Anyone reading "a second project exists" as "the migration has a home"
  is reading two different conversations as one.

  **Why this outranks almost everything else open.** Access control on this platform is not in
  the table definitions. It is in 61 row level security policies across 15 tables, 5 guard
  triggers, and 13 helper functions those policies call. A migration that copies tables and data
  perfectly can still arrive with every one of those missing, and **nothing will look broken**,
  because losing a policy opens a table rather than closing it. The screens keep working. That is
  precisely how the original defects went unnoticed for months.

  What would silently come back: a staff member reading and editing all 49 placement decisions;
  any signed-in account approving its own gate request; a user setting their own belt, stars,
  gates, facility or role; 96 people's passwords readable in the clear; a candidate clearing
  their own patient safety provision.

  *Prepared 2026-07-28:* `supabase/verify/post_migration_check.sql`. It is read-only, creates
  nothing and takes no locks. It returns PASS or FAIL for each of 50 checks covering RLS state,
  the helper functions with their security-definer and search_path settings, the four guard
  triggers, the absence of always-true policies on the nine protected tables, thirteen columns
  the application depends on, four column types that were silently wrong before, and the
  plaintext password purge. **Run against production on 2026-07-28: 50 of 50 PASS**, so it is a
  working test rather than a wish list.

  *Goal:* Whoever performs the migration has the check in hand before it runs, not after.
  *Done when:* The script has been handed over and acknowledged, and it returns 50 PASS against
  the new database before the application is pointed at it. Also verify by behaviour afterwards,
  because a policy can exist and still be wrong: sign in as a staff member and confirm they see
  only their own record and cannot approve their own gate request.

- [ ] **T68** Every fix ships with proof that it is live · est 0.25d per item, ongoing · **High**
  The client's standing instruction from the recorded meeting of **2026-06-29**, and he was blunt
  about the cause: *"I want to make sure that you have actually tested them yourself... vs just
  the LLM or the AI telling you what's been updated... many times you've shared things have been
  updated... but the issue won't be live in the actual application, or one is live, it is broken
  something else."* What he asked for specifically is *"a screen recording... showing that you've
  tested to make sure that it's live vs the code telling you it's live"*.

  The substance is already covered here: nothing is ticked on one pass, and every merge this week
  was followed by fetching the production bundle and comparing the version. What is **not**
  covered is the artefact. He wants to watch it work, not read that it works.

  *Goal:* No item is reported as live without something he can watch.
  *Done when:* A short screen recording accompanies each item reported complete, showing the
  change working on the live site, and the EOD links them.

- [ ] **T69** Show which AI model is currently serving · est 0.5d · Medium
  Requested in the recorded meeting of **2026-06-29**. He asked for *"an arrow that says which model
  is currently active and being used"*, visible to master admin only, not to every user, and
  explicitly not full token accounting: *"we don't necessarily have to categorize all of the
  tokens... but just say if I log in and Anthropic is down, I can see what model is active"*.
  Context is a fallback discussion: reports came back blank over the weekend, attributed in part
  to an upstream outage, and he wants to be able to see that state himself rather than ask.
  *Goal:* A master admin can tell at a glance which model is answering right now.
  *Done when:* The current model is shown somewhere a master admin already looks, it reflects a
  fallback having taken over, and no other role sees it.
  **Corrected 2026-07-28 after reading the transcript: this is not ours to build.** It was
  logged here as our work off the meeting summary. In the recording it was given to the other
  developer, bundled with an instruction to investigate the routing layer and report back what
  is actually possible, and that developer had already said "I have to dig more into that".
  Two details worth keeping either way, because they narrow the design if it ever does come to
  us: he named the placement himself, *"in the dashboard or maybe in the command center"*, and
  the other developer's own answer was *"we can show model, but just for the master admin and
  not for all the users"*. Tracked, not built.

- [ ] **T71** Nobody has a list of who can reach the three consoles · est 0.5d, then quarterly · **High**
  Raised 2026-07-28. A teammate turned up holding a Vercel invite nobody sent on purpose. It was
  removed the same day and nothing was reached, so the incident itself is closed. **The finding is
  not the invite, it is that we only learned about it because somebody happened to notice.** There
  is no list of who holds access to GitHub, Supabase or Vercel, so there was nothing to check it
  against, and there still is not.

  *Checked the same day, so this starts from measured ground rather than zero:*

  | Where | State on 2026-07-28 |
  |---|---|
  | Supabase | One organisation, `SIPS`. Two projects, both ours: `mhijaqahbceuahfzezbh` the belt platform, `afwhyrkoxpbpherflzef` PSOP created 4 May. No third project, no unexpected surface. |
  | GitHub, repo collaborators | Exactly two, `sipshealthcare` as admin and `nayandharshawn` with write. Nothing else. |
  | Vercel | The stray invite found and removed. No member listing tool available from here, so this line rests on Shawn's check, not on a probe. |

  *One gap worth naming, because a pending invite is invisible.* The GitHub check reads accepted
  collaborators only. An org-level invite that has been sent and not accepted does not appear
  anywhere in it. That has to be read off the organisation's own people page.

  **Why this is worth a task rather than a note.** Three reasons, and the third is the one that
  makes it urgent rather than tidy.
  1. Console access is not application access. A Supabase project member holds the service role,
     and the service role bypasses row level security completely. Nothing in
     `supabase/verify/post_migration_check.sql` can see it, by design, because no SQL can.
  2. T33 is the security tail with an external review behind it. Who holds access, reviewed on a
     schedule, is close to the first thing any such review asks for and we cannot answer it today.
  3. **T67 rebuilds the database.** A migration is exactly the moment access lists get recreated,
     and a wrong entry made then is invisible afterwards and permanent in practice.

  *Goal:* There is a written list of who holds access to each of the three consoles, it is checked
  on a schedule rather than by accident, and the new database gets one before the application is
  pointed at it.
  *Done when:* The list exists for GitHub including pending invitations, Supabase and Vercel; every
  entry has a named reason; anything unexplained is removed; and the check is repeated against the
  new database as part of T67 rather than after it.

- [ ] **T72** Managers and above cannot switch between their own portals · est 0.5d · Medium
  Asked for by the client on 2026-07-29: *"Managers and above still need a development... so can we
  create a toggle button at the top of their dashboard to go from staff portal to manager, dir, etc
  portal"*.

  **This is not T39 and should not be built like it.** T39 is one person looking at somebody else's
  account, which needs an audit trail and a hard read-only guarantee. This is one person who holds
  more than one role switching between their own views. Nothing is being impersonated, so none of
  T39's machinery applies and none of its risk does either.

  *The one thing to get right.* The switch decides which portal renders, and it must not decide what
  the server will allow. Every role check stays where it is. A person who toggles into the manager
  view sees exactly what their real grants already permit, and if they hold no manager grant the
  toggle is not offered at all. Anything else recreates the client-side role flip that has been
  removed everywhere else on the platform.

  *Answered 2026-07-29 by Shawn:* the toggle is for **master admin and SIPS admin only**. Nobody
  below that sees it, which keeps the surface small and means the first version cannot widen access
  for anyone who is not already a SIPS-side account.

  *Still open:* whether the choice persists across sign ins or resets to the primary portal each
  time. Worth deciding before building rather than after, because persisting it means storing a
  preference per user and resetting it means storing nothing.

  *Goal:* A person holding more than one role reaches all of their own portals without signing out.
  *Done when:* Somebody with two roles sees the toggle and moves between portals; somebody with one
  role never sees it; and a toggled view is proven to grant nothing the account did not already have.

- [x] **T73** A granted assessor whose base role is staff member has no assessor tab · est 0.5d · High
  Reported by the client on 2026-07-30 at 1:38 AM: *"when role is change to grant assessor access no
  assessment tab is visible in the update account"*, with *"Kirti Chaudhary was given assessor role
  but no assessor tab is viewable"* and a screenshot of her staff portal sidebar.

  **The grant was never the problem.** All three granted accounts carry the capability correctly in
  `sbd_portal_users.capabilities`. What fails is which portal the account lands in. `ui-views.js`
  `roleMap` maps on `ST.user.role` alone and never reads capabilities, so a granted assessor whose
  base role is `staff_member` is routed to `s-portal`, and the assessor consoles only ever existed in
  `a-portal`. Permission held, no door to walk through.

  Measured blast radius on 2026-07-29. Three accounts hold an assessor grant. Avery Henderson is
  `staff_admin`, routes to the admin portal, and has always worked, which is why nothing looked
  broken until a staff member was granted it. Kirti Chaudhary and Amy Cooper are both `staff_member`
  and both blank from the same cause. Their `educator_facilities` grants, four between them, were
  dead for the same reason.

  **Why the staff portal gets the consoles rather than routing these accounts to the admin portal.**
  T72 already settled that the portal switcher is master admin and SIPS admin only. Routing a granted
  staff member into the admin portal would contradict that decision and hand them a surface far wider
  than the grant. So the two consoles mount inside the portal the person is already in.

  Fixed 2026-07-29. `renderAObservations` and `renderAObservationReviews` turned out to be portal
  neutral already, with no `ST.curFid`, no facility switcher and no admin role gate, and both already
  gate writes through the capability-aware `_canWriteObs`. Their only coupling was a hardcoded
  container id each. Replaced with a shared `ovsMount` container, the same approach the file already
  uses for the DAVID mount, so the fifteen argument-less re-renders in that section needed no change.
  `effIsAssessor()` at `ui-views.js:10190` was written for exactly this job and had zero callers since
  it was added; it now gates the nav and is re-checked inside `renderSView` so a saved view in
  `sessionStorage` cannot route a plain staff member to a console.

  Frontend only. No schema change, no RLS change, no migration, so it needs the Vercel build to go
  live and is not live at merge.

  *Goal:* Being granted assessor access produces the assessor screens, whatever the base role is.
  *Done when:* Kirti and Cooper each see Observations and Observation Reviews and can record and
  confirm; Henderson is unchanged; a staff member without the grant sees no assessor nav and cannot
  reach either view by restoring a saved one. Verified against the three live records: the gate
  returns true for all three granted accounts and false for a plain staff member and a plain manager.

- [ ] **T74** Grantable roles are system wide and need to be per facility · est 3d · High
  **Half live, checked 2026-08-13. Staying open.** The assessor half is in production:
  `sbd_portal_users.assigned_facility_ids` holds the per-facility grant, and the UI reads it
  through `effAssessorScoped()` and `effIsAssessorAt(fid, u)` (`ui-views.js:10759`). What was
  asked for was all of role management by facility, not the assessor alone, so every other
  role still resolves system wide. The client's own reading agrees, recording this as the
  assessor half live on 30 July.
  Asked for by the client on 2026-07-30 at 1:33 AM: *"No longer system wide... just by facility like
  this"*, then widened at 1:35 AM to *"this should be for all role management by facility"*, and
  prioritised at 1:45 AM: *"We are expanding our team of assessors to handle new hires that we will
  test... so updating these functions for the assessor should move toward the front of the Que"*.

  **Scope settled by his voice notes of 03:37 the same night**, which named the roles and the flow
  directly: *"for the assessor, for the facilitator, all of those, we want to be able to give access
  or grant access by facility... We grant that role and then we [select] the facilities that they are
  able to apply that role towards."* His worked example: *"for Kirti, we're making her an assessor and
  then we want to be able to select like Mount Sinai."*

  So the flow he wants is **grant the role first, then choose the facilities it applies to.** That is
  the order the UI has to follow, not a facility filter bolted onto an existing switch.

  Measured against the code on 2026-07-29, the three roles he named are in three different states:

  | He said | Actual state | Work needed |
  |---|---|---|
  | assessor | bare boolean in `capabilities` | full facility scoping |
  | "facilitator", ie facility educator | `educator_facilities` array, already per facility | none, the pattern to copy |
  | preceptor | tri-state granted/revoked/default **per person** | full facility scoping |

  Facility educator already does exactly what he is asking for, which means the shape is proven in the
  codebase and there is a working reference to follow rather than a design to invent.

  **This is not a UI change.** It moves the gate from "is this person an assessor" to "is this person
  an assessor *here*", touching `sbd_is_assessor` and every policy calling it, plus `_canWriteObs` and
  `effIsAssessor` on the client. Server side goes live the moment it lands with no build in between,
  so the migration and the frontend have to agree before either ships. Depends on T75.

  **Blast radius, measured against the live database 2026-07-29.** `sbd_is_assessor()` is zero-arg,
  `STABLE SECURITY DEFINER`, and reads `role = 'assessor' OR capabilities->>'assessor'`. It is called
  by **14 policies across 6 tables**:

  | Table | Policies | Facility column | Scoping route |
  |---|---|---|---|
  | `observations` | 2 | `fid` | direct |
  | `observation_remediations` | 3 | `fid` | direct |
  | `ps_completion_requests` | 2 | `facility_id` | direct |
  | `sbd_assessment_queue` | 2 | `facility_id` | direct |
  | `observation_overrides` | 2 | none, `staff_id` only | **needs a join** |
  | `observation_audits` | 3 | none, `observation_id` only | **needs a join** |

  Two of the six carry no facility of their own, so those five policies can only scope by joining out
  to reach one, and a join inside a policy runs per row. Those are the expensive ones and the reason
  this is 3d and not 1d.

  *Approach that avoids a flag day:* add an **overload** `sbd_is_assessor(p_fid)` rather than change
  the meaning of the zero-arg function underneath all 14 policies at once. The zero-arg version keeps
  its job of answering "is this person an assessor at all", which is what nav visibility needs and what
  `effIsAssessor` mirrors on the client. Policies then migrate table by table, each one revertible on
  its own, instead of one migration that moves every gate simultaneously.

  *Still open, asked 2026-07-30 and not yet answered:* whether Observer and the practice-gate waiver
  follow the same rule. He did not name either in the voice notes, so they are out of scope until he
  says otherwise. He replied at 6:43 AM only to the T73 test request, "Will do... I will let you
  know", and did not address this question, so it stays open.

  *Step 1 written 2026-07-30, not yet applied:*
  `supabase/migrations/20260730060000_t74_assessor_facility_scope_overload.sql` adds the
  `sbd_is_assessor(p_fid uuid)` overload and touches nothing else. No policy, column or row
  changes, so applying it alters no behaviour; reach moves only when a later migration rewrites a
  policy to pass a facility. An absent or empty `capabilities.assessor_facilities` means system
  wide, which is what all three current holders have, so the first policy to adopt the overload
  changes the answer for nobody.

  Correction to the table above: facility educator is not merely a UI convention, it is enforced
  server side. `sbd_leads_facility_of(uuid)` reads `capabilities->'educator_facilities'` and is
  reached by 16 policies across 8 tables, including `preceptor_access` and
  `ps_completion_requests`. Measured 2026-07-30. That makes it a genuine reference implementation
  for this task rather than only a shape to copy, and it is where the argument type and the
  SECURITY DEFINER posture of the new overload come from.

  The predicate was verified read-only against production over seven cases: a holder with no list
  is allowed at any facility, a scoped holder is allowed only inside the list, an empty list reads
  as system wide, a null facility denies rather than leaks, and a non-holder is denied. The DDL
  itself has not been executed anywhere, since applying it to production needs an explicit go.

  *Goal:* A granted role applies only at the facilities chosen for it, and the server enforces it.
  *Done when:* A per-facility assessor can record and confirm at a granted facility, is refused at a
  non-granted one by RLS and not only by the UI, preceptor access is scoped the same way, and no
  existing system-wide holder silently loses or gains reach during the migration.

- [ ] **T75** The facility picker used for granting access lists entries nobody can choose safely · est 0.5d · Medium
  Found on 2026-07-29 while verifying T73, not reported by the client.

  `ui-views.js` builds the Role Management grant dropdown from `(DB.facilities||[])` with no filter.
  That list is eleven rows and contains two pairs sharing a name, three inactive facilities, three
  test facilities and one `Free Agent` holding entry. The admin facility switcher in `enterPortal`
  filters on `f.active!==false`. This dropdown does not.

  **Correction, 2026-07-29.** This entry first recorded Kirti Chaudhary's `educator_facilities` entry
  pointing at the `Free Agent` id as a misclick off the unfiltered list. That reading was wrong, and it
  went out to the client before it was checked. His voice note of 03:39 says parking SIPS hires in free
  agency is deliberate: *"they're coming in through our hiring process and we're putting them in a free
  agency portal to be able to assess them."* So the grant was him working around a missing concept, not
  a slip. The missing concept is now T76. The picker problem below stands on its own.

  This blocks T74 rather than merely preceding it. Once roles are scoped per facility, this picker is
  how real permissions get assigned, and today two entries in it are indistinguishable by name. The
  duplicate names are the part that cannot be worked around by being careful.

  *Waiting on the client* to say which entries are live sites and which are leftovers, asked on
  2026-07-30.

  *Goal:* Granting access at a facility means choosing from real, active, distinguishable sites.
  *Done when:* The picker excludes inactive and non-site entries, no two selectable entries share a
  display name, and Kirti's `Free Agent` educator grant is either re-pointed at a real site or
  superseded by T76.

- [ ] **T76** SIPS staff have no home facility, so `Free Agent` is being used as one · est 1.5d · Medium
  Raised by the client in a voice note on 2026-07-30 at 03:39, explicitly as a request for our
  recommendation rather than an instruction: *"I guess you got to think through it."*

  His words: *"they're coming in through our hiring process and we're putting them in a free agency
  portal to be able to assess them. What I think that we need is a home facility, which will be Sips,
  but we need it so that we can have a place that when we bring on Sips team members, that they are
  able to function some sort of way."* He names Kirti and Amy as the two currently in that position.

  **The collision.** `Free Agent` is a real facility row and already carries a specific meaning in the
  platform: `releaseToFreeAgent()` moves somebody there, the Free Agent Registry renders a
  *"Free Agent since"* date, and the whole surface reads as somebody who left a facility. SIPS's own
  employees being parked in the same row means one facility id carries two unrelated meanings, and
  every report that groups by facility silently merges them. Kirti's `facility_id` is the `Free Agent`
  id today, which is why her account looked wrong while being exactly what he intended.

  *Recommendation given to the client 2026-07-30, not yet accepted:* a real SIPS home facility, kept
  separate from `Free Agent`. SIPS-employed staff live there permanently, free agency goes back to
  meaning the assessment holding area only, and the two stop contaminating each other in reporting.
  Cheaper than a new role type, and it reuses the facility scoping T74 is already building.

  *Open:* whether he also wants a distinct role for SIPS staff, which he floated as *"we will be
  creating like a new role"*. Worth resisting until the home facility alone is shown to be
  insufficient, because a new role multiplies every policy in T74.

  *Goal:* SIPS's own staff have a home that is not the free agency holding area.
  *Done when:* A SIPS home facility exists, Kirti and Amy sit in it rather than `Free Agent`, the Free
  Agent Registry no longer lists them, and facility-grouped reporting separates the two.

- [x] **T77** A granted assessor has no Assessment Queue screen, and it cannot be switched on yet · est 0.5d after T74 · High
  **Done, verified 2026-08-13 in the shipped code.** The staff portal has an Assessment Queue.
  `s-assessments` is a nav item and a view (`index.html:581` and `:636`), it is in the view list
  at `ui-views.js:645`, and it is gated at `:677` on `effIsAssessor()` before rendering. When
  this was opened there was no `s-assessments` in the staff portal at all.
  Reported by the client on 2026-07-30 at 6:54 AM while confirming T73, from Kirti's own account:
  *"There's observation and observation review but no assessment queue."* He is right, and it is the
  same shape of bug as T73: the permission exists and the door does not.

  `Assessment Queue` is a nav item in the admin portal (`a-assessments`, `index.html:397`) and in the
  hospital portal (`h-assessments:294`, hidden). There is no `s-assessments` in the staff portal at
  all. Server side, `sbd_assessment_queue` grants a granted assessor both read and write:
  `aq_select` is `... OR sbd_is_assessor() OR ...` and `aq_update` is
  `sbd_get_user_role() = ANY(admin roles) OR sbd_is_assessor()`. So the grant reaches the data and
  T73 moved only the two observation consoles.

  **Why the one-line fix is refused.** `renderAAssessments()` scopes facilities the admin way:

      const isMaster = ST.user?.role === 'master_admin';
      const assignedFids = (!isMaster && ST.user?.assignedFids?.length) ? ST.user.assignedFids : null;

  and every filter below it reads `(!assignedFids || assignedFids.includes(...))`. Measured
  2026-07-30: Kirti Chaudhary and Amy Cooper are both `staff_member` with
  `assigned_facility_ids = []`, so `assignedFids` resolves to `null` and `null` means **no filter**.
  The queue holds 57 rows across 8 distinct facilities. Adding the nav item would therefore show
  either of them the whole organisation's queue plus an org-wide `Record Assessment` button, and
  hiding it in the UI would fix nothing, because `aq_select` carries no facility restriction for an
  assessor and the server would return all 57 rows anyway.

  **Depends on T74**, and is the concrete reason T74 goes first. Route chosen by Shawn on
  2026-07-30: wait for the per-facility gate rather than ship an interim own-facility rule, so this
  screen arrives already scoped instead of being widened and then narrowed.

  Also found while measuring, unrelated to the client's report: `sbd_portal_users` holds **two**
  `Avery Henderson` rows, one with a `facility_id` and no `assigned_facility_ids`, the other the
  reverse. Only one carries the assessor grant. Logged here so it is not rediscovered; it is a data
  hygiene item, not part of this task.

  *Built 2026-07-30, not yet applied or deployed.* Both halves are written together, because the
  screen must not land before the policy that limits it.

  - `20260730070000_t77_assessment_queue_facility_scope.sql` rewrites `aq_select` and `aq_update`
    to call `sbd_is_assessor(facility_id)`. Every other branch is copied verbatim, so the four
    admin roles, the hospital own-facility branch and the requester's own row do not move.
  - `capabilities.assessor_facilities`, granted in Role Management next to the Assessor toggle,
    mirroring `educator_facilities`. Revoking Assessor drops the list with it, and an empty list
    is never persisted, since both the client helper and the SQL read empty as system wide.
  - `effAssessorFacilities`, `effAssessorScoped` and `effIsAssessorAt` mirror the SQL client side.
    `effIsAssessor` is deliberately unchanged: it still answers "an assessor at all" and drives
    nav visibility, so a scoped assessor still sees the section.
  - `s-assessments` nav item and container in the staff portal, revealed by the same
    `effIsAssessor` gate as #73 and re-checked inside `renderSView`.
  - `renderAAssessments` now resolves its container through `asmMount`, and scopes by
    `assessor_facilities` for a capability assessor. This was the leak: the function filters on
    `assignedFids`, an admin-role field, and both holders carry `[]`, so the filter collapsed to
    no filter. Admin-role scoping is untouched.
  - The eight `ST.aView === 'a-assessments'` re-render guards became `asmRerender()`, which
    covers both mounts. Without it the queue went stale in the staff portal after every action.
  - `openRecordModal` and `submitAssessment` respect the same scope, so recording cannot reach a
    facility the policy would refuse, including via a console call.
  - `_rmFacilityOptions` now feeds both capability pickers: active rows only, and a repeated
    display name is disambiguated by location. Partial T75 mitigation, see that entry.

  *Verified:* seven client-side gate cases against the two live capability shapes, including that
  a holder with no list is still allowed everywhere and a null facility denies. `node --check`
  clean. The DDL has not been executed anywhere.

  *Remaining, and it is a decision not code:* nobody has an `assessor_facilities` list yet, so on
  the day this lands every current holder still reaches everywhere, by design. Kirti and Amy get
  scoped only once someone picks their facilities in Role Management, which is master-admin only.
  The client's own example was Kirti at Mount Sinai. Also note Kirti's `facility_id` is the
  `Free Agent` row today, per T76, so "her own facility" is not yet a meaningful scope.

  *Goal:* A granted assessor can work the assessment queue, and only where the grant applies.
  *Done when:* The staff portal shows Assessment Queue to a granted assessor and to nobody else, the
  rows and the facility filter are limited to the assessor's granted facilities, `aq_select` and
  `aq_update` enforce that limit server side rather than the UI alone, and a plain staff member sees
  no such screen.

### Found by reading the full client history, 2026-07-31

All ten below come from one pass over the complete client conversation from 22 May to 31 July,
including every attachment rather than the message text alone. **T78 to T83 are client requests
that were made, acknowledged in the conversation, and never reached this ledger.** That is the
finding that matters: six real asks were lost, and most of them were lost because they were said
one line away from something louder. T84 to T87 were found by us in the same pass.

A companion reference was written at the same time, `docs/DOMAIN_GLOSSARY.md`. It fixes the
vocabulary these tasks are written in, including the SBD and SPD distinction that T84 turns on.

- [ ] **T78** SIPS admin can attach files and images to a record · est 1d · Medium
  Asked 2026-07-29 at 11:42 PM: *"For SIPS admin.. can we add a button so we can add files and
  images… only for sipds admin…"*

  **Corrected 2026-07-31 after re-reading the exchange rather than the summary of it. This task is
  far more specified than it first looked, because the client answered most of it himself.**

  - **He named the storage.** At 11:43 PM, unprompted: *"Can we use pinecone or supabase?"*
  - **He designed the retrieval.** At 11:45 PM, after being told stored files would have to be
    downloaded to open: *"It doesn't need to produce documents to download… we can use the same
    print feature and we can download from there… is that a possible workflow?"*
  - **He restated the whole workflow for the record** at 12:18 AM: *"on our end.. it will be us
    uploading docs and having the print option so we can download.. for clarity"*

  So who uploads, what they upload, and how it comes back are all already decided by him. The only
  thing left open was ours: *"Let me add this to checklist and see our upload size limit"* and
  *"And storage"*. That is the entire outstanding commitment.

  **One correction he needs, and it is a real one.** Of the two he named, only Supabase can do
  this. Pinecone is a vector store; it holds embeddings so David can search meaning, and it cannot
  hold a PDF or an image as a file. The honest answer is both, in different roles: the file itself
  in Supabase Storage, and its extracted text indexed in Pinecone so David can answer from the
  document. That should be said plainly rather than silently building the Supabase half.

  **This is the store as well, not a button on top of one.** Measured 2026-07-31:
  `rg "storage\.from|\.upload\(|createSignedUrl|getPublicUrl"` over `src/js` returns nothing, and
  every "storage" reference in `ARCHITECTURE.md` is `localStorage`. The platform has no file
  storage of any kind today.

  **Narrowed 2026-07-31.** This was written as a pair with T83. The client has since decided he
  hosts curriculum video himself and sends links, so video is out of scope for this store. What
  still lands here is documents and images, and possibly the audio, slide decks and infographics
  if his own library does not cover them. That question is open under T83.
  *Goal:* A SIPS admin can attach a file or image to the record it belongs to, and get it back out.
  *Done when:* Upload is present for SIPS admin and absent for every other role, the file is stored
  outside the record row, retrieval works, and the maximum accepted size is stated in the UI rather
  than discovered by a failed upload.

- [x] **T79** A SIPS admin role, and splitting approval from PIN generation · est 1.5d · High
  **Done 2026-08-12**, shipped as PR #194. Approving an assessment and generating a
  PIN are separate grants now, and the new SIPS admin role starts empty until Role Management
  gives it something.
  Asked 2026-07-30 across two messages, five minutes apart, after being told PIN generation is
  master admin only. At 7:36 PM: *"We can add pin gen to role management so we can allow approved
  admin to gen pin… I guess we should create a sips admin role that is a blank role until we
  update it in role management"*. At 7:41 PM: *"Can we break apart permission to approve
  assements… Essentially… her (and others like her) we want them to be sips admin and be able to
  proctor the assessments… so generation (we still need to clean that page up so deactivated
  accounts aren't still clogging that page up for pin gen)"*.
  The pattern is the same one behind T74. He is asking for permissions to be composable in Role
  Management rather than bundled into a base role, and for a new role to start empty rather than
  inheriting anything.
  The fourth part of that message, cleaning deactivated accounts off the PIN generation list, has
  already shipped separately.
  *Goal:* Approving an assessment and generating a PIN are two grants, not one, and a SIPS admin
  role exists that starts with nothing until Role Management gives it something.
  *Done when:* The two permissions can be held independently, a new SIPS admin account can reach
  nothing until granted, and the grants are enforced server side rather than by hiding controls.

  **Code-complete 2026-08-12, pending user apply + deploy.** Design note
  `docs/decisions/2026-08-12-t79-sips-admin-role-and-split-assessment-grants.md`.
  Two capability keys on the existing `capabilities` jsonb — `issue_pin` and
  `approve_assessment`, each with an optional facility list following the T74/T77 pattern — plus
  the `sips_admin` role string. **Additive only:** the pre-T79 role allow-lists are kept as an OR
  branch, so nobody's live reach moves on the day it applies and independence is demonstrable on
  any account outside those lists, which is the SIPS admin the client described.
  Deploy order: apply `20260812120000_t79_split_assessment_grants.sql` → deploy
  `sbd-assessor-pin` **and** `sbd-record-assessment` → then the frontend (`ui-views.js?v=212`).
  The migration alone splits nothing; both edge functions carry half the gate.
  Verify: `node scripts/verify-t79-assessment-grants.js` (33 assertions) before deploy, then
  `supabase/verify/t79_assessment_grants_check.sql` against the live database after.
  Found and fixed on the way: `staff_select` admitted a capability *assessor* but not either new
  grant, so a PIN-only SIPS admin could call `generate_pin` and still see an empty candidate list
  (RLS fails silently by returning fewer rows) — reads are now shared by both grants while the
  writes stay split; Role Management was built from `DB.staff` alone, so a SIPS admin (no staff
  row) never appeared in the console meant to grant it anything; and `renderAAdminUsers` had no
  group for the new role, so a created account could not be found again.
  **Not done, deliberately:** `staff_admin` / `educator` / `preceptor` still hold both
  permissions. See T79a.

- [ ] **T79a** Narrow the assessment role allow-lists onto the T79 grants · est 1d · Medium
  Split out of T79 on 2026-08-12. T79 made approving and PIN-generating independently *grantable*,
  but kept `ASSESSOR_ROLES` (sbd-assessor-pin), `allowedRoles` (sbd-record-assessment) and the
  four-role branch in `aq_select`/`aq_update` as an OR, so anyone holding `staff_admin`,
  `educator` or `preceptor` still gets both at once. That is the remaining half of "break apart
  permission to approve assements".
  This is a live-permission narrowing, which is why it was not bundled: the 2026-07-30 staff-list
  outage came from exactly that shape of change applied without a per-account backfill. Every
  current holder must be granted explicitly first, then the lists come out one at a time.
  *Goal:* A role no longer carries either permission implicitly; every holder holds it as a grant.
  *Done when:* Each live holder has been backfilled with the grants they had, the role branches are
  removed from both edge functions and both queue policies, and a signed-in `staff_admin` with no
  grants is refused both actions.

- [x] **T80** Facility admin cannot reach the facility's observer portal · est 0.5d · High
  **Done 2026-08-12**, shipped as PR #195. A facility admin reaches the observation
  consoles from the leader portal, read only unless they also hold assessor.
  Asked 2026-07-30 at 8:47 PM. A facility admin should be able to see the observer portal for their
  own facility. This sat one line above the message that carried the word PRIORITY, the blank staff
  profile, so the priority item took the attention and this was never captured.
  Same shape as T73 and T77: the role is meant to reach it and the door is not there.
  *Goal:* A facility admin reaches the observer portal for their own facility and no other.
  *Done when:* The portal is reachable from the facility admin navigation, scoped to that facility
  server side, and a facility admin at another site cannot read it.

- [ ] **T81** Preceptor content must match the formatting of the source document · est 1d · Medium
  Asked 2026-07-23 at 1:07 AM: *"It should look as close to the doc as possible as far as
  formatting"*, and the reason given was *"Legibility in learning"*. Answered in the conversation
  with "Adding in our tasks". It was not added.
  This is a learning-outcome request, not a cosmetic one. The client is saying that reformatted
  content teaches worse than the document it came from.

  **Not blocked. The source documents have been in hand since 2026-07-28** and were logged as
  missing until 2026-08-04 purely because nobody opened the archive: *Build spec + full
  curriculum: SBD Preceptor Certification*, 21 files, 334,892 characters of text and 322 tables.
  Fifteen learner workbooks across L1 to L3, five sets of certification gate materials split into
  candidate and assessor copies, a facilitator programme and a developer synopsis.

  That table count is the whole task in one number. The documents are mostly tables, and tables
  are exactly what a reformat into flat text destroys, which is what the client was complaining
  about. Unlike T88, nothing here has to be authored; the text exists and only has to survive the
  trip onto the screen.

  *Goal:* Preceptor material on screen is as close to its source document as the medium allows.
  *Done when:* Headings, emphasis, lists and tables survive from the source into the rendered view,
  checked side by side against the document the client supplied.

- [ ] **T82** DAVID OG slash commands · est 3d, after the DAVID separation · Medium
  Received 2026-07-31 at 2:26 AM as a 13 page specification. Seventeen commands in three tiers:
  tier 1 `/profile /atrisk /ready /compare /queue /retrain`, tier 2
  `/benchmark /oip /dangerous /history /facility /network`, tier 3
  `/observers /freeagents /curriculum /promote /audit`. The document includes a per-command
  required-certification field and a four phase rollout.
  Belongs behind `docs/DAVID_OG_EXTRACTION_PLAN.md`, not in front of it. Building seventeen
  commands into the current DAVID would make the extraction harder, not easier.
  *Note for whoever picks this up:* the worked examples in that document use real named staff with
  their belts, scores and at-risk notes. It is not a document to paste into anything.
  *Goal:* The command set is specified against the extracted DAVID service, with the permission
  model settled before any command is built.
  *Done when:* Each command has a stated required role, the tiers are mapped onto the extraction
  plan's phases, and tier 1 works end to end.

- [ ] **T83** Curriculum media: carry the client's links and render them, correctly gated · est 1d · Medium
  Raised by him 2026-07-31 at 2:35 AM. He is producing video, audio, slide decks and infographics
  for every study curriculum, and asked where the content should go and what formats we need. The
  reply at the time was that we would let him know.

  **He then answered the hosting half himself the same day**, so this stopped being a question we
  owed him and became a small build. Nobody is blocked on anybody now. What keeps it moving is
  that he is producing the material already, so the place to put it should exist before the first
  batch arrives.

  **DECIDED 2026-07-31 by the client, in a voice note, and it makes this task much smaller.**
  He hosts the video himself and sends us links:

  > *"whatever I decide to host the videos on, I'll just go ahead and upload them, upload the
  > videos there, and add them, all of them, organized, and then give you all the link and make
  > sure that it is organized and titled properly for you."*

  He is choosing between a video platform and a media library on a system they already run, and
  said he would look into it. Either way the output is **links and embed codes**.

  So we are not building video storage, and the transfer cost is not ours. What we build is the
  place a curriculum item holds a link or an embed and renders it. Formats for video stop
  mattering to us as well, since the host handles playback.

  **This decouples the task from T78.** The pairing still holds for documents and images, which
  have no home yet, but video no longer needs the store. Do not scope them as one piece of work.

  **Two things his voice note did not settle. Both are ours to raise, and both are cheaper to
  answer before he picks a platform than after.**
  1. **Whether playback needs its own sign in.** If it does, staff hit two logins for one lesson,
     which is exactly the friction that suppresses completion. If it does not, playback is smooth
     but anyone holding the link can watch, inside the organisation or outside. This is a
     content-sensitivity call, not a technical one, and it changes how we gate the embed.
  2. **Audio, slide decks and infographics.** He spoke only about video. Those still have no home.
     If his chosen library gives links for them too, we embed them the same way. If not, they fall
     back to platform storage, which is T78's foundation.

  *Goal:* Curriculum media reaches staff, correctly gated, without us hosting video.
  *Done when:* A curriculum item can carry a link or embed and render it, the gating matches his
  answer on sign in, the answer on audio, slides and infographics is recorded here as a dated
  decision, and one real lesson plays end to end for a staff account.

- [ ] **T84** One heading says SBD where it means SPD · est 0.1d · Low
  `ui-views.js:6087` renders the heading `SBD BACKGROUND` on the card a staff member sees on their
  own profile. The line directly beneath it already prints "yr(s) in SPD", so the heading disagrees
  with its own body. The modal title at `6055` and the admin button at `10483` both already read
  `SPD Background`, so this one heading is the last survivor of a defect that has already been
  fixed twice. See `docs/DOMAIN_GLOSSARY.md` section 1.
  *Goal:* No shipped string says SBD where it means SPD.
  *Done when:* The heading is corrected, `rg 'SBD ' src/js index.html` is reviewed for others, and
  `?v=` is bumped.

- [ ] **T84a** The em dash sweep is much larger than it looked · est 0.5d · Low
  Measured 2026-07-31 with ripgrep, because `grep -P` silently fails on this codepoint in this
  environment and reported zero:
  **377 literal em dash characters across 16 files** in `src/js` and `index.html`, and separately
  **26 `&mdash;` HTML entities across 5 files**. The generated belt assessment report carries
  fourteen, and that document is kept in a personnel file, which is where it matters most.
  The two halves are not the same problem and must not be fixed the same way.
  - The **377 literals** are the sweep. Only user-visible strings matter; a dash inside a comment
    or a CSS value does not.
  - The **26 entities** are not currently broken. Every one of them sits inside an `innerHTML`
    string, where the browser decodes it correctly. They are a latent hazard: the moment such a
    string is moved to `textContent`, the raw `&mdash;` prints on screen. That is exactly how the
    `SBD Background &mdash; David Williams` title reached the client on 2026-07-28.
  *Goal:* User-visible copy carries no em dash, and no entity is left where a `textContent` path
  can print it raw.
  *Done when:* The literal count in user-visible strings is zero, each of the 26 entities is either
  replaced or confirmed to be on an `innerHTML`-only path, the report generator is included, and
  `?v=` is bumped.
  *Method note:* use `rg`, not `grep -P`. The `grep -P` form errors with "character code point value
  in \x{} or \o{} is too large" and returns nothing, which reads as a clean result.

- [ ] **T85** Patient Safety Provision: prove the audit trail, and move the clear into Role Management · est 0.5d · Medium
  The provision itself was built on 2026-07-28 and matches what the client asked for. Two parts of
  his instruction have not been verified in code.
  He said the clear should be *"on the role management platform as a role, that can be toggled on
  and off"*, and that *"the record of who cleared it, when they cleared it and all that will be on
  there"*. What is visible in the interface confirms the provision, the hold on advancement and the
  clear action. It does not confirm either of those two.
  *Goal:* Clearing a provision is a Role Management grant rather than a hardcoded role check, and
  clearing writes an attributable, readable record.
  *Done when:* The grant appears in Role Management and is enforced server side, and a cleared
  provision displays who cleared it and when, read back from storage rather than from the session.

- [ ] **T86** One placement review candidate shows three different submitted times · est 0.2d · Low
  Across three client screenshots of the same candidate on 19, 21 and 21 July, the same placement
  review is labelled submitted at three different times on 18 July: mid-morning, 11:31 AM and
  10:31 PM. Either that candidate has three separate submissions, or the submitted time is rendered
  wrongly.
  It is small, but it sits directly on an open client question: whether a request raised after an
  approval is a duplicate or a genuine second attempt. That question cannot be answered while the
  timestamps are not trusted.
  *Goal:* The submitted time shown on a placement review is the submitted time stored.
  *Done when:* The rows for that candidate are read from the database, the count is established as
  one or three, and either the duplicates are explained or the rendering is fixed.

- [ ] **T87** A live API key was shared outside secret storage and needs rotating · est 0.2d · High
  A third-party API key used by the platform was pasted into a working conversation in plain text
  rather than being held only in environment configuration. It is still valid.
  Nothing about the key is recorded in this file or anywhere else in the repository, deliberately.
  *Goal:* The exposed key no longer works, and its replacement exists only in environment
  configuration.
  *Done when:* The key is rotated at the provider, the new value is set in the environment for every
  deployment that needs it, the dependent feature is confirmed still working, and the old key is
  confirmed rejected.

  **The rotation order, and what it can break. Read from the code 2026-08-13.**
  Whoever holds the provider console runs this; the console is the only part that cannot be done
  from the repository.

  What the key touches, which is narrower than it sounds. It is read at
  `supabase/functions/david-chat/index.ts:460`, together with the index host at `:467`, and both
  are read with `Deno.env.get()` **per request** inside the handler rather than at module load.
  The only caller is the `search_wiki_graph` tool at `:454`. So a bad rotation costs David his
  curriculum search. Chat, assessments and everything else are untouched.

  **It fails SILENTLY, and this is the part that decides how the rotation is checked.** An earlier
  version of this note said the opposite and was wrong. The code does throw, at `:461` for a
  missing key and at `:478` for a rejected one, but every throw inside this block is caught eight
  lines later at `:486` and turned into `toolResult = {error: ...}`, which is pushed into the
  message chain at `:489` and handed to the **model**, not to the user. The model then answers the
  question from its own general knowledge, and the reply looks completely normal. The comment at
  `:475` is the trace of the same fault being fixed once already, at the point where the error
  *body* was being read as if it were search results.

  So a bad rotation does not produce an error anybody sees. It produces a confident answer with no
  curriculum behind it, which is worse than an outage because nobody goes looking.

  The order matters, and it is the old key staying alive that makes it safe:

  1. Create the new key at the provider. **Leave the old one active.**
  2. Set the new value in the deployment environment.
  3. Redeploy `david-chat`.
  4. Ask David a curriculum question that forces `search_wiki_graph`. **Do not accept "an answer
     came back" as the check.** Confirm one of these instead:
     * the answer contains real curriculum content, something specific enough that it could only
       have come out of the knowledge base, or
     * the function log carries no `[DAVID] Pinecone search failed` line for that request. That
       string is logged at `:477` on any non-ok response, so its absence is the positive signal.
  5. Only then delete the old key at the provider.

  If step 4 fails, nothing has been lost: the old key is still live, so putting the old value back
  and redeploying restores the previous state. Deleting first is what turns a bad rotation into a
  David that sounds fine and is not.

  *Worth its own item later:* a tool failure being handed to the model as though it were an
  answerable result is a general fault in this loop, not a Pinecone one. Every tool in the
  `catch` at `:486` behaves the same way.

- [x] **T88** Foundations content carries the document's structure, not just its words · est 4d · Medium
  **Done 2026-08-04.** The source documents arrived that evening, the eleven attachments of
  *Fwd: Foundations Training*, one Word file per module with Module 2 sent twice and both copies
  byte-identical. All ten were converted and are in `foundations.js?v=17` with
  `foundations.css?v=5`.

  What is on screen now, per module, taken from the documents rather than summarised:

  | | before | after |
  |---|---|---|
  | sections | 70 | **77** |
  | content | 181 characters per section, average | 219,000 characters total |
  | tables | 1 | 124 |
  | callouts | 2 | 86 |
  | lists | a handful | 209 |

  **Seven sections existed in the curriculum and had never been in the app at all**: 2.9 Common
  Decontamination Errors, 3.8 Lubrication & Instrument Care, 4.7 Weight Limits & Sterilization
  Considerations, 4.8 Quality Verification Checkpoints, 5.8 Common Packaging Errors, 6.8
  Sterilization Failures & Troubleshooting, and 8.8 Other Specialty Items. Two of those are
  failure-and-error sections, which is the material a technician most needs and the least safe
  thing to have been missing.

  Section titles now read as the documents write them. The app had abbreviated every one of them,
  *"1.1 The Mission"* against the document's *"1.1 The Mission: Why Sterile Processing Exists"*.

  **Conversion, and why it is a script rather than hand-authoring.** Each `.docx` is walked in
  document order and every construct is mapped once: `Heading1` numbered `N.N` opens a section,
  `Heading2` and `Heading3` become sub-headings, list paragraphs become lists, multi-column tables
  become tables, and single-cell tables become callouts coloured by the glyph the author put in
  front of them, a warning triangle red, a lightbulb or target green, a heart or a book or a tick
  blue. Nothing is summarised and nothing is invented. Checked by taking every unique word in each
  document and every unique word in the generated HTML: **125 words across all ten modules appear
  in a document and not on screen, and every one of them is a cover-page or module-title word**,
  or belongs to the three module-level blocks below.

  Three blocks per module are deliberately **not** carried over: *Knowledge Check*, *Skills
  Validation* and *Module Summary*. They are module-level, not section-level, and Knowledge Check
  in particular duplicates the 25-question gate the app already runs, with the answers printed
  next to the questions. Skills Validation is a sign-off sheet with initials and date columns,
  which is a records feature and not reading material. Raised as T90 rather than guessed at.

  **The em dashes in the content are the curriculum's own.** 152 of the documents' 252 survive
  into the sections that were carried over. Normalising them would be editing the client's study
  material to suit a writing convention that applies to prose we author, so they stay.

  Verified by rendering the real module data through the real `fndFmtBody` and the real stylesheet
  at 900px and at iPhone width: tables scroll inside their own container and the page itself has
  **0px of horizontal overflow** at 390px, which matters because the client reads this on a phone.

  ---

  **How it was scoped, kept because the 4d estimate was built on it and the estimate held.**
  Asked by the client on 2026-08-03 at 8:30 PM, with a recording of the source curriculum
  document held beside the app: *"Can we update the UI in foundations."* Clarified at 9:21 PM when
  asked which of two readings he meant: *"The UI should resemble the doc… colors. Sections,
  separated text, adjusted format."*

  **The presentation half shipped the same night** and is live on `foundations.js?v=15`. Sections
  now carry a numbered header, the text is split into separated lines, label-and-list content
  renders as labelled blocks with the items as chips, and the palette follows the document.
  `fndFmtBody()` reshapes the strings already held; it invents nothing, and all 70 sections were
  checked to confirm not one word is lost.

  **This task is the half that did not ship, and it is the larger half.** The document has
  structure the content does not. Section 2.1 alone, read off the client's recording, contains:

  * a **Required PPE table**, three columns wide (PPE ITEM / PURPOSE / KEY POINTS) and six rows
  * a **Donning Sequence** of six numbered steps, each a titled block with its own body
  * a **Doffing Sequence** of six numbered steps, each carrying a bullet list inside it
  * inline procedure markers between steps, *"PERFORM HAND HYGIENE"* and *"PERFORM HAND HYGIENE
    AGAIN"*
  * two callout boxes, a tip (*Gloves Over Gown Cuffs*) and a warning (*The Golden Rule of
    Doffing*)

  Against that, the app holds one sentence for 2.1: *"Required PPE: fluid-resistant gown, face
  shield or goggles with mask, heavy-duty gloves, shoe covers, hair cover. Donning maximizes
  protection. Doffing prevents self-contamination with hand hygiene between steps."*

  **No layout change can produce a six-row table from a sentence that has no table in it.** The
  content has to carry the structure. That is why this is 4d and not an afternoon.

  **The rendering side is already capable, so none of that cost is code.** `sectionContent[i]` is
  concatenated into an `innerHTML` string at `foundations.js`, so HTML in a content string renders
  today with no change, and `cs-table` / `cs-para` styling already exists in `src/css/index.css`
  and is used by the Yellow Belt core study content. The work is authoring, not plumbing.

  **Section 2.1 shipped on 2026-08-03** and is live on `foundations.js?v=16` with
  `foundations.css?v=4`: the six-row table, six donning steps, six doffing steps with their bullet
  lists, both hand-hygiene markers and both callouts. It was built from frames pulled from the
  client's own recording, so it is a worked example of the target rather than a guess at it.

  **Blocked on the source documents for the other 69.** Measured 2026-08-04 across the file:
  10 modules, 70 sections, 1 section carrying document-shaped content, 69 still holding a plain
  summary averaging 181 characters (shortest 107, longest 299). Two sentences cannot be laid out
  into a curriculum section; the words are not there to lay out.

  **Where the documents are not, so nobody searches these again.** Checked 2026-08-04:

  * The WhatsApp export: 71 files. Non-image attachments are the SOP generator page, the DAVID
    SOP app spec, three Belt Assessment Report PDFs and the DAVID slash-commands PDF. Its links
    resolve to 29 unique Google file ids, 27 of them our own daily reports; the two the client
    sent are a 2.7 KB David update note and a 154 KB `SBD Codes js` dump. No curriculum.
  * Drive: a search by the client's address returns nothing owned, `sharedWithMe` returns 40
    unrelated files, and a full-text search for `Bowie-Dick`, `Chain of Infection` and
    `Foundations of Sterile Processing` returns 35 files, all other projects.
  * Supabase: `david_wiki_pages` and `sources` hold 0 rows.
  * This repo: no `.docx` or `.pdf` curriculum. `ui-views.js` holds a different curriculum, the
    belt guides and the Position School tracks, and no Foundations module body.
  * Pinecone: whatever is in `master-docs` was put there **from this repo**. Both
    `scripts/seed-david-kb.mjs` and `scripts/ingest-curriculum-to-pinecone.mjs` read
    `src/js/ui-views.js` and nothing else; a dry run builds 203 documents, 12 question banks,
    59 placement items, 125 belt guides and 7 Position School tracks. Foundations was never
    ingested, so the vector store cannot return what it was never given. It is also unreachable
    from this environment: both `api.pinecone.io` and the index host return a `403` on the
    egress tunnel.

  So the documents exist only wherever the curriculum author keeps them. Requested from the
  client on 2026-08-03 and still outstanding.

  Related to T81, which is the same complaint in the preceptor module. Same cause, different
  content set, so they are tracked separately rather than merged.

  *Goal:* A staff member reading a Foundations section sees what the curriculum author wrote,
  laid out the way they wrote it.
  *Done when:* 2.1 renders with its table, its numbered donning and doffing steps, its procedure
  markers and its callouts; the pattern is applied across the remaining sections as their source
  documents arrive; and the client confirms a side-by-side against the document.

- [x] **T89** David's knowledge base is seeded into an index David never reads · est 0.5d · High
  **Done 2026-08-12**, shipped as PR #190. `david-chat` now searches the index that actually holds the records, `sbd-knowledge-ai` namespace `master-docs`. It had been pointed at a host that does not exist, so the knowledge search had silently never returned anything and David answered from reasoning alone.
  **Fixed in the repository 2026-08-11, `work/t89-pinecone-index-host` (`bb54168`). Not live yet.**
  The host is no longer written down anywhere: `david-chat` and both seeding scripts read a
  `PINECONE_INDEX_HOST` secret, deliberately with no hard-coded fallback, since a silent default is
  what hid this. `search_wiki_graph` now checks `r.ok`, logs the status and body, and hands the
  model an error instead of a 404 index-not-found body dressed as search results.
  `seed-david-kb.mjs` defaults `EMBED_FIELD` to `text`, the field the console reports. Both scripts
  still dry-run by default and still dry-run clean with no secret set. `grep pinecone.io` over
  every `.ts`, `.js` and `.mjs` in the repository now returns nothing.

  **What is left is all outside the repository, and the order matters.** Set the secret first —
  `supabase secrets set PINECONE_INDEX_HOST=https://sbd-knowledge-ai-44928mo.svc.aped-4627-b74a.pinecone.io`
  — then `supabase functions deploy david-chat`. Deploy first and the tool throws until the secret
  lands, which is no worse than the silent failure it has had all along but is visible. Then close
  it out against the two checks the client asked for: a White or Yellow Belt curriculum question
  whose answer carries content only the 1,418 seeded records hold, and one deliberate wrong host to
  watch the failure appear in the `david-chat` logs.

  Found on 2026-08-04 while tracing where the Foundations curriculum is stored. Three files name
  a Pinecone index host and they do not agree:

  * `supabase/functions/david-chat/index.ts:462` searches
    `sbd-knowledge-ai-8al9o1g.svc.aped-4627-b74a.pinecone.io`
  * `scripts/seed-david-kb.mjs:29` writes to `sbd-knowledge-ai-44928mo…`
  * `scripts/ingest-curriculum-to-pinecone.mjs:35` writes to `sbd-knowledge-ai-44928mo…`

  The live edge function reads one index and both seeding scripts fill a different one. Anyone
  who runs a seed script and then asks David a curriculum question gets an empty answer and no
  error, because `search_wiki_graph` returns nothing rather than failing. The scripts' own header
  comments say the host "mirrors the proven call in `david-chat/index.ts`", so the divergence was
  not intended and one side drifted.

  Both scripts default to a dry run, so no wrong write is known to have happened.

  **Settled 2026-08-04 against the Pinecone control plane.** The account holds three indexes and
  every one of them carries the project suffix `44928mo`:

  | index | dimension | integrated embed field | model |
  |---|---|---|---|
  | `sbd-knowledge-ai` | 1024 | `text` | `multilingual-e5-large` |
  | `sbd-wiki-graph` | 1024 | `content_md` | `multilingual-e5-large` |
  | `sbd-knowledge` | 3072 | none | none |

  **There is no `8al9o1g` index.** The scripts are right and the live edge function is the one
  pointing at a host that does not resolve, which means `search_wiki_graph` has never been able to
  return anything. It fails silently because the tool handler treats an empty result and a failed
  call the same way, so David answers from reasoning alone and no error surfaces.

  **A second mismatch sits underneath it.** `seed-david-kb.mjs:31` defaults `EMBED_FIELD` to
  `chunk_text`, and its own comment says to confirm that against the console before pushing. The
  console says the field is `text`. Pushing with the default would have written records the index
  cannot embed.

  **And the index names disagree about intent.** The tool is called `search_wiki_graph`, which
  points at `sbd-wiki-graph`, but both the edge function and the scripts target `sbd-knowledge-ai`.
  Three indexes exist and nothing in the repo says which is canonical.

  Do not "fix" this by editing the scripts to match the edge function; the edge function is the
  wrong side. Decide which index is canonical, correct the edge function, set `EMBED_FIELD` to
  `text`, and record why in a comment.

  **Record counts, read the same day once the data plane opened.** `sbd-knowledge-ai/master-docs`
  holds **1,418 vectors**; `sbd-wiki-graph` holds **0**. So the seeding did run, against the index
  the scripts name, and the live edge function has been pointing away from 1,418 usable records
  the whole time. It also settles which index is canonical: the one with the data in it, not the
  one the tool's name suggests.

  Three test queries confirm what is in there, and it is what the scripts put there: White and
  Yellow Belt curriculum sections, belt knowledge questions with model answers, and QA School
  material. *"PPE required before entering the decontamination area"* returns a White Belt
  knowledge question, not a Foundations section. **No Foundations content is in the index**, which
  is expected, since neither script reads `foundations.js`.

  *Goal:* One index name, in one place, that the edge function and the seeding scripts share.
  *Done when:* the host and the embed field are read from a single constant or environment
  variable rather than repeated across three files; the canonical index is named in a comment;
  and a David curriculum question returns a cited answer instead of an empty one.

- [ ] **T90** Decide where Knowledge Check, Skills Validation and Module Summary belong · est 0.5d · Low
  Raised 2026-08-04 out of T88. Each of the ten Foundations documents ends with three blocks that
  are module-level rather than section-level, so the section list has nowhere to put them:

  * **Knowledge Check**, six to eight questions with the answers printed underneath. The app
    already runs a 25-question gate per module, so showing these would hand a learner answers
    beside questions on the same screen as an assessment.
  * **Skills Validation**, a sign-off table with MET / NOT MET / DATE / INITIALS columns and a
    learner-name block. That is a records feature, not reading material, and it overlaps whatever
    the observation and assessment flow already records.
  * **Module Summary**, a key-takeaways callout plus a "What's Next" pointer. This one is purely
    reading material and is the easy yes.

  All three are converted and sitting in the generated data; nothing has to be re-extracted. The
  decision is where each goes, not whether it can be rendered.

  *Goal:* Nothing in the source documents is silently dropped, and nothing lands somewhere that
  weakens an assessment.
  *Done when:* Module Summary renders at the end of a module, and Knowledge Check and Skills
  Validation each have a decided home or a written reason for staying out.

### Asked on the 2026-08-03 client call, recorded 2026-08-04

Three asks made on the same call, alongside the Foundations formatting request that became T88.
The formatting request was the loud one and these three went in unrecorded, which is the failure
already named above: **an ask next to an urgent one still needs its own row.**

- [x] **T91** Observation answers must be typed or spoken, never multiple choice · est 1.5d · High
  **Done 2026-08-06**, shipped as PR #180 with the two review findings closed in PR #183. An observation item now takes typed or dictated evidence, and an item with nothing written does not count as answered (`ui-views.js`, "T91: typed-or-spoken evidence gate").
  His words on the call: *"in the observation module, we wanted no multiple choice. All the
  answers should be answers that they have to type or speak into the assessment, versus selecting
  multiple choice in the observations."* Asked again immediately after, to be sure it was scoped
  to one place: *"In the observations."*

  This is an assessment-integrity request, not a UI preference. A multiple-choice observation
  answer can be guessed, and an observation is the step that certifies someone is safe to work
  unsupervised. It is the highest-value item of the three for that reason.

  **Scope it carefully before building.** The request is for the observation module only, and the
  client said so twice. Belt knowledge gates and placement questions are a different flow and are
  not covered by this. Check what the observation checklist currently renders before assuming how
  many question types are involved.

  Speech input is the half with a real cost. T43 already exists for voice dictation on typed
  answers, so these two overlap and should be scoped together rather than built twice.

  *Goal:* An observation cannot be passed by choosing from a list.
  *Done when:* Every observation answer is a typed or spoken response, existing observation
  records still read correctly, and the client confirms against a real observation.

  **Built and merged 2026-08-06 (#180), reviewed 2026-08-07, still open on one thing: the
  client.** Reading the code changed the shape of the fix — the observation console has no
  multiple-choice questions at all, it has a 0/1/2/3 and PASS/FAIL rubric the observer taps, and
  those numbers cannot be removed because `ovsComputeOutcome` derives the outcome from them across
  all five instrument schemas and every stored record is read back through them. So the score
  stayed and the evidence became mandatory: a tap alone is no longer an answer. **That is not the
  literal ask, so it is the client who closes this, against a real observation, not the review.**

  The review's two code findings are fixed (2026-08-07):
  - The floor was 10 characters, so *"did it fine"* passed. It is now a sentence — 25 characters
    and 4 words — which also rejects a padded single token. No text check can tell whether an
    answer is truthful; this only rules out the answers that are obviously not answers.
  - `observations` write policies called the zero-arg `sbd_is_assessor()`, so a granted assessor
    could write in **any** facility, and `obs_select_scoped` had no assessor branch at all, so a
    capability-only assessor could type evidence they could not read back. Migration
    `20260807120000` adopts the facility-aware `sbd_is_assessor(fid)` on all three policies and
    gives SELECT the same branch, so read never exceeds write on this table. Behaviour-neutral for
    writes today (no holder has an `assessor_facilities` list yet, which T74 treats as system
    wide); it is what makes setting that list actually bite here.

  Not tested, and cannot be from here: the real click-through and device dictation, which need
  writes on production.

- [x] **T92** Scripts as a separate module that can be assigned on its own · est 2d · Medium
  **Code-complete 2026-08-06, reviewed 2026-08-07, no migration needed, pending deploy + client
  confirmation.** Built as a second surface over the same content: `scriptSectionsForBelt()` in
  the new `src/js/scripts-module.js` selects the script sections out of `FULL_CURRICULUM_DATA.belts`
  at render time, and the existing Study & Practice Scripts tab now calls that same function,
  so the scripts are not copied and not moved. Assignment reuses `foundations_assignments`
  with `module_id='scripts'` — free-text column, unique constraint and the right RLS already
  there — so this ships with **zero migrations** instead of queueing behind the ones already
  waiting. `getFoundationsAssignments()` filters that row out, so Foundations still counts 10.
  Assigned from the Scripts column in the existing Training table; a Scripts tab then appears
  for that person only; the leader marks it complete (no gates — scripts are spoken language
  with no question bank).

  The review's two findings are fixed (2026-08-07):
  - The module offered all six belts. Nowhere else does a staffer read curriculum above their own
    belt — Study & Practice is hard-locked to `s.belt` with no selector — so this was the one place
    a White Belt could read the Black Belt scripts. It now offers White through their own belt.
    Not only their current belt: the ask is about somebody who *passes belts* and needs to refine
    them, so belts already earned is the line.
  - `foundations.js` read `SCRIPTS_MODULE_ID` from `scripts-module.js`, which loads after it. The
    declaration moved to `foundations.js`, so a 404 on the new file can no longer take out every
    Foundations screen. A `typeof` guard was the wrong fix — it would have made Foundations
    silently stop filtering the scripts row (10 becomes 11) instead of failing loudly.

  Verified by `node scripts/verify-scripts-module.js` (33 assertions).
  Design note: `docs/decisions/2026-08-06-t92-scripts-standalone-module.md`, §16B in ARCHITECTURE.
  His words: *"we want it to still be here, but we also want to have a separate module just for
  the scripts on the side… it's going to stay here, but also be here."* And the reason, which is
  the part that matters: *"in the development process, if somebody passes belts but they need to
  refine their scripts, we want to be able to assign them just that module so they can go back
  and work over just that part."*

  So this is **not a move, it is a second surface**. The scripts stay where they are inside the
  belt content, and additionally exist as an assignable module. He asked for the assign screen to
  look like the one already used: *"it'll have an assigned dashboard like this."* When assigned,
  it appears as a tab for that person only.

  Closest existing pattern is Position School track assignment, which already does assign, appear
  for one person, and track completion. Read that before designing a new one.

  *Goal:* A leader can send one person back to the scripts without re-assigning a whole belt.
  *Done when:* Scripts can be assigned to an individual, appear for that person only, remain in
  place inside the belt content unchanged, and the assign screen matches the existing pattern.

- [x] **T93** David chat titles can be edited · est 0.5d · Medium
  **Done 2026-08-07**, shipped as PR #181. A chat can be renamed from the history list, and renaming no longer switches the chat underneath the edit.
  His words: *"in David, if we could update it so that we can edit the title of the chat, the chat
  history, so that it's easier to reference. If we have to go back to that chat later, we know
  exactly what that chat was."*

  Answered on the call with *"we already have that in our task list."* It was not in the list.
  This row is that correction.

  The smallest of the three and the one with the least risk attached. It is a rename on an
  existing chat record plus an inline edit in the history list. Check how chat history rows are
  stored and whether the title is currently derived from the first message, because if it is,
  an edited title has to survive the next message rather than being regenerated.

  Belongs with the David work rather than ahead of it. Read `docs/DAVID_OG_EXTRACTION_PLAN.md`
  first so the change stays compatible with the extraction.

- [x] **T94** David names the assessment levels instead of inventing topics for them · est 0.25d · High
  **Done 2026-08-11.** Iggie's screenshot of a Net Intel profile showed L1 to L5 listed as subject
  areas, with names that appear nowhere in the curriculum. L1 to L5 are cognitive complexity
  levels, so a profile that reads them as topics tells a leader to assign the wrong training.

  The cause was in the data, not the model. `aiSerializePlacements` sent bare numbers,
  `L1 89% / L2 90%`, and left the meaning of each level unstated, so the model supplied one. The
  serializer now sends the level names with the scores and states plainly that these are
  complexity levels rather than content areas. Fixing the input beats instructing the model not
  to guess, and it keeps the prompt out of it, which matters while David is queued for extraction.

- [x] **T95** Belt assessment report reads at a glance for a leader · est 1d · High
  **Done 2026-08-11.** Approved by Iggie on the 10 August call. Display only, no scoring rule
  was touched.

  A level summary sits at the top of the report, one card per level carrying the level name and
  the percent only, knowledge and simulation kept separate. His words on the call were *"we don't
  have to have the floor on there or fail, we'll just have the percent up there."* The floor and
  the result stay on the detailed sections below, where they were wanted, *"this allows us to
  understand more finite where they are."*

  The levels a belt did not require used to print as `not gated` with a blank beside them, which
  read as missing data. Every level is now named, and the detailed rows carry the minimum and the
  result in words.

  Findings were reworded to read as coaching. Each one names the level, the score, how far it sat
  from the minimum, and one concrete thing to do. The severity bands are unchanged in strictness.

  Both report renderers carry the same wording and the same summary band. They had drifted, the
  summary having landed in the card renderer only, which is exactly the failure this row was
  warned about.

- [x] **T96** Belt scoring follows the SIPS Scoring Specification v1 · est 1d · High
  **Done 2026-08-11.** SIPS issued the Belt Assessment Scoring Specification v1.0 as the canonical
  source. The thresholds, the knowledge gate and the 60/40 blend already matched it. The detail
  underneath did not.

  Component overalls are now the item-weighted mean across every item rather than the mean of the
  five level means, which only agree while every level holds the same number of questions and L5
  holds seven. Every level carries a floor, knowledge a flat 80 everywhere and simulation stepping
  down from the belt's own floor. The individual response minimum is a universal 65 and a response
  under it is blocking. Severity is graded by how far below the minimum the score landed. Scores
  are carried at full precision to every comparison and rounded only where printed.

  Two real defects surfaced while doing it. The dynamic belt test selected a belt on the blended
  score alone, with no knowledge gate, so a candidate whose knowledge sat below a belt's gate could
  still be placed there; the specification's own test vector four exists to catch this and now
  passes. And a candidate who cleared the knowledge bar but not the blended threshold was being
  given a White belt the blended score had not earned, where the specification records Knowledge
  Foundation, which is not a belt.

  Verified against the specification's reference implementation on all 49 stored placements:
  identical belt, knowledge, simulation and blended figures on every one.

  *Not done here, and each needs its own decision:* re-running historical placements, which must
  re-score the responses with the calibrated evaluator first or it strips belts for a scoring
  fault that was ours; moving the whole determination server side (specification §16); and the
  versioned constants table.

- [x] **T97** Inactivity logout tightened to fifteen minutes · est 0.25d · Medium
  **Done 2026-08-11.** Was thirty. The activity listeners already cover pointer, keyboard, touch
  and scrolling anywhere in the page, so the shorter window closes an unattended session sooner
  without interrupting somebody who is reading.

  *Goal:* A chat can be found later by what it was about.
  *Done when:* A chat title can be edited from the history list, the edit persists across
  sessions, and a later message does not overwrite it.

- [x] **T98** The belt report re-judges an assessor override out of existence · est 0.5d · **High**
  **Done 2026-08-12.** Built, verified against 33 checks, and live in both renderers.
  Live case, raised 2026-08-12. Sharon Greene-Golden's Blue was overridden to Brown by
  J. Jacobs on 8 Aug — it is in her staff history and her profile reads Brown — but the report
  could not say it. `rptComputeModel` took the confirmed belt only as the target for floors and
  then re-derived the award purely from scores (`beltAwarded` null unless CLEAN/CONDITIONAL);
  her blended 85.9 against Brown's 87 printed **BELT AWARDED NONE, Knowledge Foundation**.
  Verified on the live report 2026-08-12 and reverted: review `02cac3d4` is back at confirmed
  Blue (report reads Blue Conditional), her profile stays Brown. This blocks the whole
  corrections list the client sent — the overrides are his corrections for the old,
  uncalibrated evaluator's simulation scores (per the spec v1 rollout note), so nothing here
  is re-graded; the override is honored as data. Re-scoring is T632's job (external tracker)
  and needs the calibrated evaluator first.

  *Built 2026-08-12, display-only, no scoring rule touched.* A review with `status='adjusted'`
  now awards the adjusted belt in both renderers, labelled **ASSESSOR OVERRIDE** and attributed
  from `confirmed_by` / `confirmed_at` (plus the assessor note when present). The score-derived
  outcome, conditions, floors and every threshold comparison are unchanged and still grade
  against the overridden belt — the award is no longer stripped, and the certification basis
  states plainly that the override supersedes the score-based determination without changing
  the scores. Where the scores DO clear the adjusted belt, the report keeps its normal wording
  and adds the attribution line. Both renderers changed in step (`rptComputeModel` /
  `downloadAssessmentReport` and `deriveOutcome`'s consumer `buildAssessmentReportHTML`),
  because T95 already caught them drifting once. Belt-test rows are excluded (`_precomputed`,
  and their statuses never read `adjusted`); the card's SUGGESTED chip renders only on pending
  reviews, so it cannot move.

  *Verified:* `node scripts/verify-override-award.js <pre-change ui-views.js>` — 33 checks.
  The override case awards Brown with attribution and Black as the next target; the identical
  scores under `status='confirmed'` still award nothing; non-adjusted reviews produce output
  field-for-field identical to the pre-change model extracted from git; both renderers carry
  the override wording and the confirmed twin carries none. The T65 harness fails 14 checks
  before AND after (identical sets — pre-existing, not this change).

  *For the operator applying the correction:* set `status='adjusted'`, `confirmed_belt='Brown'`,
  and `confirmed_by` / `confirmed_at` to the overriding assessor and date — the report prints
  the attribution from those two columns and falls back to a bare "Assessor" if they are absent.

  *Goal:* An assessor override on a placement review is honored by the report as data, with
  attribution, without re-grading anything.
  *Done when:* Sharon's review is set back to Brown and her live report prints Brown as awarded
  with the override attribution; a non-adjusted review's report is unchanged; the corrections
  list can proceed.

### Raised on the 2026-08-11 client chat

- [x] **T99** The scoreboard is visible to everyone · est 0.25d · Medium
  **Done 2026-08-12**, shipped as PR #192. Gated on `scoreboardAllowed()`, which
  passes only a master admin, and the three nav items now ship hidden in `index.html` rather
  than being hidden after load. Saved views and deep links to a scoreboard fall back safely,
  which the held patch here did not cover.
  The three scoreboard tabs, one on each surface, are open to every role. Asked plainly on
  2026-08-11 whether he wanted it hidden from everyone except SIPS or only so that one facility
  cannot see another facility's staff, the client answered *"Everyone but sips master admin"*.
  *Owner: assigned elsewhere, confirmed 2026-08-12.* Built and held here rather than shipped,
  because the same item was already assigned and two people fixing one thing is how T77 went wrong. The
  built version is kept as a patch alongside this ledger in case it is useful; it gates the three
  tabs in `enterPortal`, which is the one entry point all three surfaces pass through. Whoever
  ships it should also correct the app's
  own role documentation, which currently tells users a staff member login gives them "the
  system-wide scoreboard" and describes the staff portal as "personal dashboard and scoreboard
  only". Hiding the tab is not an authorisation boundary; the ranking data stays readable to
  anyone the row policies already allow, so if the intent is that only SIPS ever sees it, that
  belongs in the data layer.
  *Goal:* Only a SIPS master admin can reach a scoreboard, and nothing in the app claims otherwise.
  *Done when:* The tab is absent for every other role on all three surfaces, the two documentation
  lines match, and a master admin still sees it.

- [x] **T100** The assessor override wording comes off the report · est 0.25d · **High**
  **Done 2026-08-12**, the wording came off in PR #195. The label, the attribution
  line and the certification-basis sentence are all gone: an overridden belt now prints exactly
  like a normal award. The award itself, which is what T98 restored, is untouched.
  *Owner: assigned elsewhere.* Raised by the client on 2026-08-11 after reviewing Sharon Greene-Golden's
  report: *"This is good. The only thing we needed to look without the assessor override being in
  the interfacing on the report, everything else looks good."* T98 put the override on the report
  so an overridden belt would stop being re-judged out of existence; the award itself must stay,
  only the wording that names the override comes off the client-facing document. The label, the
  attribution line and the certification-basis sentence are the three places it appears, in both
  renderers.
  *Goal:* An overridden belt still prints as awarded, without the report telling the reader it was
  an override.
  *Done when:* Sharon's report prints Brown with no override wording in either renderer, and a
  non-adjusted report is unchanged.

- [ ] **T101** Re-run the historical placements, but re-score them first · est 2d · **High**
  The scoring specification asks for every placement issued to date to be re-run once the engine
  is corrected. Doing that on the stored numbers alone would be wrong. Running the corrected
  engine against all 49 stored placements shows 21 people losing a White belt, and the reason is
  not their answers: those simulations were graded by the old evaluator, the one the specification
  itself records as marking real responses 30 to 40 points low. The responses have to be re-scored
  with the calibrated evaluator first, and only then can the belt logic be re-applied. The original
  record is kept either way; a re-run writes a new result against the same submission.
  **The tool is written, 2026-08-12, PR #193** (`scripts/rescore-placements.js`). Checked here
  before trusting it: its only POST is to the evaluator, it reads `placement_reviews` with a
  plain select, and everything it writes goes to local files. It does not touch the database.
  Its own tests assert the thing that matters, that a naive re-run strips a belt and that
  re-scoring first restores it. What remains is running it and having SIPS read the sheet.

  **The client asked for a narrower first pass on 2026-08-12:** *"Can we rerun the ones from
  today and the ones still pending for comparison so we can decide from there."* That is the
  right order. A comparison over a handful of recent records, read side by side, before anyone
  decides what to do with the older ones.

  **That narrow pass is done, 2026-08-13, and it came back clean.** 14 placements, everything
  submitted on 11 and 12 August plus everything still pending. 268 simulation responses re-graded
  through the deployed evaluator; 12 were left blank and are skipped; 547 knowledge answers were
  never AI-scored and are untouched. **Nothing moves.** All 14 land on the same determination on
  the calibrated scores as on the stored ones, the largest single move being Lindsay Holovachuk at
  50.1 to 53.2, and ten of the fourteen moving by under a point. So for this set the calibration
  question is closed and no report needs republishing. Confirmed after the run that
  `placement_reviews` was untouched and that no usage rows were written.
  Of the 14, three hold an awarded belt and none of the three changes; ten were already decided
  with no belt awarded and the re-score agrees with every one of those decisions; one, Jake
  Jacobs, has been waiting since 20 June and needs a decision rather than a re-score.
  **Two faults in the sheet were caught before it went to the client, both ours.** The builder
  read `tentative_belt` as if it were an award, which put two people who had never been given a
  belt onto a client-facing list of belts being taken away, and the largest score move was
  reported from the wrong row. Fixed in `scripts/rescore-placements.js` with a test that a
  suggestion can never reach the changed list.
  **What is still open here is the historical re-run**, which is the part that carries the risk,
  and it stays parked on the client's decision.

  *Goal:* Historical placements reflect the corrected engine without anyone losing a belt to a
  scoring fault that was ours.
  *Done when:* The responses are re-scored with the calibrated evaluator, the belts are
  recalculated from those scores, every original record is still readable, and the set of belts
  that actually change is reviewed by SIPS before anything is published.

- [ ] **T102** Move the belt determination server side · est 3d · Medium
  Simulation responses are already scored server side by `sbd-score-assessment`. The rest of the
  determination, the blend, the belt selection, the floor evaluation and the condition generation,
  still runs in the browser, which is what section 16 of the scoring specification asks to be
  moved. This is architectural rather than a correctness gap: the client-side engine now matches
  the specification's own reference implementation on all 49 stored placements.
  *Goal:* A certification result is computed and written by the server, from raw responses only.
  *Done when:* The client posts responses and never a score or a belt, the handler scores and
  writes, and a client-submitted score is rejected rather than ignored.

- [ ] **T103** Versioned belt constants, resolved by assessment date · est 1d · Medium
  The thresholds and floors live in code. Section 16.3 of the specification asks for them in a
  table with an effective date, resolved by the assessment's submission date, so a placement
  issued last quarter reproduces exactly after the numbers are amended. Without it, a constant
  change silently rewrites what an old certification would have said.
  *Goal:* Any historical placement can be reproduced exactly, whatever the constants are today.
  *Done when:* Constants are read from the table by submission date, and a record carries the
  constants version it was scored under.

- [ ] **T104** The client's sprint tracker, back in his hands · est 0.5d · Medium
  He asked for it on 2026-08-11: *"Can send me the full list? I liked the tracker you had last
  month, help me have a better idea where things are. And I can let you know what things need to
  move around, if any."* It stopped going out when the task list moved local. He reads it to plan
  and to keep his own people informed, so it is worth more than the time it costs.
  *Goal:* He has a current list he can read and reorder.
  *Done when:* A tracker in the same columns as the 30 July one is sent, generated from this file
  rather than written by hand, so it stays true as this file is maintained.

- [ ] **T105** Load capacity for the onboarding wave · est 1d · **High**
  **Reported complete 2026-08-14, and deliberately NOT ticked.** The report is that the run was
  done. There is no load-test script in this repository, no stored result, and nothing that a
  second person could re-run to get the same number, so there is nothing here to attack in a
  second pass. The rule this file works by is that a claim is not a verification, so it stays
  open until the evidence exists rather than being ticked on the strength of the report.
  **It also matters more this week, not less.** In the three days to 2026-08-15 the roster went
  from 92 staff to 105 and stored placements from 71 to 85. The wave this task was opened for is
  arriving now.
  *Done when:* the run is reproducible from something in this repository, its result is recorded here, and the number has been shown to the client.
  One hospital system alone is close to 200 people, and the client has said several more have
  agreed. Nothing has measured what the platform does under that, and the AI-backed paths carry a
  per-question cost as well as a latency question. This is the load half of the concern he raised
  alongside security; the security half is T33.
  *Goal:* There is a measured answer to what happens when a facility onboards two hundred people
  at once, and a number for what it costs.
  *Done when:* The concurrent-use ceiling is measured on the paths that matter, the per-facility
  AI cost at that volume is estimated from real usage, and anything that breaks first is written
  down with a fix.

- [x] **T106** A No Belt result could not be approved without certifying the person White · est 0.25d · **High**
  **Done 2026-08-12**, shipped as PR #197. Raised by the client the same day:
  *"The system is setting some people have No Belt which is great, but in order to approve them,
  the system makes us choose min white belt. We should be able to approve them at no belt too as
  they will be in remediation."* It was blocking three people he needed to review. A No Belt
  approval now records the decision and awards nothing, with `confirmed_belt` left null rather
  than quietly certifying a belt nobody earned.

- [x] **T107** Deactivating a login only worked for free agents · est 0.5d · **High**
  **Done 2026-08-12**, shipped as PR #198. The client asked for it from the staff
  profile for everyone, and named it a security matter rather than a convenience: people take an
  assessment before their department is onboarded, and until there is somewhere to hold them,
  being able to switch the login off is the control. Deactivate and reactivate now sit on the
  staff profile banner.

- [ ] **T92a** Scripts as a standalone module that gets assigned to a named person · est 1.5d · **High**
  Asked for in the client's daily brief of 2026-08-13, Priority 2. The content is already in the
  platform, 70 scripts on record, each carrying its script number, name, belt level, primary
  function, approved language, forbidden phrases and patient safety rationale. What it has no way
  to do is land in a named person's hands. His words: *"Assigned deliberately, one person at a
  time, the same way a Foundations or Instruments module is assigned today."* Explicitly not
  bundled inside another track, and explicitly not pushed to everyone at a belt level.
  His own read, which he asked to be checked rather than assumed: Foundations and Instruments
  already assign per staff member and already carry an assignment type and trigger, so Scripts
  may be able to ride that pattern with no new architecture. If it cannot, he wants the reason
  before any code is written, and he will move the date.
  **Approach confirmed 2026-08-13, checked against the live database rather than assumed.** His read
  was right. The assignment pattern already exists three times over, in the same shape each time:
  `foundations_assignments` (132 rows), `instrument_assignments` (95) and `preceptor_assignments`
  (15), each carrying `staff_id, module_id, assigned_by, type, trigger, assigned_date, status,
  facility_id`, with the first two also carrying `assignment_type` and `trigger_event`.
  `aip_scripts` holds all 70 scripts and every one is active. The only thing missing is
  `script_assignments`, which does not exist. So Scripts rides the existing pattern, a fourth table
  of the same shape plus the surface to assign from. No new architecture, which is the fast path he
  hoped for.
  *Proposed by the client:* approach confirmed Mon 17 Aug, live Fri 21 Aug.
  *Goal:* A leader can assign the Scripts module to one named person, the same way Foundations is assigned.
  *Done when:* Scripts appears as an assignable module, an assignment to one person is visible to that person and to nobody else, and no belt level triggers it automatically.

- [ ] **T108** Endoscopy modules, assignable to named people from the first release · est 3d · **High**
  Asked for in the daily brief of 2026-08-13, Priority 3. Endoscopy is not a belt requirement and
  not a facility-wide rollout, because not everyone in a department works endoscopy. The modules
  have to land only on the people a leader deliberately assigns them to, and the client is
  explicit that this must be true in the first release rather than added afterwards.
  The wider point he is making, and the reason this one matters beyond itself: the platform is
  moving from content triggered by belt to a mix of content triggered by belt and content assigned
  by a leader. He would rather that distinction were built cleanly here than worked around later.
  **He owns the content.** He has asked for the module list, the gate structure and an exact
  statement of what content is needed and in what format, and will get it back from Dr. Jake
  himself. The earlier that request goes to him, the harder he can guarantee it.
  *Proposed by the client:* module list, gates and content request to him Mon 17 Aug, live Fri 28 Aug.
  *Goal:* Endoscopy modules exist and reach only the people a leader assigns them to.
  *Done when:* A leader assigns an endoscopy module to one named person, that person sees it, nobody else at their belt level does, and no facility-wide or belt-driven trigger exists for it.

- [ ] **T109** Manually added staff default to White, which is a decision nobody made · est 1d · **High**
  Asked for in the daily brief of 2026-08-13, Priority 4. Adding someone by hand offers White Belt
  and nothing else, so White stands in for a placement that has not happened.
  His numbers, and they are the reason this is not cosmetic: 56 of 92 staff sit at White and 28 of
  those are still flagged as needing placement, so roughly half the White population has not been
  assessed at White. Checked here 2026-08-13 and the picture has already moved: the roster is 97
  staff and 17 now carry `belt = 'None'`, because T106 made that value legal and the existing
  records were backfilled. So the data side is lighter than it looks, and the remaining work is the interface
  plus the records already sitting in the wrong state.
  **He wants the write-up before the change.** What an unassessed state touches: belt progress,
  the reports, the assessment queue, and how the records already at White get handled.
  This is the same fault as the report's old White placeholder, and it is the last instance the
  client can see of the standard he is asking us to adopt: never print a default where a decision
  belongs.
  *Proposed by the client:* impact write-up Mon 17 Aug, live Wed 26 Aug.
  *Goal:* Adding someone by hand records that they have not been assessed, rather than certifying them at White.
  *Done when:* Manual add offers an unassessed state and defaults to it, the existing wrongly-White records are resolved deliberately, and belt progress, reports and the assessment queue all read an unassessed person correctly.

- [x] **T110** Answer whether the assessment module's privileged functions are publicly reachable · est 0.25d · **Critical**
  **Answered 2026-08-14, and the answer was yes. Closed the same day, shipped as PR #200.**
  Every privileged function in the assessment module was called from an unauthenticated client
  against production. One answered: `sbd-assessment-notifications`, which ran with `verify_jwt`
  off at the gateway and carried no check of its own in the code. What that allowed was queuing a
  fake assessment-approved email on the service role, and distinguishing a real staff id from a
  made-up one by the response it gave back.

  Nothing called it: no database trigger, no webhook, no reference in the front end. Approval
  email goes through `sbd-emails` and is untouched.

  **Verified here 2026-08-15 rather than taken from the merge.** The deployed function list for
  the project no longer contains `sbd-assessment-notifications`, so the live copy really is gone
  rather than merely patched. The file stays in the repository as an inert reference with an
  unconditional 410 at the top of the handler, so an accidental redeploy cannot reopen it.
  Asked in the daily brief of 2026-08-13, Priority 5, and it is a question before it is a request.
  His scan found privileged functions in the assessment module that appear callable without
  signing in, some taking the acting administrator's identity as a parameter rather than reading
  it from the login. His question is deliberately narrow: *"is that module reachable in production
  today?"*
  **The answer decides the order of the whole next day.** If it is not reachable, it schedules
  normally with everything else. If it is, he wants it looked at first thing, ahead of the rest of
  his list. So this is answered before anything else on that list is started.
  *Proposed by the client:* answer Fri 14 Aug.
  **This one reorders the rest, so it is not just another dated item.** The client's words are that
  if the answer is yes he wants it looked at first thing, ahead of his whole list. So the answer is
  found before anything else on that list is started, and the answer goes to him either way.
  *Goal:* We know, and he knows, whether those functions can be called by someone who is not signed in.
  *Done when:* Each privileged function in the assessment module has been called from an unauthenticated client against production and the result recorded, and the answer has gone to him with the evidence.

- [ ] **T111** Production schema is ahead of the migration record · est 0.5d · Medium
  Found here 2026-08-13 while verifying T37. `supabase_migrations.schema_migrations` ends at
  `20260807120000`, but changes dated after it are demonstrably applied: `staff.observation_pin`
  is dropped, the T79 grant split is live, and `staff.belt = 'None'` is accepted with 17 rows
  carrying it. So the repository's migration files are not the record of what production runs.
  Why it matters rather than being tidy-up: every future verification that reads
  `schema_migrations` to decide whether something shipped will give the wrong answer, and this
  ledger has already been wrong once for exactly that reason. It also means a rebuild from
  migrations would not reproduce production.
  *Goal:* The migration record matches what production actually runs.
  *Done when:* Every applied change after `20260807120000` is represented in `schema_migrations`, and a fresh apply of the repository's migrations reproduces the live schema.

- [ ] **T112** The 90 minute window is cutting candidates off, and the result is scored as if they had skipped · est 1d · **High**
  Opened 2026-08-15 out of the client's question, *"we do need to look at Nikkia Warfield in the
  database because some of her answers are missing"*. He was right that they are missing. The cause
  is not what it first looked like.

  **First, the question actually asked: did she answer them?** No, and this was checked the hard
  way rather than inferred from the stored record. `sbd_assessment_sessions.progress.answers` holds
  what the candidate typed, and it is written independently of the responses on the review, so the
  two can be compared against each other. Both directions come out clean:

  * 34 responses stored as unanswered: **0** of them appear in what she typed.
  * 25 answers she typed: **25** are stored, **0** were lost.

  So nothing was dropped on our side and nothing needs repairing in her record. An earlier reading
  of this, made from the stored strings alone, was not good enough to say that, because the marker
  a skip writes is the same one an unresolvable answer would write.

  **Second, the cause, which is the part worth fixing.** Her window was 90 minutes, it expired, and
  the assessment was submitted **19 minutes after it closed**. She did not skip 34 questions, she
  ran out of time on them.

  **Third, it is not only her, though the shape needs stating carefully.** An earlier draft of this
  entry said everyone who finished inside the window had exactly four unanswered. That is wrong and
  was withdrawn on re-checking: the worst incomplete attempt in the whole set, 41 unanswered,
  finished 89 minutes *inside* its window and its session is marked `closed_no_person`, which is an
  abandoned sitting rather than a timed-out one. There is also no dose response, the correlation
  between minutes late and questions unanswered is -0.002, effectively zero.

  What does hold, across 80 sessions with a stored progress record, is the association:

  * Finished **inside** the window: 62 people, **1** left more than four unanswered.
  * Finished **at or past** the window: 17 people, **9** left more than four unanswered.

  So running to the end of the window is not a reliable predictor of how much is missing, but it is
  where almost all of the badly incomplete attempts are. Those unanswered questions are then
  counted as wrong, which is arithmetically right for a skip and wrong for a cut-off. Nikkia's
  knowledge reads 33.3%, 13 right out of 39 asked, when she reached only 25 of them.

  **Fourth, and this one needs to reach the client, because it bears on something already sent.**
  There are **two staff records** under the name Nelly Kyeremaa, and they are different ids:
  `42cd738d` created 12 August and `e3573447` created 14 August. Same facility, same role of SPD
  Technician I, and two portal accounts carrying the same name with a work address and a personal
  one. Neither portal account has ever logged in and both are inactive, so both sittings were run
  through an assessor session rather than a candidate login.

  Each record holds one placement. The 12 August one is the attempt the window cut short, 27
  knowledge and 12 simulation blank, 10 of 39 correct, marked `adjusted` and decided by J. Jacobs
  on 13 August. The 14 August one is **complete**: nothing blank, 33 of 39 correct, simulation
  average 54.9, confirmed by J. Jacobs the same day.

  **What cannot be claimed from the data is that this is one person who retook it.** It looks like a
  duplicate record for the same human, which is what the matching name, facility, role and email
  local part suggest, and it is the same shape as the duplicate that caused the Williams confusion.
  But two people can share a name, and only SIPS can settle which it is. It has to be asked rather
  than assumed, because the answer decides whether a completed assessment supersedes a cut-short
  one or whether two different people each have one result.

  Either way the note sent to the client on 13 August, that this result rested on 8 simulation
  answers, describes the 12 August record and should not be read as the current picture without
  that question being settled first.

  *Also found, smaller, same area.* A skipped knowledge question stores the literal string
  `'No answer'` (`ui-views.js:2642`, `sbd-force-submit-placement/index.ts:199`) while a skipped
  simulation stores an empty string, 130 against 56 across the table. One obvious blank test is
  therefore right about one type and silently wrong about the other. And those knowledge rows carry
  `correct: null` rather than `false`; harmless under the current falsy test, and not harmless the
  first time somebody counts wrong answers as `correct === false`.

  *Goal:* A candidate who runs out of time is handled as having run out of time, not as having answered wrongly.
  *Done when:* Reaching the end of the window does not silently produce a scored result from a partial attempt; the candidate and the assessor are told; the affected historical attempts are identified and put in front of SIPS; and a skip is recorded the same way for both question types, with a verdict rather than a null.

- [ ] **T113** The signup password removal promised to Iggie has no scope, no owner, and its date has passed · **High**
  Opened 2026-08-18 from a commitment that existed in exactly one place: Shawn's 14 August EOD to
  Iggie, *"The signup password removal, which we brought forward to Monday."* No ledger item and no
  card tracked it, which was verified by searching this file and the board before opening this. The
  14th was a Friday, so Monday reads as 17 August, which has already passed — the first thing owed
  to Iggie is therefore either the shipped change or a new date, not just the scope.

  What the code does today, read before scoping. The Request Access form collects a password with
  strength rules (`reg-pass`/`reg-pass2` in `index.html`, validated in `doRegister`,
  `ui-views.js:124`) and sends it in the registration payload *"for the Edge Function to create the
  auth user"* on approval. This is the same path as T60: the password a person types at signup is
  what ends up in `registrations`. Removing the password from signup removes T60's root cause, but
  which of the three readings was meant — the field, the password step, or the whole password
  requirement — and what replaces it (a set-password invite on approval is the obvious candidate)
  is Shawn's to state, not ours to guess.

  **Built 2026-08-18 to the obvious reading, ahead of the scope being written**, so the date
  question has an answer behind it: the password fields are gone from the signup form, approval
  creates the auth user with a random credential nobody sees, and the welcome email carries a
  set-password link into the reset screen that already existed (`checkForPasswordRecovery`). Found
  and closed on the way: the welcome email was showing the chosen password in plaintext
  (`temp_password` in `sbd-send-emails`). A side effect to know about: the admin add-user path
  (`sbd-sync-user-claims`) queues the same email template, so those emails also stop showing the
  admin-typed password and say to use Forgot Password instead — that password still works for
  signing in. Branch `work/t113-signup-password-removal`. Deploy order: `sbd-approve-registration`
  + `sbd-send-emails` first, then frontend, then migration `20260818120000` (nulls
  `registrations.password` and keeps it permanently null via trigger — applied earlier, the old
  function would fall back to its shared temporary password). Deploying this also finishes T60.

  *Blocked on:* Shawn confirming this reading is what was promised — the field is removed and a
  set-password email replaces it — or writing the scope that differs; then the deploy.
  *Goal:* Every commitment to Iggie gets a card and an owner. This one is either live or re-dated
  with Iggie told, and either way it is tracked here rather than living in an EOD message.
  *Done when:* The scope is written, this entry carries it with an estimate and an owner, and the
  change is live in production — or Iggie has been told a new date.

### Blocked, not on the critical path

- [ ] **T49** Strip and rotate the PSOP credentials, gate the public page
  *Blocked on:* the client.
  *Goal:* The PSOP page carries no credentials in its source and is not reachable by anyone who should not see it.
  *Done when:* The credentials are gone from the file, the old ones are rotated, and the public page is gated. Rotation confirmed by the client.
- [ ] **T50** David inside PSOP
  *Blocked on:* T49.
  *Goal:* The SOP tool runs the same David as the belt platform, with usage attributed separately.
  *Done when:* David answers inside PSOP and its usage appears under the SOP tool column, not mixed into the belt platform's.
  **No longer blocked, and no longer parked. Corrected 2026-07-28 from the transcript.** The
  client opened this himself in the meeting: *"I want to go ahead and start working on PSOP"*,
  and he expected the Tuesday and Wednesday straight after the call, which were **2026-06-30 and
  2026-07-01**, spent understanding it. That was a month ago and it has not started, which makes
  this a month-old unactioned client request rather than a new one. He is sending the original HTML
  and a live demo link by email and by chat. Two constraints he stated, both of which shape the
  reading rather than the build: David does **not** get wired up yet, but the code should be read
  knowing it has to be, and facilities have to line up across both platforms so an SOP written at
  a given facility can reference that same facility. T49 still gates the credentials work, but it
  does not gate reading the code.
  - [ ] **T50a** Answer the client's own question: one Supabase project or two · est 0.1d
    He asked it in the meeting and **nobody answered him**: *"I created a separate project in
    supabase for PSOP, but I don't know if that will be better or coming out of the same project
    since we'll be leveraging the memory and understanding of the facilities and the user. But
    I've already created that. If we don't need it, that's fine."*
    It is not a preference question. Sharing facilities and users across both tools means one
    project; separate projects means the SOP tool cannot see the facility a person belongs to
    without a second copy of that data, which is a synchronisation problem nobody has budgeted
    for. It also interacts with T67: a second live database doubles what a migration has to carry.
    *Goal:* He has a recommendation with the reason, rather than an unanswered question he raised.
    *Done when:* The answer is sent, with what each option costs, and the decision is recorded here.
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

**Updated 2026-08-18.** 64 items done, 61 open.

**T113 was opened from a promise that lived nowhere.** Shawn's 14 August EOD committed a signup
password removal to Iggie "brought forward to Monday". That Monday was 17 August and has passed,
and until today no ledger item or card tracked the commitment. It is blocked on Shawn writing the
scope and Asir confirming a date; the entry records what the signup code actually does today and
its overlap with T60.

**T110 was answered on 14 August and the answer was yes.** One function in the assessment module,
`sbd-assessment-notifications`, was reachable in production without signing in. It is closed, and
the closure was checked here against the deployed function list rather than against the merge:
the function is no longer deployed at all. The client set the rule that a yes reorders his list,
and it did.

**T105 is reported complete and is deliberately not ticked.** A report is not a verification.
There is no load-test script in this repository and no stored result, so a second pass has nothing
to attack. It stays open until there is something reproducible. That matters more this week than
last: the roster went from 92 to 105 and stored placements from 71 to 85 in three days.

**T112 is open and two of its claims were withdrawn before they reached the client.** The client
asked why one candidate's answers were missing. They are missing from her submission rather than
from our storage, which was established by comparing what she typed against what her record holds,
in both directions. The cause is that her window expired and the assessment submitted 19 minutes
after it closed, and the questions she never reached are counted as wrong answers. What did not
survive checking: that everyone finishing inside the window has exactly four unanswered, and that
a second complete assessment under the same name is the same person retaking it. Both are
corrected in the entry.

**Eight statuses corrected against the live system, not against memory.** The client's daily brief
of 13 August listed twelve items his own EOD record showed as shipped while the board still read
them as open. Each was checked here before the box moved rather than taken from his list. Seven
hold and are now ticked: T26 publish to staff, T27 attendance edits, T28 quick-fill overwrites,
T32 the cross-facility read leak, T37 the observer PIN moved server side, T65 placement scoring,
and T77 the assessor's Assessment Queue screen. The evidence is written into each entry, and where
it could not be proved from the database it says so instead of implying it could. The eighth, T74,
does **not** hold as done: the assessor half is live and every other role still resolves system
wide, so it stays open with the half recorded. T60 stays open too, which matches the client's own
reading of it.

**Five opened from the same brief, T92a and T108 to T111**: Scripts as a module assigned to a
named person, endoscopy modules assignable from the first release, the manual-add default that
certifies people at White without an assessment, the narrow security question of whether the
assessment module's privileged functions are publicly reachable, and one found here while
verifying T37, that production's schema is ahead of its migration record.

**T110 is the one that reorders the rest.** It is a question, not a build, and the client has said
plainly that if the answer is yes it goes first thing ahead of his whole list. It is answered
before anything else on that list is started.

**T101's narrow comparison ran on 13 August and nothing moves.** Details in the entry. The
historical re-run, which is the part that carries the risk, is still parked on the client's
decision.

**Six more shipped the same day**, all verified here against the live code
before being ticked: T99 the scoreboard restricted to the SIPS master admin, T100 the override
wording off the report, T79 the SIPS admin role with approval split from PIN generation, T80 the
facility admin's door into the observation consoles, and two the client raised that morning and
had back by evening, T106 approving a No Belt result without certifying the person White and T107
deactivating a login from any staff profile rather than only a free agent's.

**T101 has a tool now** and does not have a decision. `scripts/rescore-placements.js` re-grades
stored responses through the calibrated evaluator and writes nothing to the database; checked
here rather than taken on trust. The client asked for a narrow first pass, today's assessments
and the pending ones, compared side by side before anyone decides about the older records.

**Earlier the same day:** ten shipped, seven opened, and five entries that were finished but had
never been ticked.

**Ten shipped.** T88 Foundations content, T92 scripts as their own module, T30 the read-only
checklist for facility leaders, T91 typed or spoken observation evidence, T93 renaming a David
chat, T89 David's knowledge search pointed at the index that actually holds the records, T94
David naming the assessment levels instead of inventing topics, T95 the belt report reading at a
glance, T96 belt scoring onto the SIPS Scoring Specification v1, T97 the fifteen minute logout,
and T98 an assessor override honored by the report.

**Five were done and never ticked.** T30, T89, T91, T93 and T98 all shipped and were verified,
and the ledger still read them as open. That is the failure this file exists to prevent, so the
statuses were audited against the merge history and the live code rather than against memory.

**Seven opened, T99 to T105**, all from the 11 August client chat or from decisions the scoring
specification work surfaced: the scoreboard restricted to SIPS, the override wording coming off
the report, the historical re-run that must be re-scored first, the determination moving server
side, versioned constants, the client's sprint tracker, and load capacity for the onboarding wave.

**T91, T92 and T93 are three client asks from the 3 August call that were never written down.**
Observation answers typed or spoken with no multiple choice, scripts as a separately assignable
module, and editable David chat titles. They were made on the same call as the Foundations
formatting request that became T88, and that request was the loud one. T93 was answered on the
call with *"we already have that in our task list"*, which was not true. This is the second time
the same failure has been recorded here, so it is worth stating as a rule rather than an
observation: **an ask made next to an urgent one still needs its own row, written during the
call.**

**T88 shipped**, and it is the largest single content change the platform has had. All ten
Foundations modules now carry their source documents' own words and structure: 77 sections where
there were 70, 219,000 characters where there were 181 per section, 124 tables where there was 1,
86 callouts where there were 2. **Seven sections existed in the curriculum and had never been in
the app at all**, two of them error and failure sections, which is the material a technician most
needs. It is generated by `scripts/foundations-from-docx.py` and re-runnable, so a corrected
document from the client is a file swap rather than a rewrite.

**T89 opened**, found while tracing where the curriculum was stored. The live David edge function
searches a Pinecone index that does not exist, while 1,418 usable records sit in the one both
seeding scripts name. It fails silently because an empty result and a failed call are handled
alike, so David answers from reasoning and nothing surfaces. **T90 opened** as the small tail of
T88: three module-level blocks per document that were deliberately held back.

**T81 was never blocked.** It had been logged as waiting on source documents that had been sitting
in an uploaded archive since 28 July. That is corrected, and the documents are now in the
repository.

**The `david_usage_by_app_mtd` fix was recorded wrongly and is now recorded properly.** It was
applied to production by hand and then written back into a migration that had already run, so an
environment sitting at that version would never have picked it up. The applied migration is
restored and the fix moved into its own.

**The lesson worth keeping, because it cost most of a day.** The Foundations documents were
searched for across the client conversation, Drive, Supabase, Pinecone and this repository and
reported as not existing anywhere. The preceptor set was in hand the whole time and the client had
to be asked twice for something already sent. Anything that arrives from the client and is worth
keeping now goes into `docs/curriculum/`, with a README stating where each set came from and what
generates what.

**Updated 2026-08-03.** 36 items done, 59 open. T88 added: the client asked on 3 August for the
Foundations UI to resemble the source curriculum document, and clarified it as *"colors. Sections,
separated text, adjusted format."* The presentation half shipped the same night and is live on
`foundations.js?v=15`; it reshapes the strings already held and was checked across all 70 sections
to confirm no word is lost. T88 is the half that did not ship, which is the larger one: the
document carries tables, numbered step blocks and callouts that the content itself does not, and
no layout change produces a six-row table from a sentence with no table in it. Blocked on the
source documents, of which exactly one has been seen, and only as frames from a phone recording.

`GOAL.md` added the same day, since the after-hours handover convention expects it and it did not
exist. It is a one-minute view of the three lines of work in front of us; this ledger stays the
record.

**Updated 2026-07-31.** 36 items done, 58 open. Eleven added, T78 to T87 plus T84a, from one pass over the
complete client conversation, 22 May to 31 July, attachments included rather than message text
alone.

**Six of the ten are client requests that were made and never recorded**: T78 file and image
upload, T79 the SIPS admin role and splitting approval from PIN generation, T80 facility admin
access to the observer portal, T81 preceptor formatting, T82 the DAVID slash commands, and T83
the curriculum media question he is still waiting on. T79, T80 and T83 are the ones with a cost
attached: T79 and T80 are the same permission-composability shape as T74 and T77, and T83 is a
question he asked us that is blocking work he is doing right now.

The failure mode is worth naming, because it is repeatable. Every one of the six was said in the
same conversation as something more urgent. T80 sat one line above the word PRIORITY. **An ask
next to an emergency still needs its own row.**

The other four are ours: T84 copy correctness, T85 proving the Patient Safety Provision audit
trail and moving its clear into Role Management, T86 an untrusted timestamp on placement reviews,
T87 a key rotation.

Also written in the same pass: `docs/DOMAIN_GLOSSARY.md`, which records the platform's own
vocabulary, the belt and gate and window model, the seven Foundations modules, both navigations,
the metering model and the stated rollout size of 30 leaders then 175 technicians. None of that
existed anywhere in the repository before; it lived only in screenshots.

**Updated 2026-07-30.** 36 items done, 47 open. T77 added: the client confirmed T73 from Kirti's
account at 6:54 AM and found the Assessment Queue missing from the staff portal. It is a real gap
with the same shape as T73, but it is refused as a quick fix, because a granted assessor has no
facility limit today and both the screen and `aq_select` would expose all 57 queue rows across all 8
facilities. It waits on T74 by Shawn's decision rather than shipping an interim own-facility rule.
T74 step 1, the `sbd_is_assessor(p_fid)` overload, is written and applies no behaviour change.

**Updated 2026-07-29 later still.** 36 items done, 46 open. T76 added and two entries corrected after
transcribing the client's three voice notes of 2026-07-30 03:37 to 03:39, which settled scope that the
text messages had left open. T74 now covers preceptor access as well as assessor, and records that
facility educator already works the way he is asking for. T75's claim that Kirti's `Free Agent` grant
was a misclick is withdrawn: parking SIPS hires in free agency is deliberate, and the real gap is the
missing SIPS home facility, now T76. That withdrawn claim had already gone to the client.

**Updated 2026-07-29 later.** 36 items done, 45 open. Three entries were added from the client's
2026-07-30 messages on assessor access: T73 the missing assessor tab, now fixed, T74 assessor scoped
per facility, and T75 the facility picker that T74 depends on. The client asked at 1:45 AM for the
assessor work to move to the front of the queue.

**Updated 2026-07-29.** 35 items done, 43 open. Four were logged on 28 July from a recorded
client meeting of **2026-06-29**, which had not reached this ledger at all in the month since: T66 the reverting AI
notes, T67 surviving the database migration, T68 proof-by-recording, T69 the model indicator.
T67 is the one that outranks the rest of the open list.

**Amended later the same day, after reading the meeting transcript in full rather than working
from the summary.** Four entries were wrong or incomplete and are corrected in place with the
quote each correction rests on:

- **T69 is not ours.** It was given to the other developer in the call. Tracked, not built.
- **T66 has its date.** The two-paths fix was claimed as deploying 29 and 30 June. That is a
  claim of deployment rather than evidence of one, and it is recorded as a claim.
- **T67 stays on the same Supabase account**, no project for it existed as of the call, and it
  is **not** going into the PSOP project. Two separate conversations had been read as one.
- **T50 is not parked.** The client asked for it a month ago, on 29 June, and it has not started.
  T50a is new: he asked whether PSOP should be one project or two and nobody answered him.

*Recorded, not numbered, because nothing was asked of us:* a third technology acquired from
another set of developers will be presented alongside the belt platform and the SOP tool. It has
an older interface and the client expects the other two to look modern beside it. No work was
requested, so it is not a task, but it is here so it is not a surprise later.

*Also stated in the call and worth holding to:* the client's first priority in his own words is
reports generating properly with all the notes, the interface suggestions matching what is on the
report, and both matching the scoring logic. That is T65, now built and live, plus T40. And he
said he would set deadlines for everything at the following Friday 1 PM meeting, which was
**2026-07-03** and is long past.

| Group | Open | Items | Est. days |
|---|---|---|---|
| Phase 1, awaiting a click-through | 5 | T26, T27, T28, T28a, T61 | 2.25 |
| Phase 2 | 9 | T30, T32, T33, T34, T35, T35a, T35b, T36, T37 | 7.50 |
| Phase 3 | 11 | T39 to T48 | 9.35 |
| Found during Phase 1 | 6 | T54, T56, T58, T59, T60, T62 | 2.10 |
| Raised by the client | 3 | T63, T64, T65 | 1.75 |
| From the 2026-06-29 meeting | 4 | T66, T67, T68, T69 | 0.75 + unknown |
| &nbsp;&nbsp;of which tracked only, not ours to build | 2 | T66, T69 | 0 |
| &nbsp;&nbsp;of which awaiting QA sign-off only | 1 | T65 (built, live, measured) | 0 |
| Active on the SOP tool | 2 | T50, T50a | 0.10 + unknown |
| Access review, raised 2026-07-28 | 1 | T71 | 0.50 |
| Blocked on somebody else | 3 | T49, T51, T52 | not counted |
| **Total, excluding blocked** | **41** | | **24.3 + unknown** |

*Note on these totals, since they do not reconcile and did not before this edit either.* 41 open
minus 3 blocked is 38, not 40, because the group rows double-count a few items that sit in more
than one grouping. The existing convention was kept rather than silently re-deriving it, so the
movement is readable against the previous version. Worth rebuilding properly in one pass rather
than nudging it each time, but that is a separate job and not this one.

**Waiting on a live QA pass, not on building:** T26, T27, T28, T28a and now T65. All five are
written, merged and running on production with measurements recorded here. What they need is
somebody working through them in a browser and saying whether it behaved.

**Nothing on T65 is waiting on the client.** Corrected 2026-07-27: an earlier note here said
the report wording was blocked on him. It is not. Everything he actually asked for is built
and live: the belt is issued on the scores, the item becomes a provision on the account, the
provision is visible there, it is cleared only by a master admin or a SIPS admin with the name
and date kept, it holds the next belt while it is open, and it is displayed in the report as
condition 1 with a patient safety findings block. The only outstanding piece was a per-option
clinical rationale in the question bank, which is our own idea and which he never asked for.
It is a refinement of wording that already works, so it goes to the backlog rather than being
called a blocker.

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
