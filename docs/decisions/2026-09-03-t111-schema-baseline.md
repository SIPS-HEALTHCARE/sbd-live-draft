# T111 / T127 — Baseline the production schema so the repo can rebuild it

**Date:** 2026-09-03 · **Board:** #721 · **Family:** T110 (#711), T119 (#748)

## The problem Sriman measured (26 Aug)

The card has two done-when conditions. The first — every applied change is in the
migration record — was met by the #721 ledger repair. The second — a fresh apply of the
repo's migrations reproduces the live schema — was not, and could not be:

| | 26 Aug (Sriman) | 3 Sep (this doc) |
|---|---|---|
| Versions recorded in production | 250 | 252 |
| Migration files in the repo | 93 | 95 (94 applied + Bucket A) |
| Recorded versions with no file | 158 | 158 |
| Newest recorded-without-file | 26 Jul 2026 | 26 Jul 2026 |

The 158 were applied through the dashboard or MCP between 18 Mar and 26 Jul 2026 and never
got a file. Their SQL survived only in the `statements` column of
`supabase_migrations.schema_migrations`. `src/data/schema.sql` (352 lines) is a hand-written
early partial, not a baseline. So `supabase db reset` from this repo built 95 migrations'
worth of schema against production's 252, and any rebuild would have been wrong.

## Decision: one baseline, old files archived

Sriman offered two routes: bring the missing versions in (as files or as a baseline), or
rewrite the second condition and say why. This takes the baseline route, so the card closes
on its own terms.

- `supabase/migrations/20260903120000_baseline_production_schema.sql` is a
  `supabase db dump --linked` of production taken 2026-09-03, plus the five `cron.job`
  schedules appended by hand (cron rows are data; pg_dump omits them). It is migration zero.
- The 94 applied pre-baseline files moved to `supabase/migrations-archive/`. They cannot stay
  in `migrations/`: a fresh apply runs files in version order, and every one of them would
  either fail on an empty database (they assume the 158 missing steps) or collide with the
  baseline. They are kept because six verify scripts read them and because their comments
  carry the reasoning. Those scripts were re-pathed and all pass.
- `supabase/migrations-archive/ledger-2026-09-03-pre-baseline.json` is the full 252-row
  export of the production ledger, statements included. The 158 orphans' SQL now lives in
  git for the first time.
- The one unapplied file, Bucket A (`20260827120000`, held under T125), is renamed to
  `20260903130000` so it sorts after the baseline. On a fresh database it would otherwise run
  first, against tables that do not exist yet.

Why not 158 individual files instead? They would recreate the recorded history faithfully but
still not the schema: anything ever run as ad-hoc dashboard SQL was never recorded at all, so
only a dump of the actual database is guaranteed to match it. The dump is also what the
Supabase docs prescribe for baselining an existing project.

## What the baseline does and does not carry

Carried (all verified equal to production): 109 tables, 1 view, 82 user functions, 262 RLS
policies, 16 triggers, 130 indexes, grants, the `vector`/`pg_net`/`pg_cron`/`http`/
`pgcrypto`/`uuid-ossp` extensions, and the 5 cron schedules (4 SBD, 1 `sync-spd911-episodes`
belonging to another SIPS property sharing the project — carried because it is production
state).

Three things pg_dump could not express, found by diffing a shadow database built from the
dump against production, and added to the file by hand:

1. **A role nobody recorded.** `sbdops_readonly` is a LOGIN role with 10 grants in the schema.
   It is in no repo file and in none of the 252 recorded statements — created by hand at some
   point. Roles are cluster-level so the schema dump grants to it without creating it; the
   first shadow build failed on exactly that. Now created (guarded) at the top of the file,
   from `db dump --role-only`. The same roles dump showed three role-level
   `statement_timeout` settings (anon 3s, authenticated and authenticator 8s), also with no
   migration behind them; carried too.
2. **95 REVOKEs.** A fresh Supabase database grants anon and authenticated on every new table
   through `ALTER DEFAULT PRIVILEGES`. The 2026-07 security sweeps revoked those on ten tables
   (`sbd_rate_limit`, `sbd_password_resets`, `sbd_observer_pins`, `sbd_email_queue`,
   `david_audit_logs`, `david_facility_access`, …). pg_dump emits grants, never absences, so
   the shadow database came up more permissive than production. The diff output is appended
   verbatim as a POST-DUMP ALIGNMENT section so a rebuild is locked down the same way.
