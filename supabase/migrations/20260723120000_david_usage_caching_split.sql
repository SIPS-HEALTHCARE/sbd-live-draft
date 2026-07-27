-- 20260723120000_david_usage_caching_split.sql
-- Task #16 — Prompt caching: record cached vs uncached input tokens.
--
-- Additive + defaulted: two new columns on david_usage_logs, both NOT NULL DEFAULT 0, so every
-- historical row is correct by construction (0 cache activity before caching was enabled) and no
-- backfill is needed. No RLS change (the existing INSERT policy and the service-role writers still
-- apply; the edge functions just populate two extra integer columns on the same insert).
--
-- DEPENDS ON: 20260717120000_assessment_cost_tracking_source.sql (the `source` column). This
--   migration reuses the source='chat' scoping in david_analytics_summary. Apply order:
--   20260717120000 -> 20260717130000 -> 20260723120000.
--
-- The `cost` column stays the provider's ground-truth generation cost (usage.include already
-- reflects the cache discount), so cost is NOT recomputed here — these columns are the token
-- SPLIT behind that cost, surfaced so the cache savings are visible in the Command Center.

begin;

-- 1. Cache token split. Both default 0 so pre-caching rows and any writer not yet updated stay
--    correct. `cached_tokens` = input tokens READ from cache (billed at ~0.1x). `cache_creation_tokens`
--    = input tokens WRITTEN to cache on a miss (billed at ~1.25x). Both are a subset of the
--    provider's reported input; the uncached remainder is prompt_tokens - cached - creation.
alter table public.david_usage_logs
  add column if not exists cached_tokens integer not null default 0,
  add column if not exists cache_creation_tokens integer not null default 0;

comment on column public.david_usage_logs.cached_tokens is
  'Input tokens served from the prompt cache (cache READ) for this request, as reported by the provider (prompt_tokens_details.cached_tokens / cache_read_input_tokens). Subset of prompt_tokens, billed at a large discount. Added by #16.';
comment on column public.david_usage_logs.cache_creation_tokens is
  'Input tokens WRITTEN to the prompt cache (cache miss / creation) for this request (prompt_tokens_details.cache_write_tokens / cache_creation_input_tokens). Subset of prompt_tokens, billed at a premium. Added by #16.';

-- 2. Analytics view — unchanged shape plus two additive cache columns. Still chat-only (source='chat')
--    so the existing Master Dashboard numbers are untouched; readers that ignore the new columns keep
--    working. `create or replace` on a view with only ADDED trailing columns is safe.
-- NOTE: `create or replace view` can only APPEND columns — it cannot insert one before an
-- existing column (that reads as a positional rename → 42P16). So the two new cache sums go
-- AFTER the existing trailing `last_request_date`, preserving columns 1..5 exactly.
create or replace view public.david_analytics_summary as
select
    facility_id,
    count(*)                                as total_requests,
    sum(prompt_tokens + completion_tokens)  as total_tokens,
    sum(cost)                               as total_cost,
    max(created_at)                         as last_request_date,
    sum(cached_tokens)                      as total_cached_tokens,
    sum(cache_creation_tokens)              as total_cache_creation_tokens
from public.david_usage_logs
where source = 'chat'
group by facility_id;

commit;

-- Rollback (drop-and-recreate the view — create-or-replace cannot REMOVE columns either):
--   drop view if exists public.david_analytics_summary;
--   create view public.david_analytics_summary as
--     select facility_id, count(*) as total_requests,
--            sum(prompt_tokens + completion_tokens) as total_tokens,
--            sum(cost) as total_cost, max(created_at) as last_request_date
--     from public.david_usage_logs where source = 'chat' group by facility_id;
--   alter table public.david_usage_logs drop column if exists cache_creation_tokens;
--   alter table public.david_usage_logs drop column if exists cached_tokens;
