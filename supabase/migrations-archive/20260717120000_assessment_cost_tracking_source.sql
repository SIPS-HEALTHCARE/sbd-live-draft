-- 20260717120000_assessment_cost_tracking_source.sql
-- Task #14 — Assessment grading cost tracking (tagged-rows model).
-- Meters AI assessment-grading spend (sbd-score-assessment) separately from David chat,
-- WITHOUT touching the chat question allowance and WITHOUT contaminating the existing
-- chat metrics. See docs/decisions/2026-07-17-assessment-cost-tracking.md.
--
-- Additive + defaulted: no destructive change, no backfill (existing rows are all chat and
-- the DEFAULT covers them), no RLS change (the existing INSERT policy auth.uid()=user_id and
-- the edge-function service role still apply; assessment rows carry the candidate's uid).
--
-- ⚠️ PROD-DRIFT: production `david_usage_logs` may already carry an out-of-band `app` column
-- (`david_usage_by_app_mtd` has no repo migration — likely a dashboard-created §B2 object).
-- This migration is ADD COLUMN IF NOT EXISTS so it is safe to apply regardless, but if an
-- `app` column already distinguishes chat vs assessment, reconcile `app` vs `source` rather
-- than keeping two parallel columns. Confirm the live schema before applying.

begin;

-- 1. Source tag. 'chat' default so every historical row and every reader not yet scoped
--    stays correct by construction. 'assessment' is written by sbd-score-assessment.
alter table public.david_usage_logs
  add column if not exists source text not null default 'chat';

-- Constrain to the known sources (idempotent — guarded so re-apply is a no-op).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'david_usage_logs_source_chk'
  ) then
    alter table public.david_usage_logs
      add constraint david_usage_logs_source_chk check (source in ('chat','assessment'));
  end if;
end $$;

comment on column public.david_usage_logs.source is
  'Which AI system produced this usage row: ''chat'' (David chat, the default) or ''assessment'' (sbd-score-assessment grading). Added by #14 so grading spend is metered separately. Chat readers (david-admin-api GET_METRICS MTD, david_analytics_summary view, david-anomaly-detector) filter source=''chat''. Grading NEVER calls david_consume_question, so the chat allowance is untouched.';

-- 2. Index the columns every scoped reader now filters on.
create index if not exists idx_david_usage_logs_source_created
  on public.david_usage_logs (source, created_at);

-- 3. Analytics view — SAME columns/shape as before, now chat-only so the Master Dashboard
--    analytics numbers are unchanged by the introduction of assessment rows. Assessment
--    spend is surfaced separately by the #15 margin view (not this migration).
create or replace view public.david_analytics_summary as
select
    facility_id,
    count(*)                                as total_requests,
    sum(prompt_tokens + completion_tokens)  as total_tokens,
    sum(cost)                               as total_cost,
    max(created_at)                         as last_request_date
from public.david_usage_logs
where source = 'chat'
group by facility_id;

commit;

-- Rollback:
--   -- restore the all-source analytics view
--   create or replace view public.david_analytics_summary as
--     select facility_id, count(*) as total_requests,
--            sum(prompt_tokens + completion_tokens) as total_tokens,
--            sum(cost) as total_cost, max(created_at) as last_request_date
--     from public.david_usage_logs group by facility_id;
--   drop index if exists public.idx_david_usage_logs_source_created;
--   alter table public.david_usage_logs drop constraint if exists david_usage_logs_source_chk;
--   alter table public.david_usage_logs drop column if exists source;
