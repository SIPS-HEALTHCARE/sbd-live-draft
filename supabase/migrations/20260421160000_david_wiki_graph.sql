-- 20260421160000_david_wiki_graph.sql
-- Establishing Karpathy-styled LLM Wiki Compounding Knowledge Graph natively in Supabase

-- Ensure pgvector is available
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Raw Sources (Immutable documents uploaded by Admins)
CREATE TABLE IF NOT EXISTS public.david_wiki_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    source_url TEXT,
    raw_text TEXT,
    document_type TEXT, -- e.g., 'PDF', 'SBD_POLICY', 'IFU'
    added_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.david_wiki_sources ENABLE ROW LEVEL SECURITY;

-- 2. The Compounding Brain (Synthesized Wiki Pages)
CREATE TABLE IF NOT EXISTS public.david_wiki_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- e.g., 'alta-bates-sterilization-protocol'
    title TEXT NOT NULL,
    content_md TEXT NOT NULL,
    source_references UUID[] DEFAULT '{}', -- Array of source IDs that informed this page
    embedding vector(1536), -- Optional: For pgvector semantic retrieval if the wiki scales massively
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.david_wiki_pages ENABLE ROW LEVEL SECURITY;

-- 3. The Central Index (Index.md equivalent for LLM mapping)
-- Holds a rapid, semantic overview of the entire wiki graph so DAVID knows where to look.
CREATE TABLE IF NOT EXISTS public.david_wiki_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    graph_overview_md TEXT NOT NULL,
    last_linted TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.david_wiki_index ENABLE ROW LEVEL SECURITY;

-- 4. Evolutionary Log (Append-only timeline of what DAVID learned and synthesized)
CREATE TABLE IF NOT EXISTS public.david_wiki_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL, -- e.g., '[2026-04-21] ingest', '[2026-04-21] synthesis'
    target_slug TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.david_wiki_logs ENABLE ROW LEVEL SECURITY;

-- Expose to Service Role for Edge Functions, lock down for public/auth
GRANT ALL ON public.david_wiki_sources TO service_role;
GRANT ALL ON public.david_wiki_pages TO service_role;
GRANT ALL ON public.david_wiki_index TO service_role;
GRANT ALL ON public.david_wiki_logs TO service_role;

-- Allow specifically Master Admins to read via Frontend
-- (Assuming master_admin role metadata handling)
CREATE POLICY "Allow Master Admins to read wiki" ON public.david_wiki_pages
    FOR SELECT TO authenticated USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'master_admin');
