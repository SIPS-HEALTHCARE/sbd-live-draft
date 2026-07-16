-- 20260717130000_david_usage_by_app_mtd_source_scope.sql
-- Task #14 (reader-fix) — scope david_usage_by_app_mtd() to source='chat'.
-- See docs/decisions/2026-07-17-ph2-development-plan.md §1 and
--     docs/decisions/2026-07-17-assessment-cost-tracking.md.
--
-- WHY: david_usage_by_app_mtd() is the per-platform (sbd/psop) MTD usage RPC read by
-- david-command-center.html:517 to render each facility's platform usage cards. Its live body
-- reads FROM david_usage_logs and GROUPs BY app but NEVER filters `source`. Once
-- sbd-score-assessment starts writing source='assessment' rows (they carry app='sbd'), this
-- RPC would fold grading spend into the app='sbd' bucket -> the Command Center's SBD chat
-- cards inflate with assessment spend. That is exactly the metric contamination #14 exists to
-- prevent. The #14 note enumerated three chat readers (david-admin-api GET_METRICS MTD, the
-- david_analytics_summary view, david-anomaly-detector) but MISSED this one, because it is a
-- prod-only object with no repo migration (a §B2 dashboard-created RPC) that the repo grep
-- could not see. This migration adds the missing `where source='chat'` AND formalizes the RPC
-- into git (killing the §B2 drift in the same stroke).
--
-- DEPENDS ON: 20260717120000_assessment_cost_tracking_source.sql (adds the `source` column
--   as NOT NULL DEFAULT 'chat', so every historical row is already 'chat' by construction and
--   the source filter below drops no existing usage).
--   Apply order: 20260717120000 -> 20260717130000.
-- ASSUMES: the prod `app` column on david_usage_logs (a dashboard object; app=product, sbd|psop)
--   already exists. It is out of #14's scope to formalize (app and source are orthogonal:
--   app=product, source=spend-type). On a fresh DB without the dashboard `app` column this
--   migration will not apply — it targets prod, where `app` exists.
--
-- =============================================================================================
-- RECONCILED AGAINST LIVE 2026-07-17. The body below is the authoritative live definition
-- captured via `select pg_get_functiondef('public.david_usage_by_app_mtd'::regproc);` with
-- EXACTLY ONE change: `WHERE l.source = 'chat'` added to the david_usage_logs scan inside the
-- `agg` CTE. The full RETURNS TABLE signature (12 cols incl. facility_name and the legacy
-- questions/tokens/cost triple), the sbd_portal_users master-admin gate, the facilities LEFT
-- JOIN, the ROUND(...,4) cost expressions, the ORDER BY, LANGUAGE, and SECURITY DEFINER are
-- reproduced verbatim so `create or replace` does not alter the return type. (An earlier draft
-- of this file carried an 8-column reconstruction, which is why a first apply hit
-- 42P13 "cannot change return type"; that mismatch is now resolved.)
-- =============================================================================================

begin;

CREATE OR REPLACE FUNCTION public.david_usage_by_app_mtd()
 RETURNS TABLE(facility_id text, facility_name text, app text, questions bigint, tokens bigint, cost numeric, questions_mtd bigint, tokens_mtd bigint, cost_mtd numeric, questions_all bigint, tokens_all bigint, cost_all numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sbd_portal_users u
    WHERE u.auth_uid = auth.uid() AND u.role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: master admin only';
  END IF;

  RETURN QUERY
  WITH agg AS (
    SELECT
      l.facility_id::text AS fid,
      COALESCE(f.name,
        CASE WHEN l.facility_id = 'master-admin-global'
             THEN 'SIPS Internal (Master)' ELSE l.facility_id::text END) AS fname,
      l.app AS app,
      COUNT(*) FILTER (WHERE l.created_at >= date_trunc('month', now()))::bigint AS q_mtd,
      COALESCE(SUM(l.prompt_tokens + l.completion_tokens) FILTER (WHERE l.created_at >= date_trunc('month', now())), 0)::bigint AS t_mtd,
      ROUND(COALESCE(SUM(l.cost) FILTER (WHERE l.created_at >= date_trunc('month', now())), 0)::numeric, 4) AS c_mtd,
      COUNT(*)::bigint AS q_all,
      COALESCE(SUM(l.prompt_tokens + l.completion_tokens), 0)::bigint AS t_all,
      ROUND(COALESCE(SUM(l.cost), 0)::numeric, 4) AS c_all
    FROM david_usage_logs l
    LEFT JOIN facilities f ON f.id::text = l.facility_id
    WHERE l.source = 'chat'          -- <<< THE FIX: assessment rows never reach the platform cards.
    GROUP BY l.facility_id, f.name, l.app
  )
  SELECT fid, fname, app,
         q_mtd, t_mtd, c_mtd,          -- legacy names = month-to-date
         q_mtd, t_mtd, c_mtd,          -- _mtd
         q_all, t_all, c_all           -- _all
  FROM agg
  ORDER BY fname, app;
END;
$function$;

commit;

-- NOTE on grants: `create or replace` PRESERVES the function's existing privileges (the
-- signature is unchanged from live), so the Command Center's authenticated caller keeps
-- EXECUTE. No re-grant is needed for this apply.
--
-- Rollback (restore the all-source body — i.e. remove the `WHERE l.source = 'chat'` line):
--   Re-run the CREATE OR REPLACE above WITHOUT that WHERE clause. Assessment rows then read
--   back into the platform cards (the pre-#14 behavior). No data is touched by this migration;
--   only the function body changes.
