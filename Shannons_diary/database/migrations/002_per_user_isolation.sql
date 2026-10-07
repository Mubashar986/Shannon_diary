-- ==============================================================================
-- 002: per-user isolation
-- Brings the live Shannons_diary project in line with the API, which now forwards
-- each caller's access token instead of querying as an anonymous client.
--
-- Why: the original policies ended every clause with "OR auth.uid() IS NULL".
-- With no JWT, auth.uid() IS NULL, so those policies were true for every row and
-- any anonymous visitor could update or delete anyone's data.
--
-- Run in Supabase Dashboard -> SQL Editor, or:
--   pgrst="$(.venv/Scripts/python.exe -c "import app.config;print(app.config.settings.supabase_url)")"
-- ==============================================================================

BEGIN;

-- entities ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can select own or public entities" ON public.entities;
DROP POLICY IF EXISTS "Users can insert own entities"           ON public.entities;
DROP POLICY IF EXISTS "Users can update own entities"           ON public.entities;
DROP POLICY IF EXISTS "Users can delete own entities"           ON public.entities;
DROP POLICY IF EXISTS "entities_select"                        ON public.entities;
DROP POLICY IF EXISTS "entities_insert"                        ON public.entities;
DROP POLICY IF EXISTS "entities_update"                        ON public.entities;
DROP POLICY IF EXISTS "entities_delete"                        ON public.entities;

ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entities_select" ON public.entities FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

-- user_id is set by the backend from the verified token, never by the request body.
CREATE POLICY "entities_insert" ON public.entities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "entities_update" ON public.entities FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "entities_delete" ON public.entities FOR DELETE
    USING (auth.uid() = user_id);

-- profiles ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
    USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- embeddings -------------------------------------------------------------------
-- The old INSERT policy was "WITH CHECK (true)", which let anyone attach a vector
-- to any entity. Nothing writes embeddings yet; this tightens it before anything does.
DROP POLICY IF EXISTS "Users can select embeddings for accessible entities" ON public.embeddings;
DROP POLICY IF EXISTS "Users can insert embeddings" ON public.embeddings;
DROP POLICY IF EXISTS "embeddings_select" ON public.embeddings;
DROP POLICY IF EXISTS "embeddings_insert" ON public.embeddings;

ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "embeddings_select" ON public.embeddings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.entities e
            WHERE e.id = embeddings.entity_id
              AND (e.user_id = auth.uid() OR e.is_public = true)
        )
    );

CREATE POLICY "embeddings_insert" ON public.embeddings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.entities e
            WHERE e.id = embeddings.entity_id AND e.user_id = auth.uid()
        )
    );

-- updated_at was declared in the schema but nothing maintained it.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS entities_touch_updated_at ON public.entities;
CREATE TRIGGER entities_touch_updated_at
    BEFORE UPDATE ON public.entities
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;

-- Verify: an anonymous SELECT must return 0 rows now, and anonymous PATCH must affect none.
--   curl -s "$PGRST/rest/v1/entities?select=id" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
-- Expect: [] (the previous public probe row becomes invisible to anonymous readers.)
