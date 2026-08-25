# Retire `sbd-auth`: the login path that accepts any password

**Date:** 2026-08-25
**Status:** Recommendation. Not executed. Waiting on an explicit go.
**Relates to:** T119 (orphan edge functions), T120 (`verify_jwt=false` audit)

---

## The defect

`supabase/functions/sbd-auth/index.ts:41`:

```js
if (user.password_hash && user.password_hash !== password) {
  return 401
}
```

The password check is guarded by the truthiness of the stored hash. When
`password_hash` is null or empty the whole comparison is skipped and the request
falls straight through to session issue. There is no else branch. An account with
no stored hash accepts **any** password, including an empty one.

Two smaller faults sit in the same file and are worth recording because they shape
the verdict below rather than being separately fixable:

- `:111` the `validate` action returns `{valid: true}` for any non-empty string. It
  does not look the token up anywhere.
- `:41`, `:265`, `:300`, `:316` compare and store the password as plaintext. The
  column is not a hash despite the name.

The function runs `verify_jwt=false`, so nothing upstream gates a caller.

## Blast radius, measured

Read from the live project `mhijaqahbceuahfzezbh` on 2026-08-25:

| | count |
|---|---|
| Active accounts in `sbd_portal_users` | 81 |
| Active accounts with null or empty `password_hash` | **78** |
| Active accounts with a stored value | 3 |
| Of the 78, `facility_admin` | **10** |
| Of the 78, `staff_admin` | **3** |
| Of the 78, `master_admin` | **0** |

So 78 of 81 live accounts, **thirteen of them administrators**, would authenticate
on any input if this path were reachable.

The three accounts that do carry a stored value are precisely the three
`master_admin` accounts, so the highest privilege tier is the one part already
covered. An earlier draft of this note said "three administrators", which counted
only `master_admin` and `staff_admin` and so both undercounted the exposure and
implied the wrong tier. Corrected here.

## Why it has not been exploited

The login query at `:32` is:

```js
.select('*, sbd_facilities(name, active, system_id)')
```

`sbd_facilities` does not exist in the schema. Confirmed against
`information_schema.tables`: of the five tables this function references, only
`sbd_portal_users`, `sbd_password_resets` and `sbd_activity_log` are present.
`sbd_facilities` and `sbd_pending_registrations` are both absent.

The embedded resource makes PostgREST reject the query, so `userErr` is truthy and
every login returns 401 at `:33` before ever reaching line 41.

**Verified by probe, not by inference.** Running the identical select over REST:

```
GET /rest/v1/sbd_portal_users?select=*,sbd_facilities(name,active,system_id)&limit=1
-> PGRST200 "Could not find a relationship between 'sbd_portal_users' and
   'sbd_facilities' in the schema cache"
```

Control, the same query with the embed removed, returns `401` instead. The schema
error therefore precedes the permission check, which means the service role the
function runs under hits it too. This was also read off the **deployed** function
(v12) rather than the repository copy; the two are identical on both of the lines
that matter.

**A missing table is the only thing holding this shut.** It is not a control. Anyone
who creates a table by that name, or who edits that select while fixing something
else, opens all 78 accounts in a single line of diff. That is the reason this is
worth acting on rather than filing.

## Why deleting it breaks nothing

Two independent checks, because a five-month-old dormant function and a live one
look identical from the code alone.

**Check one, references.** No caller anywhere. `sbd-auth` appears in `TASKS.md` and
in the T119 and T120 decision notes and nowhere else. Not in `index.html`, not in
`src/js/`, not in the legacy monolith. T119 already reached the same conclusion
independently and marked it DELETE.

**Check two, traffic.** `sbd_activity_log` holds 2446 rows with `action='login'`,
the most recent minutes before this was written, which looks at first glance like a
function under load. It is not. Splitting those rows by shape:

| shape | rows |
|---|---|
| `target_type='portal_user'` with a role in `details`, which is what `sbd-auth:61` writes | **7** |
| `event_type` set, no `target_type`, which is what the current platform writes | 2439 |

All 7 of the `sbd-auth` rows are dated 2026-03-19, the day the function was created.
There has not been one since. The 2439 live logins come from the GoTrue path through
`sbd-log-activity`, which is a different function with `verify_jwt=true`.

The count that looked alarming is the one that proves the point: this function has
issued seven sessions in its life, all on its first day, none in five months.

## Recommendation

**Delete `sbd-auth`.** Do not patch it.

Patching means writing a real hash comparison, a real token store for `validate`, and
a migration for 78 plaintext-or-empty columns, in order to restore a login path that
nothing calls and that the platform replaced with GoTrue. The repair costs more than
the deletion and leaves a second authentication surface standing.

Deletion removes the surface. If a legacy caller is ever discovered, the function is
recoverable from this repository.

## What deletion touches

- `sbd_portal_users`, `sbd_password_resets`, `sbd_activity_log`: no schema change, no
  row written or removed. The function is being removed, not its tables.
- Live sign-in: unaffected. The 2439 real logins do not pass through here.
- `sbd_password_resets`: the forgot-password and reset actions in this file are
  likewise dead, and the live reset flow is the T115 hashed-token path in
  `sbd-approve-registration`. Nothing in the live reset journey calls this file.
- Rollback: redeploy from `supabase/functions/sbd-auth/index.ts`, which stays in the
  repository.

## Still open after this

The plaintext column itself. 3 accounts carry a value in `password_hash` and those
values are readable to anyone with service-role access. Deleting `sbd-auth` does not
clear them. That is a separate item and it should not be folded into this one, since
the column may be read by something this note has not checked.

---

*Method: function source read in full; `sbd_portal_users` and `sbd_activity_log`
counted directly on the live project; table existence confirmed against
`information_schema`; references swept across the repository including the legacy
monolith. No value from `password_hash` was read, printed or stored at any point.*
