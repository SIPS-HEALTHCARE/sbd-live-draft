-- t112-recheck-recovered-reviews.sql
-- Re-checks every review sbd_recover_placements has already built (the rows in
-- sbd_placement_recovery_log) against the ALIGNED engine shipped in migration
-- 20260819130000, and offers a repair for the ones still pending.
--
-- Run PART 1 first (read-only). PART 2 is the repair: it is wrapped in a transaction
-- and commits NOTHING by itself — read its verification output, then COMMIT or ROLLBACK.
-- It never touches a candidate's stored answers: only the belt seed, the new recovery
-- marker, and the marker fields on BLANK rows (answer ''/correct null -> 'No answer'/false).
-- Reviews an assessor has already confirmed are reported but never updated.

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1 — READ-ONLY RECHECK
-- ═══════════════════════════════════════════════════════════════════════════
with calc as (
  select
    pr.id            as review_id,
    pr.staff_name,
    pr.status,
    pr.tentative_belt as old_tentative_belt,
    pr.submitted_at,
    s.expires_at,
    (select nullif(s.progress->>'lastSavedAt','')::timestamptz) as last_saved,
    agg.*
  from sbd_placement_recovery_log l
  join placement_reviews pr on pr.session_id = l.session_id
  left join sbd_assessment_sessions s on s.id = l.session_id
  cross join lateral (
    select
      coalesce(avg(case when r->>'type'='knowledge'
        then case when coalesce((r->>'correct')::boolean, false) then 100 else 0 end end), 0) as kraw,
      coalesce(avg(case when r->>'type'='knowledge' and (r->>'level')::int = 1
        then case when coalesce((r->>'correct')::boolean, false) then 100 else 0 end end), 0) as kl1,
      coalesce(avg(case when r->>'type'='simulation'
        then coalesce((r->>'aiScore')::numeric, 0) end), 0) as sraw,
      coalesce(bool_or(r->>'type'='knowledge'
        and coalesce((r->>'isDangerous')::boolean, false)
        and not coalesce((r->>'correct')::boolean, false)), false) as danger,
      count(*) filter (where r->>'type'='knowledge' and (r->'correct') = 'null'::jsonb) as k_correct_null,
      count(*) filter (where r->>'type'='simulation' and coalesce(trim(r->>'answer'),'') = '') as sim_blank_str
    from jsonb_array_elements(pr.responses) r
  ) agg
),
judged as (
  select c.*,
    c.kraw * 0.6 + c.sraw * 0.4 as blended,
    case
      when c.last_saved is null then 'unknown'
      when extract(epoch from (c.expires_at - c.last_saved)) / 60.0 <= 3 then 'timer'
      else 'abandoned' end as reason,
    round(extract(epoch from (c.expires_at - c.last_saved)) / 60.0) as minutes_left
  from calc c
),
suggested as (
  select j.*,
    -- MUST MATCH sbdSuggestBelt() / BELT_TEST_CONFIG (see migration 20260819130000 header)
    case
      when j.blended >= 90 and j.kraw >= 92 then case when j.sraw >= 87 then 'Black Belt'  else 'Black Belt Conditional'  end
      when j.blended >= 87 and j.kraw >= 91 then case when j.sraw >= 84 then 'Brown Belt'  else 'Brown Belt Conditional'  end
      when j.blended >= 85 and j.kraw >= 89 then case when j.sraw >= 82 then 'Blue Belt'   else 'Blue Belt Conditional'   end
      when j.blended >= 81 and j.kraw >= 86 then case when j.sraw >= 78 then 'Green Belt'  else 'Green Belt Conditional'  end
      when j.blended >= 78 and j.kraw >= 83 then case when j.sraw >= 75 then 'Yellow Belt' else 'Yellow Belt Conditional' end
      when j.blended >= 75 and j.kraw >= 80 then case when j.sraw >= 72 then 'White Belt'  else 'White Belt Conditional'  end
      when j.kraw >= 80 and j.kl1 >= 80 then case when j.danger then 'Knowledge Foundation Deferred' else 'Knowledge Foundation' end
      else 'No Belt' end as new_suggestion
  from judged j
)
select
  review_id, staff_name, status, submitted_at,
  old_tentative_belt,
  new_suggestion,
  substring(new_suggestion from 'White|Yellow|Green|Blue|Brown|Black') as new_tentative_belt,
  reason, minutes_left, last_saved, expires_at,
  round(kraw, 1) as knowledge_pct, round(sraw, 1) as sim_pct, round(blended, 1) as blended_pct,
  k_correct_null as knowledge_blanks_with_null_correct,
  sim_blank_str  as sim_blanks_with_empty_string
from suggested
order by submitted_at;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2 — REPAIR (pending reviews only; COMMIT or ROLLBACK yourself)
-- ═══════════════════════════════════════════════════════════════════════════
begin;

