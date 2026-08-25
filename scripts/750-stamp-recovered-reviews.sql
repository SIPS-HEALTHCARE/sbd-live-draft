-- 750-stamp-recovered-reviews.sql
-- #750 close-out: the four reviews in sbd_placement_recovery_log were all decided by an
-- assessor before the T112 repair ran (none pending), so t112-recheck-recovered-reviews.sql
-- correctly refused to touch them — and they still carry NO recovery note. This stamps the
-- missing `recovery` jsonb (aligned-engine suggestion + honest reason, including the #750
-- 'deactivated' case) onto exactly those rows. It changes NOTHING else: tentative_belt,
-- status, and responses are assessor territory and stay as decided.
--
-- Recheck (read via the same CTE with the update commented out) computed 2026-08-24:
--   Terra Tanner    confirmed White | engine: No Belt (K 67.5 / S 35.3 / blended 54.6) | abandoned, ~23 min left
--   Kevin Mckenzie  confirmed White | engine: No Belt (K 67.5 / S 53.3 / blended 61.8) | timer, last save 2s before expiry
--   Nelly Kyeremaa  adjusted        | engine: No Belt (K 25.6 / S 15.5 / blended 21.6) | abandoned, ~65 min left
--   Nikkia Warfield confirmed White | engine: White Belt Conditional (K 87.2 / S 56.9 / blended 75.1) | DEACTIVATED, banned 21:47:27 with ~53 min left
--
-- Wrapped in a transaction; read the verification output, then COMMIT or ROLLBACK.

begin;

with calc as (
  select
    pr.id as review_id, pr.status,
    s.expires_at,
    (select nullif(s.progress->>'lastSavedAt','')::timestamptz) as last_saved,
    exists (
      select 1 from auth.users u
      where u.id = pr.staff_id
        and u.banned_until is not null
        and u.updated_at between s.authorized_at and s.expires_at
    ) as deactivated,
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
  where pr.recovery is null   -- stamp once; never overwrite a note that exists
),
judged as (
  select c.*,
    c.kraw * 0.6 + c.sraw * 0.4 as blended,
    case
      when c.deactivated then 'deactivated'
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
update placement_reviews pr
set recovery = jsonb_build_object(
      'source', 'sbd_recover_placements',
      'reason', s.reason,
      'last_saved_at', s.last_saved,
      'expires_at', s.expires_at,
      'minutes_left', s.minutes_left,
      'suggestion', s.new_suggestion,
      'rechecked_at', now())
from suggested s
where pr.id = s.review_id;

-- Verify before committing: every log row noted, decisions untouched.
select pr.staff_name, pr.status, pr.tentative_belt,
       pr.recovery->>'reason' as reason,
       pr.recovery->>'suggestion' as suggestion,
       pr.recovery->>'minutes_left' as minutes_left,
       pr.recovery->>'rechecked_at' is not null as stamped_now
from sbd_placement_recovery_log l
join placement_reviews pr on pr.session_id = l.session_id
order by pr.submitted_at;

-- COMMIT;   -- run when the output above is right
-- ROLLBACK; -- otherwise
