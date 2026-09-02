-- 20260806120000_t91_observation_item_notes.sql
-- T91 (client ask, 2026-08-03 call): an observation answer must be typed or spoken,
-- never only selected.
--
-- The observation capture screen scores each instrument item by tapping 0/1/2/3 or
-- PASS/FAIL. Those numbers cannot be removed: ovsComputeOutcome() derives
-- advance / conditional / do-not-advance from them across all five instrument schemas
-- (points floor, mandatory/recommended, composite, components, tiered), and every
-- existing record's item_scores is read back by the review console and the gate write.
--
-- So the score stays and the evidence becomes mandatory: one typed-or-dictated answer
-- per item, keyed by the same item id as item_scores. The client-side gate treats an
-- item with no evidence as unscored, so an observation cannot be completed by tapping
-- alone.
--
-- Shape: { "<item_id>": "<what the observer saw, typed or dictated>" }
--
-- Safe on existing rows: NOT NULL with a '{}' default, so every observation already
-- in the table reads back as "no evidence recorded" rather than breaking. Nothing
-- recomputes an old record's outcome from this column.
--
-- No RLS change. public.observations is protected by row-level policies only
-- (obs_select_scoped / obs_insert_scoped / obs_update_scoped, migration
-- 20260723140000) — there are no per-column grants to extend, which is what made the
-- T37 column-grant attempt take the staff list down. A new column inherits the
-- existing row policies as-is.

alter table public.observations
  add column if not exists item_notes jsonb not null default '{}'::jsonb;

comment on column public.observations.item_notes is
  'T91: per-item observation evidence, typed or dictated by the observer. Keys match item_scores. An item without evidence does not count as answered in the capture UI.';
