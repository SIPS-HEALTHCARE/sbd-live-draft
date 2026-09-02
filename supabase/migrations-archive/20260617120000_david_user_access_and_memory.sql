-- 20260617120000_david_user_access_and_memory.sql
-- PRE-2 (DAVID phased build plan §3): heal the "missing-but-referenced" DAVID per-user tables.
-- These three tables are read/written by live code but had NO migration, so they only exist
-- where someone created them by hand. Without them: non-master DAVID access fails (auth.ts:35),
-- the admin user-toggle dashboard 500s (david-admin-api), and meta-memory/swarm memory silently
-- no-op. All statements are idempotent so this is safe to apply over hand-created tables.
--
-- IDENTIFIER SPACES (verified against code — do not "simplify"):
--   * david_user_access.user_id   = sbd_portal_users.id  (UUID)   — auth.ts:37, david-admin-api:237
--   * david_user_access.facility_id = VARCHAR string       — matches david_facility_access (NOT facilities.id uuid)
--   * david_user_preferences.user_id = auth.users.id (auth uid)    — index.ts:69, DavidChat.js:1751/1771
--   * assistant_memory.user_id       = auth.users.id (auth uid)    — index.ts:54/264
-- Edge functions use the service role (RLS-bypassing); the policies below exist so the FRONTEND
-- (which queries as the authenticated user) can read/write only its own rows.

-- ============================================================================
-- 1. david_user_access — per-user DAVID toggle within a facility
--    Granular gate layered on top of david_facility_access (auth.ts requires BOTH active).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.david_user_access (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,            -- sbd_portal_users.id
    facility_id VARCHAR NOT NULL,         -- string form, matches david_facility_access.facility_id
    is_active   BOOLEAN DEFAULT false,
    granted_by  UUID,                     -- sbd_portal_users.id of the master admin who granted it
    granted_at  TIMESTAMPTZ DEFAULT NOW(),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- One access row per (user, facility) — the code upserts on this pair (.eq user_id .eq facility_id).
-- Created as an index so it also heals a hand-made table that lacked the constraint.
CREATE UNIQUE INDEX IF NOT EXISTS david_user_access_user_facility_uniq
    ON public.david_user_access (user_id, facility_id);
CREATE INDEX IF NOT EXISTS david_user_access_facility_idx
    ON public.david_user_access (facility_id);

ALTER TABLE public.david_user_access ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.david_user_access TO service_role;

-- Master admins manage all rows (admin dashboard).
DROP POLICY IF EXISTS "dua_master_all" ON public.david_user_access;
CREATE POLICY "dua_master_all" ON public.david_user_access FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'master_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'master_admin');

-- A user may read ONLY their own access row (so the frontend nav gate getDavidAccess works).
-- user_id is a sbd_portal_users.id, so map it back to the caller via auth_uid = auth.uid().
-- (Relies on sbd_portal_users allowing the caller to self-read, which it already does:
--  api-supabase.js getUserProfile reads sbd_portal_users by auth_uid as the user in prod.)
DROP POLICY IF EXISTS "dua_self_select" ON public.david_user_access;
CREATE POLICY "dua_self_select" ON public.david_user_access FOR SELECT
    TO authenticated
    USING (user_id IN (SELECT id FROM public.sbd_portal_users WHERE auth_uid = auth.uid()));

-- ============================================================================
-- 2. david_user_preferences — per-user meta-memory blob (one row per user)
--    PK = user_id (auth uid) so the frontend's `Prefer: resolution=merge-duplicates`
--    POST (DavidChat.js:1765, no on_conflict param) correctly UPSERTS instead of
--    inserting duplicates — PostgREST resolves merge-duplicates on the primary key.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.david_user_preferences (
    user_id     UUID PRIMARY KEY,         -- auth.users.id
    memory_blob TEXT,                      -- freeform string; injected verbatim into the prompt
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.david_user_preferences ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.david_user_preferences TO service_role;

-- user_id IS the auth uid here, so self-access is a direct equality (no subquery needed).
DROP POLICY IF EXISTS "dup_self_all" ON public.david_user_preferences;
CREATE POLICY "dup_self_all" ON public.david_user_preferences FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "dup_master_all" ON public.david_user_preferences;
CREATE POLICY "dup_master_all" ON public.david_user_preferences FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'master_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'master_admin');

-- ============================================================================
-- 3. assistant_memory — append-only swarm memory of DAVID interactions
--    Written/read only by the edge function (service role); no frontend access.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assistant_memory (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL,        -- auth.users.id (profile.auth_uid on insert)
    interaction_type TEXT,
    context_summary  TEXT,
    raw_interaction  JSONB,                -- { query, response }
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assistant_memory_user_created_idx
    ON public.assistant_memory (user_id, created_at DESC);

ALTER TABLE public.assistant_memory ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.assistant_memory TO service_role;

-- A user may read their own memories; master admins may read all. Inserts come from the
-- service-role edge function (RLS-bypassing), so no INSERT policy is required for users.
DROP POLICY IF EXISTS "am_self_select" ON public.assistant_memory;
CREATE POLICY "am_self_select" ON public.assistant_memory FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "am_master_all" ON public.assistant_memory;
CREATE POLICY "am_master_all" ON public.assistant_memory FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'master_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'master_admin');
