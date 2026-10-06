-- ==============================================================================
-- SHANNONS_DIARY / HACKATHON GENERIC SUPABASE STARTER SCHEMA
-- Feature-packed, completely idea-agnostic, pgvector & RLS enabled.
-- Run this in the Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Enable pgvector extension for embeddings / semantic search / RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Profiles Table (Synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Universal Entities / Records Table (Agnostic to notes, tasks, items, logs, agents)
CREATE TABLE IF NOT EXISTS public.entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_entities_user_id ON public.entities(user_id);
CREATE INDEX IF NOT EXISTS idx_entities_category ON public.entities(category);
CREATE INDEX IF NOT EXISTS idx_entities_metadata ON public.entities USING gin (metadata);

-- 4. Embeddings Table (For Vector Search / RAG / Semantic similarity)
-- Note: Default 1536 dimensions fits OpenAI text-embedding-3-small/ada-002, 
-- or 768 dimensions fits Gemini/text-embedding-004. Adjust if needed.
CREATE TABLE IF NOT EXISTS public.embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
    content_chunk TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- HNSW Index for ultra-fast approximate nearest neighbor vector search
CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw ON public.embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 5. RPC Vector Search Function
CREATE OR REPLACE FUNCTION public.match_embeddings (
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 10,
    filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    entity_id UUID,
    content_chunk TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        emb.id,
        emb.entity_id,
        emb.content_chunk,
        emb.metadata,
        1 - (emb.embedding <=> query_embedding) AS similarity
    FROM public.embeddings emb
    LEFT JOIN public.entities ent ON emb.entity_id = ent.id
    WHERE (filter_user_id IS NULL OR ent.user_id = filter_user_id OR ent.is_public = true)
      AND 1 - (emb.embedding <=> query_embedding) > match_threshold
    ORDER BY emb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/write their own profile
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Entities: Users can view own entities OR public ones; full control of own entities
CREATE POLICY "Users can select own or public entities" 
    ON public.entities FOR SELECT 
    USING (auth.uid() = user_id OR is_public = true OR auth.uid() IS NULL);

CREATE POLICY "Users can insert own entities" 
    ON public.entities FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update own entities" 
    ON public.entities FOR UPDATE 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can delete own entities" 
    ON public.entities FOR DELETE 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Embeddings: Read permitted for authorized entities
CREATE POLICY "Users can select embeddings for accessible entities" 
    ON public.embeddings FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.entities e 
            WHERE e.id = embeddings.entity_id 
              AND (e.user_id = auth.uid() OR e.is_public = true OR auth.uid() IS NULL)
        )
    );

CREATE POLICY "Users can insert embeddings" 
    ON public.embeddings FOR INSERT 
    WITH CHECK (true);
