# Pre-baseline migrations (archived 2026-09-03)

These 94 files were `supabase/migrations/` until the production schema was
baselined under #721 / T111. They are **not applied by the CLI** from here and
must not be moved back: a fresh apply now runs
`20260903120000_baseline_production_schema.sql` first, which already contains
everything these files built.

They stay because the verify scripts under `scripts/` read several of them, and
because their comments carry the reasoning behind the schema. Treat them as
documentation.

`ledger-2026-09-03-pre-baseline.json` is the full 252-row export of
`supabase_migrations.schema_migrations` taken before the ledger was repaired
(version, name, statements). 158 of those versions never had a repo file; their
SQL is preserved here and nowhere else in git.

Decision doc: `docs/decisions/2026-09-03-t111-schema-baseline.md`.
