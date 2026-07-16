# 2026-07-17 — Assessment grading cost tracking (#14)

> Design-First Gate note (ENGINEERING_STANDARDS.md §4). Feature touches the DB schema and
> three edge functions, so this note is written before implementation code.
> Source request: ETA list `plans/ETA-Task-List-for-Shawn-2026-07-15.md` #14 — "Assessment
> grading cost tracking (must not touch chat allowance)". Metering model confirmed:
> **tagged rows** (per user, 2026-07-17).
>
> **Note — this re-creates a lost artifact.** #14 was built into the working tree on
> 2026-07-16 (tagged-rows model, same design) and then discarded during the window-override
> branch churn (nothing survives in tree, branches, stash, or reflog). This note + the
> implementation are a faithful rebuild from the recorded spec, verified against repo HEAD
> `7c1b1a1`.

Problem:
  AI assessment grading (`sbd-score-assessment`, called by `scoreSimulationWithAI()` in
  ui-views.js:2604 and belt-test-flow.js:262) calls a paid model (OpenRouter) on every
  simulation answer, but that spend is **invisible** — the function returns a score and
  writes nothing. Meanwhile David chat spend IS metered in `david_usage_logs`. SBD needs to
  see grading cost per facility to price/margin it, WITHOUT (a) charging grading against the
  facility's monthly David *question allowance*, and (b) contaminating the existing chat
  metrics (Command Center MTD tiles, `david_analytics_summary`, the #59 anomaly detector)
  that read `david_usage_logs` today.

Options:
  1. **Tagged rows** — add a `source` column to `david_usage_logs` ('chat' default,
     'assessment' for grading). Grading writes a `source='assessment'` row; every existing
     chat reader is scoped to `source='chat'` so its numbers are unchanged. One additive
     column, one table, reuses the metering plumbing.
  2. **Separate table** (`assessment_usage_logs`) — cleanest isolation, but duplicates the
     insert/read/aggregate plumbing and the anomaly/analytics wiring, and splits "AI spend"
     across two tables for any future combined view (#15 margin view would join two sources).
  3. **Do nothing / recompute later** — no per-request cost truth; violates Scalability
     Sniff Test §5.5 ("how do we know it broke / what it cost").

Choice + why:
  **Option 1 (tagged rows).** It is the smallest correct change and keeps a single source of
  truth for all AI spend, which the #15 per-facility margin view will need. The `source`
  column defaults to `'chat'`, so every historical row and every un-migrated reader stays
  correct by construction. Chat allowance is untouched *by construction*: grading has never
  called `david_consume_question()` (verified — zero references in sbd-score-assessment), and
  this change adds none. The only leakage path is metric contamination, which the
  `source='chat'` scoping on every chat reader closes.

  Attribution: `sbd-score-assessment` currently holds no Supabase client (OpenRouter only).
  It gains a service-role client (mirroring david-chat:519) and writes the assessment row
  fire-and-forget — a logging failure never affects the candidate's grade. `facility_id` +
  `user_id` come from the caller (added to the request body from `ST.user` inside
  `scoreSimulationWithAI`, so no caller signatures change). This is cost attribution, not a
  security boundary, so client-supplied ids are acceptable (the row is written server-side,
  and grading is already open to any authenticated caller by design).

  Provider cost truth: the OpenRouter call adds `usage: { include: true }` (via the existing
  `extraBody` hook) so the stored `cost` is the provider's ground-truth generation cost — the
  same correction david-chat made (never the old prompt-token×rate estimate).

  Deferred (NOT in this change): the `is_active`/403 killswitch that would gate grading on a
  facility's disabled state (couples #14 to #59's auto-disable and can block *legitimate*
  grading). Shipping core cost-tracking first; killswitch is a fast-follow if Shawn wants
  grading spend gated by facility state.

Blast radius:
  - **Migration** `20260717120000_assessment_cost_tracking_source.sql` — `ALTER TABLE
    david_usage_logs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'chat'` + index on
    `(source, created_at)`; `CREATE OR REPLACE VIEW david_analytics_summary` (same columns)
    scoped `WHERE source='chat'`. Additive, no backfill (default covers existing rows), no
    RLS change (the existing INSERT policy `auth.uid() = user_id` and edge-function service
    role still apply; assessment rows carry the candidate's uid).
  - **`sbd-score-assessment/index.ts`** — new service-role client + fire-and-forget insert;
    `usage:{include:true}`; accepts `facility_id`/`user_id`. No change to scoring logic or
    the auth check.
  - **`david-admin-api/index.ts`** (GET_METRICS, ~L247) — MTD `david_usage_logs` query gains
    `.eq('source','chat')`. The `david_analytics_summary` select is already chat-only via the
    scoped view.
  - **`david-anomaly-detector/index.ts`** (~L75) — window read gains `.eq('source','chat')`
    so bounded, legitimate grading spend can't trip the #59 chat-abuse detector.
  - **`ui-views.js`** `scoreSimulationWithAI` (L2604) — adds facility_id + auth uid to the
    request body from `ST.user`; `index.html` `ui-views.js?v=156→157`.
  - **What could break:** if a chat reader is missed, its numbers would silently include
    assessment rows. Mitigation: every current `david_usage_logs` reader is enumerated above
    (admin-api MTD, analytics view, anomaly detector; the chat insert in david-chat is a
    writer, not a reader). PROD-DRIFT CAVEAT below.

  ⚠️ **Prod-drift caveat (team must confirm before applying):** `david_usage_by_app_mtd` is
  referenced in prod discussions but has **no repo migration**, so production's
  `david_usage_logs` may already carry an out-of-band `app` column (dashboard-created — a
  §B2 violation). The migration is `ADD COLUMN IF NOT EXISTS` so it is safe either way, but
  if an `app` column already distinguishes chat vs. assessment, we must reconcile `app` vs.
  `source` rather than create two parallel columns. **Team: confirm the live
  `david_usage_logs` schema before applying.**

Rollback:
  ```sql
  -- restore the all-source analytics view
  CREATE OR REPLACE VIEW david_analytics_summary AS
    SELECT facility_id, COUNT(*) AS total_requests,
           SUM(prompt_tokens + completion_tokens) AS total_tokens,
           SUM(cost) AS total_cost, MAX(created_at) AS last_request_date
    FROM david_usage_logs GROUP BY facility_id;
  DROP INDEX IF EXISTS idx_david_usage_logs_source_created;
  ALTER TABLE david_usage_logs DROP COLUMN IF EXISTS source;  -- removes assessment/chat split
  ```
  Revert the three edge functions + `scoreSimulationWithAI` + the `?v=` bump via git. No data
  is lost on rollback (assessment rows simply lose their tag and read as chat again).

Definition of Done (ENGINEERING_STANDARDS §3):
  - [x] Schema change is a migration file.
  - [x] Edge fns deployable via `supabase functions deploy` (no dashboard edit; no new inline dup).
  - [x] `ui-views.js` `?v=` bumped.
  - [x] `scoreSimulationWithAI` callers grepped (ui-views.js:2324, belt-test-flow.js:262) —
        signature unchanged, so no caller edits needed.
  - [x] Every `david_usage_logs` reader grepped and scoped.
  - [x] Insert error path logs (fire-and-forget with `console.warn`), never silent.
  - [x] `ARCHITECTURE.md` updated (tables + edge fns + data flow).
