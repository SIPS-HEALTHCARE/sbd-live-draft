# White by default: the unassessed entry state

**Date:** 2026-08-17 · **Status:** For Iggie's review — no code changed yet
**Origin:** Iggie brief 2026-08-13, Priority 4

## 1. The fault

Adding a staff member by hand records White Belt for people who were never assessed.
The Add Staff modal (`openAddStaffModal`, `ui-views.js:16146`) lists all six belts, but
**White is preselected** and there is no unassessed option — so White is what gets saved
unless the operator deliberately intervenes. The modal also defaults the belt-earn date
(`since`) to today, so the fake belt arrives with a fake earn date.

This is the same class of fault as the placement dropdown fixed in PR #197 (it could
only approve at White) and the re-score sheet fixed in `a415072` (rows with no belt on
record silently fell out of the counts): **a default printed where a decision belongs.**
Iggie has named this the standard; this write-up applies it to the entry points.

One correction to the brief: the picker does not offer "White and nothing else" — it
offers all six belts. The observed behavior (everything lands at White) comes from the
preselection, not a missing list. The fault is identical under the standard; the fix is
different (change the default, not the list).

## 2. Where the numbers stand

Iggie's figures (13 Aug): 92 staff, 56 at White, 28 of those flagged `placement_needed`.
Checked live 14 Aug: **98 staff, 18 now carry belt `None`** — the T106 fix
(migration `20260813120000`, PR #199) made `None` legal in prod and backfilled the
records whose No Belt decision had only landed on `placement_reviews`.

So the data side is lighter than the brief suggests. What remains is:

1. the interface (and two edge functions) that still stamp White, and
2. the White records that were never backed by any decision.

## 3. Every place White gets stamped without a decision

The Add Staff modal is not the last instance — it is one of three **write** paths, plus
a family of render-time fallbacks:

| # | Path | Where | Behavior |
|---|------|-------|----------|
| 1 | Add Staff modal | `ui-views.js:16146` | White preselected; `since` defaults to today; no unassessed option |
| 2 | Bulk CSV upload | `bulk-upload-staff/index.ts:98` | blank belt → `'White'`; `validBelts` rejects `None` |
| 3 | Registration approval | `sbd-approve-registration/index.ts:197` | hardcodes `belt: 'White'` on the staff row created with a newly approved facility account |
| 4 | Render fallbacks | `api-supabase.js:448,486`; `ui-views.js:4307,17462,17493` | `row.belt \|\| 'White'` — prints White where no belt exists (free agents, transfers, placement card) |

Rows 1–3 write White into the database. Row 4 only displays it, but it is the same
standard violation and the free-agent/transfer fallbacks would mislabel a released
unbelted person if their belt column were ever null.

Note on the placement flag: `addStaff` never sends `placement_needed` at all
(`mapStaffToBackend` doesn't carry the column), so the database default decides it.
Iggie's 28-of-56 pattern is consistent with a default of `true`: hand-added staff got
White **and** stayed flagged for a placement they never took. Verify before relying on
it (§7, query A).

## 4. What an unassessed state touches

`None` (shipped in #197/T106) already has the right semantics almost everywhere,
because it sits outside `BELT_ORDER` (`beltIdx('None') = -1`):

| Surface | Wrongly at White | At `None` |
|---------|-----------------|-----------|
| Badge / cert label | "White Belt" · **"Certified Operator I"** on formal reports | "No Belt" · "Not Yet Certified" |
| Points (`calcPoints`) | +100 unearned belt points → leaderboards, facility totals | 0 |
| Progression target | `nextBelt` = Yellow | `nextBelt` = White |
| Assessment window | `getWindowStatus` hardcodes White's current gates as passed → an **open 2-week window to apply for Yellow**, cycling from the fake `since` | no `BELT_WINDOWS` entry → always open (placement/remediation can proceed immediately) |
| Assessment queue | eligible to request Yellow gates never having been assessed at anything | routed to placement |
| Placement queue | if flagged, appears in the Assessment Authorization block **at the same time** as holding a White cert — both worlds at once | appears exactly once, as awaiting placement |
| Reports / analytics | inflates certified counts and belt averages | `BELT_VAL.None = 0` keeps averages defined |
| DAVID | forecasts inherit whatever the roster claims | correct |

Two sub-states share the `None` value, split by the existing flag — no new sentinel is
needed:

- **`None` + `placement_needed = true`** → not yet assessed (placement pending)
- **`None` + `placement_needed = false`** → assessed, **No Belt decided** (remediation path, #197)

Known rough edges to carry into the change, not solve here:

- ~33 raw `` `${s.belt} Belt` `` templates print "None Belt" (the `beltLabel()` upgrade
  path already noted in `logic.js:43`).
- `sbd-reset-test-assessment` writes `belt = NULL` (a third unbelted shape);
  `beltBadge(null)` renders the literal string "null". Converge it on `None` as a small
  follow-up.
- Any correction entry appended to `staff.history` renders **red as "Fail"** unless its
  `res` value is in `HISTORY_SUCCESS_VALUES` (`logic.js:72`, QA 2026-07-29 finding 8).
  The remediation in §6 must extend that list (e.g. `'correction'`) or skip history.

## 5. The interface change (proposed, not built)

1. **Add Staff modal:** the belt select gains **"Unassessed — placement pending"** as
   the first and preselected option. It writes `belt='None'`,
   `placement_needed=true`, `since=NULL`, gate selects disabled. The six real belts
   remain available — onboarding a roster with known belts is legitimate — but a real
   belt is now always an explicit act, never inertia. `addStaff` sends
   `placement_needed` explicitly instead of inheriting the column default.
2. **Bulk upload:** blank/missing belt → `None` + `placement_needed=true` instead of
   White; explicit belts still accepted; `None` added to `validBelts`.
3. **Registration approval:** the auto-created staff row starts unassessed instead of
   hardcoded White.
4. **Render fallbacks (§3 row 4):** replace `|| 'White'` with the unbelted label.

No migration is needed for any of this — the prod constraint already admits `None`
(verified live 14 Aug). Frontend + two edge functions only.

## 6. The records already wrongly at White

Three buckets, identified read-only first (queries in §7):

- **Bucket A — mechanically wrong, correct by migration.** `belt='White'` AND
  `placement_needed=true` AND no gate results AND empty history AND no confirmed
  placement review. These are the form's own output: flagged for a placement they never
  took, certified by default. Migration sets `belt='None'`, nulls `since`, leaves
  `placement_needed=true` (they are already in the placement queue and stay there).
- **Bucket B — ambiguous, human review.** `belt='White'`, `placement_needed=false`,
  zero evidence. Possibly genuinely White from an off-system assessment; possibly
  hand-added with the flag cleared. Output as a named list for Iggie — **no automatic
  change.**
- **Bucket C — evidenced, untouched.** White with a confirmed placement review or gate
  history.

Stated plainly, correcting Bucket A means each person **loses 100 points, their label
changes from "Certified Operator I" to "Not Yet Certified", their Yellow window
disappears, and facility belt averages drop.** The reports will visibly change; whether
facilities get a heads-up is Iggie's call (§8, Q4).

## 7. Verification (read-only, run before anything else)

```sql
-- (A) Column defaults the code currently relies on
select column_name, column_default, is_nullable
from information_schema.columns
where table_name = 'staff'
  and column_name in ('belt', 'placement_needed');

-- (B) Bucket sizes + names
select s.id, s.first, s.last, s.fid, s.belt, s.since, s.placement_needed,
       case
         when s.placement_needed then 'A: flagged, no evidence'
         else 'B: unflagged, no evidence'
       end as bucket
from staff s
where s.belt = 'White'
  and s.cur_comp is null and s.cur_sim is null and s.cur_obs is null
  and jsonb_array_length(coalesce(s.history, '[]'::jsonb)) = 0
  and not exists (select 1 from placement_reviews pr
                  where pr.staff_id = s.id and pr.confirmed_by is not null)
order by bucket, s.last;

-- (C) The NULL-belt shape left by the reset tool
select count(*) from staff where belt is null;
```

## 8. Decision points for Iggie

1. **Default vs forced choice** in the Add Staff modal. Recommendation: "Unassessed"
   preselected — the safe state is the default, a certification is always explicit.
2. **Hand-entering a real belt** — allowed freely, or require a short provenance note
   (where/when assessed) saved to history? Recommendation: allow, require the note.
3. **Bucket B disposition** — review the named list from §7-B; nothing moves without
   sign-off.
4. **Facility communication** about report numbers dropping when Bucket A is corrected.
5. **Registration-created accounts** (currently auto-White) start unassessed —
   confirm.

## 9. Order of operations

1. Run §7 queries; review Bucket lists with Iggie.
2. Ship the interface change (§5): frontend (`ui-views.js` + cache-bust) + redeploy
   `bulk-upload-staff` and `sbd-approve-registration`. Closes the tap.
3. After sign-off on the §7-B list: Bucket A migration (with the `HISTORY_SUCCESS_VALUES`
   guard from §4), then re-run §7-B — expect zero rows in Bucket A.
