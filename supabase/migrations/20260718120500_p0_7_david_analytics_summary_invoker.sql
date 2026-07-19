-- P0-7 (2026-07-18) · david_analytics_summary — SECURITY DEFINER view (advisor ERROR).
-- Finding: Supabase advisor "Security Definer View" (ERROR). A SECURITY DEFINER view runs
-- with the VIEW OWNER's privileges, so it silently bypasses the querying user's RLS on the
-- underlying usage tables. The only reader is the david-admin-api edge function, which uses
-- the service role — so switching the view to security_invoker is transparent for that path
-- while removing the RLS-bypass surface for any other caller.
--
-- (The view body is defined/maintained in 20260717120000_assessment_cost_tracking_source.sql;
--  this migration only flips the execution-context option — no body change.)
begin;

alter view public.david_analytics_summary set (security_invoker = on);

commit;

-- Rollback:
--   alter view public.david_analytics_summary set (security_invoker = off);