3. **Tool noise, kept deliberately.** The same diff re-emitted two functions
   (`search_all_columns`, `search_all_tables`) and one CHECK constraint whose text is
   byte-identical to production. They are idempotent, and keeping them means the file is
   exactly what the tool verified.

Not carried, deliberately: auth configuration and hooks, `storage.buckets` rows (the only
remaining bucket is another property's PDF), vault secrets, edge function deployments. None
of those are schema, and none are what "rebuild the database" means on the card.

The three JWTs inside the dump (`sbd_trigger_email_send`, `sbd_recover_placements`, cron
bodies) are the publishable anon key, already in the frontend bundle and in the two archived
cron migrations. No service-role material is in the file (checked by decoding every JWT in it).

## Verification

Method: `supabase db diff --linked --schema public` with Bucket A parked out of the folder.
The CLI builds a shadow Postgres in Docker from `supabase/migrations/` alone (so, from the
baseline file only) and emits the statements needed to turn that shadow into production. An
empty result means a fresh apply reproduces the live schema. Three runs on 2026-09-03:

| Run | Result | Action |
|---|---|---|
| 1 | Shadow build failed at statement 1241: role `sbdops_readonly` does not exist | Roles section added from `db dump --role-only` |
| 2 | 117 statements: 95 `REVOKE`s on 10 tables + 22 lines re-stating 2 functions and 1 CHECK constraint | Output appended verbatim as POST-DUMP ALIGNMENT |
| 3 | Only the same 2 functions and 1 constraint, text byte-identical to production | None — see below |

Why run 3 is a pass and not a residue: the three remaining items were already in the file
verbatim from run 2, so the shadow definitely holds production's exact text, and the tool
still emits them. That is the diff tool's known behaviour with plpgsql bodies and with CHECK
constraints over `character varying` arrays (it compares a normalised form that never matches
the stored one). Every statement that described a real difference — the role, the 95 grants —
went to zero once stated. Nothing else in `public` differs: 109 tables, 1 view, 82 functions,
262 policies, 16 triggers, 130 indexes, all grants.

Also checked: the six verify scripts that read migration files by path were re-pointed at
`supabase/migrations-archive/` and all pass (`verify-approval-hardening`,
`verify-leader-observations-entry` 16/16, `verify-t79-assessment-grants`,
`verify-endoscopy-module`; the other two references are a rollback script's comment and a
readdir pattern). No secrets in the file beyond the publishable anon key already in the
frontend; every JWT in it was decoded and carries `role: anon`.

## Production ledger repair — NOT YET RUN, needs a go

The repo side above changes nothing in production. To make `supabase migration list` and
`db push` agree with the new layout, the ledger has to be repaired once:

```bash
set -a; source .env.local; set +a
# 1. every pre-baseline version leaves the record (the JSON export already holds them)
supabase migration repair --status reverted --linked $(python3 -c "import json;print(' '.join(r['version'] for r in json.load(open('supabase/migrations-archive/ledger-2026-09-03-pre-baseline.json'))))")
# 2. the baseline is recorded as applied without being run (production already IS the baseline)
supabase migration repair --status applied --linked 20260903120000
# 3. expect exactly one local-only row: 20260903130000 (Bucket A, held)
supabase migration list --linked
```

This touches only `supabase_migrations.schema_migrations`, never the schema. Until it runs,
`supabase migration list` shows 252 remote-only versions and one local-only baseline, and a
`db push` would try to apply the baseline against production — **do not push before the
repair.** Bucket A's version change needs no repair: it was never applied.

## Done-when, re-read

1. Every applied change is in the migration history — yes, and after the repair the history
   is exactly `[baseline]`, which is the whole applied state.
2. A fresh apply of the repo reproduces the live schema — yes, measured above.

Neither box is ticked in TASKS.md until the ledger repair has run: T127 was closed once on a
half-measured claim, and this is the other half.