with calc as (
  select
    pr.id as review_id, pr.status,
    s.expires_at,
    (select nullif(s.progress->>'lastSavedAt','')::timestamptz) as last_saved,
    agg.*
  from sbd_placement_recovery_log l
  join placement_reviews pr on pr.session_id = l.session_id
  left join sbd_assessment_sessions s on s.id = l.session_id
  cross join lateral (
    select
      coalesce(avg(case when r->>'type'='knowledge'
        then case when coalesce((r->>'correct')::boolean, false) then 100 else 0 end end), 0) as kraw,
      coalesce(avg(case when r->>'type'='knowledge' and (r->>'level')::int = 1
        then case when coalesce((r->>'correct')::boolean, false) then 100 else 0 end end), 0) as kl1,
      coalesce(avg(case when r->>'type'='simulation'
        then coalesce((r->>'aiScore')::numeric, 0) end), 0) as sraw,
      coalesce(bool_or(r->>'type'='knowledge'
        and coalesce((r->>'isDangerous')::boolean, false)
        and not coalesce((r->>'correct')::boolean, false)), false) as danger
    from jsonb_array_elements(pr.responses) r
  ) agg
),
judged as (
  select c.*,
    c.kraw * 0.6 + c.sraw * 0.4 as blended,
    case
      when c.last_saved is null then 'unknown'
      when extract(epoch from (c.expires_at - c.last_saved)) / 60.0 <= 3 then 'timer'
      else 'abandoned' end as reason,
    round(extract(epoch from (c.expires_at - c.last_saved)) / 60.0) as minutes_left
  from calc c
),
suggested as (
  select j.*,
    case
      when j.blended >= 90 and j.kraw >= 92 then case when j.sraw >= 87 then 'Black Belt'  else 'Black Belt Conditional'  end
      when j.blended >= 87 and j.kraw >= 91 then case when j.sraw >= 84 then 'Brown Belt'  else 'Brown Belt Conditional'  end
      when j.blended >= 85 and j.kraw >= 89 then case when j.sraw >= 82 then 'Blue Belt'   else 'Blue Belt Conditional'   end
      when j.blended >= 81 and j.kraw >= 86 then case when j.sraw >= 78 then 'Green Belt'  else 'Green Belt Conditional'  end
      when j.blended >= 78 and j.kraw >= 83 then case when j.sraw >= 75 then 'Yellow Belt' else 'Yellow Belt Conditional' end
      when j.blended >= 75 and j.kraw >= 80 then case when j.sraw >= 72 then 'White Belt'  else 'White Belt Conditional'  end
      when j.kraw >= 80 and j.kl1 >= 80 then case when j.danger then 'Knowledge Foundation Deferred' else 'Knowledge Foundation' end
      else 'No Belt' end as new_suggestion,
    case
      when j.reason = 'timer'     then 'No answer submitted (time expired).'
      when j.reason = 'abandoned' then 'No answer submitted (assessment left unfinished).'
      else                             'No answer submitted.' end as blank_fb
  from judged j
)
update placement_reviews pr
set tentative_belt = substring(s.new_suggestion from 'White|Yellow|Green|Blue|Brown|Black'),
    recovery = jsonb_build_object(
      'source', 'sbd_recover_placements',
      'reason', s.reason,
      'last_saved_at', s.last_saved,
      'expires_at', s.expires_at,
      'minutes_left', s.minutes_left,
      'suggestion', s.new_suggestion,
      'repaired_at', now()),
    responses = (
      select jsonb_agg(
        case
          -- knowledge blank: correct null -> false (answer already reads 'No answer')
          when r->>'type' = 'knowledge' and (r->'correct') = 'null'::jsonb
            then r || jsonb_build_object('correct', false)
          -- sim blank: '' -> 'No answer', add the missing verdict, honest feedback
          when r->>'type' = 'simulation' and coalesce(trim(r->>'answer'),'') = ''
            then r || jsonb_build_object('answer', 'No answer', 'correct', false, 'aiFeedback', s.blank_fb)
          else r
        end order by ord)
      from jsonb_array_elements(pr.responses) with ordinality t(r, ord))
from suggested s
where pr.id = s.review_id
  and pr.status = 'pending';

-- Verify before committing: belts, reasons, and that no blank markers remain.
select pr.id, pr.staff_name, pr.status, pr.tentative_belt,
       pr.recovery->>'suggestion' as suggestion,
       pr.recovery->>'reason' as reason,
       pr.recovery->>'minutes_left' as minutes_left,
       (select count(*) from jsonb_array_elements(pr.responses) r
         where (r->'correct') = 'null'::jsonb
            or (r->>'type' = 'simulation' and coalesce(trim(r->>'answer'),'') = '')) as remaining_bad_markers
from sbd_placement_recovery_log l
join placement_reviews pr on pr.session_id = l.session_id
order by pr.submitted_at;

-- COMMIT;   -- run when the output above is right
-- ROLLBACK; -- otherwise
