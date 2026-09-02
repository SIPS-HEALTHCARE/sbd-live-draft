-- 20260819150000_account_delete_audit.sql
-- Delete-control (client report 2026-08-19): permanent account deletions ran with
-- no record of the caller — Supabase auth logs show only service_role and age out
-- in 24h. This ledger records who deleted whom, written BEFORE the delete executes
-- by the sbd-sync-user-claims edge function (service role); the function aborts
-- the delete if this insert fails.
--
-- Why a dedicated table (not sbd_activity_log): activity_log is engagement
-- telemetry whose RLS exposes rows to facility leaders/system admins. Account
-- deletions are a security signal that stays admin-only — same reasoning as
-- 20260723162412_assessment_pin_attempts.sql.

CREATE TABLE IF NOT EXISTS public.sbd_account_audit (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action           text NOT NULL,          -- 'user_deleted'
    actor_auth_uid   uuid NOT NULL,          -- who called the delete (verified JWT)
    actor_email      text,
    actor_role       text,
    target_auth_uid  uuid,
    target_portal_id text,                   -- sbd_portal_users.id as text (legacy ids may not be uuids)
    target_email     text,
    target_name      text,
    target_role      text,
    detail           jsonb DEFAULT '{}'::jsonb,
    created_at       timestamptz DEFAULT now()
);

-- HEAL: non-destructive column adds in case an out-of-band table already exists.
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS action           text;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS actor_auth_uid   uuid;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS actor_email      text;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS actor_role       text;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS target_auth_uid  uuid;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS target_portal_id text;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS target_email     text;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS target_name      text;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS target_role      text;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS detail           jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.sbd_account_audit ADD COLUMN IF NOT EXISTS created_at       timestamptz DEFAULT now();

ALTER TABLE public.sbd_account_audit ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.sbd_account_audit TO service_role;

-- Reads: admins only. Inserts come solely from the service-role edge function,
-- which bypasses RLS — so there is intentionally no INSERT policy, and no
-- UPDATE/DELETE policy for anyone: the ledger is append-only to clients.
DROP POLICY IF EXISTS "saa_admin_select" ON public.sbd_account_audit;
CREATE POLICY "saa_admin_select" ON public.sbd_account_audit FOR SELECT
    TO authenticated
    USING (public.sbd_is_admin());
