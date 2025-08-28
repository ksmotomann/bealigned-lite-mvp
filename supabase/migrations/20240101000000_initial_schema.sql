-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    client_meta JSONB
);

-- Create steps table
CREATE TABLE IF NOT EXISTS public.steps (
    id INT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    "order" INT NOT NULL,
    schema JSONB NOT NULL
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    step_id INT REFERENCES public.steps(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('ai_prompt', 'user_prompt'))
);

-- Create feelings_bank table
CREATE TABLE IF NOT EXISTS public.feelings_bank (
    term TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('surface', 'vulnerable', 'nuanced', 'strength_hopeful'))
);

-- Create values_bank table
CREATE TABLE IF NOT EXISTS public.values_bank (
    term TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('security', 'connection', 'growth', 'respect', 'harmony'))
);

-- Create frameworks table
CREATE TABLE IF NOT EXISTS public.frameworks (
    name TEXT PRIMARY KEY,
    content JSONB NOT NULL
);

-- Create knowledge_docs table
CREATE TABLE IF NOT EXISTS public.knowledge_docs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    source TEXT,
    version TEXT,
    kind TEXT CHECK (kind IN ('guidebook', 'schema', 'example', 'image')),
    checksum TEXT,
    content TEXT NOT NULL,
    metadata JSONB
);

-- Create embeddings table with vector support
CREATE TABLE IF NOT EXISTS public.embeddings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doc_id UUID REFERENCES public.knowledge_docs(id) ON DELETE CASCADE,
    chunk TEXT NOT NULL,
    embedding vector(3072) NOT NULL,
    metadata JSONB
);

-- Create responses table
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    step_id INT REFERENCES public.steps(id),
    user_text TEXT,
    ai_text TEXT,
    knowledge_audit JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create options table
CREATE TABLE IF NOT EXISTS public.options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    why_tags TEXT[],
    rank INT
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    draft TEXT,
    final TEXT,
    framework TEXT CHECK (framework IN ('CLEAR', 'BALANCE', 'KIDS_NEWS')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id UUID,
    event TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_sessions_expires ON public.sessions(expires_at);
CREATE INDEX idx_responses_session ON public.responses(session_id);
CREATE INDEX idx_responses_step ON public.responses(step_id);
CREATE INDEX idx_options_session ON public.options(session_id);
CREATE INDEX idx_messages_session ON public.messages(session_id);
CREATE INDEX idx_audit_logs_session ON public.audit_logs(session_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX idx_embeddings_doc ON public.embeddings(doc_id);

-- Create vector index for similarity search
CREATE INDEX idx_embeddings_vector ON public.embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create text search index on knowledge docs
CREATE INDEX idx_knowledge_docs_content ON public.knowledge_docs 
USING gin (to_tsvector('english', content));

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sessions
CREATE POLICY "Sessions are viewable by session owner" 
ON public.sessions FOR SELECT 
USING (
    id::text = current_setting('app.session_id', true)
);

CREATE POLICY "Sessions are updatable by session owner" 
ON public.sessions FOR UPDATE 
USING (
    id::text = current_setting('app.session_id', true)
);

CREATE POLICY "Sessions are deletable by session owner" 
ON public.sessions FOR DELETE 
USING (
    id::text = current_setting('app.session_id', true)
);

-- Create RLS policies for responses
CREATE POLICY "Responses are viewable by session owner" 
ON public.responses FOR SELECT 
USING (
    session_id::text = current_setting('app.session_id', true)
);

CREATE POLICY "Responses are insertable by session owner" 
ON public.responses FOR INSERT 
WITH CHECK (
    session_id::text = current_setting('app.session_id', true)
);

-- Create RLS policies for options
CREATE POLICY "Options are viewable by session owner" 
ON public.options FOR SELECT 
USING (
    session_id::text = current_setting('app.session_id', true)
);

CREATE POLICY "Options are manageable by session owner" 
ON public.options FOR ALL 
USING (
    session_id::text = current_setting('app.session_id', true)
);

-- Create RLS policies for messages
CREATE POLICY "Messages are viewable by session owner" 
ON public.messages FOR SELECT 
USING (
    session_id::text = current_setting('app.session_id', true)
);

CREATE POLICY "Messages are manageable by session owner" 
ON public.messages FOR ALL 
USING (
    session_id::text = current_setting('app.session_id', true)
);

-- Create storage buckets (this is handled via Supabase API, but documenting structure)
-- Storage buckets: knowledge (private), media (public), exports (private)

-- Function to search embeddings
CREATE OR REPLACE FUNCTION search_embeddings(
    query_embedding vector(3072),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    doc_id UUID,
    chunk TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.doc_id,
        e.chunk,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM embeddings e
    WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;