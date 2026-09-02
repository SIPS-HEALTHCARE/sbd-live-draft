-- Qualify the ambiguous `app` column in david_usage_by_app_mtd.
--
-- 20260717130000 selected `fid, fname, app` unqualified out of the `agg` CTE. plpgsql also
-- sees the function's own OUT parameter named `app`, so every call raised 42702
-- "column reference app is ambiguous" and returned 400. The Command Center's Network Token
-- Usage and AI Cost tiles read that RPC and fall back to "Usage data unavailable" when it
-- fails, so both tiles were blank for every master admin.
--
-- The body below is otherwise identical to 20260717130000. Only the column references are
-- qualified. Applied to production by hand on 2026-08-04 before this file existed; this
-- migration records it so an environment already past 20260717130000 picks the fix up too.

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
  SELECT agg.fid, agg.fname, agg.app,
         q_mtd, t_mtd, c_mtd,          -- legacy names = month-to-date
         q_mtd, t_mtd, c_mtd,          -- _mtd
         q_all, t_all, c_all           -- _all
  FROM agg
  ORDER BY agg.fname, agg.app;
END;
$function$;

-- Grants: `create or replace` preserves existing privileges, so EXECUTE for
-- `authenticated` carries over untouched. Verified live: postgres, service_role and
-- authenticated all hold EXECUTE after the apply.
