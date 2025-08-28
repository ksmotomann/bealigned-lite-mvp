-- BeAligned Lite MVP Complete Setup
-- Run this entire script in your Supabase SQL Editor

-- PART 1: CREATE SCHEMA (from setup-database.sql)
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create all tables
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    client_meta JSONB
);

CREATE TABLE IF NOT EXISTS public.steps (
    id INT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    "order" INT NOT NULL,
    schema JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    step_id INT REFERENCES public.steps(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('ai_prompt', 'user_prompt'))
);

CREATE TABLE IF NOT EXISTS public.feelings_bank (
    term TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('surface', 'vulnerable', 'nuanced', 'strength_hopeful'))
);

CREATE TABLE IF NOT EXISTS public.values_bank (
    term TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('security', 'connection', 'growth', 'respect', 'harmony'))
);

CREATE TABLE IF NOT EXISTS public.frameworks (
    name TEXT PRIMARY KEY,
    content JSONB NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.embeddings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doc_id UUID REFERENCES public.knowledge_docs(id) ON DELETE CASCADE,
    chunk TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    step_id INT REFERENCES public.steps(id),
    user_text TEXT,
    ai_text TEXT,
    knowledge_audit JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    why_tags TEXT[],
    rank INT
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    draft TEXT,
    final TEXT,
    framework TEXT CHECK (framework IN ('CLEAR', 'BALANCE', 'KIDS_NEWS')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id UUID,
    event TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_responses_session ON public.responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_step ON public.responses(step_id);
CREATE INDEX IF NOT EXISTS idx_options_session ON public.options(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON public.audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_embeddings_doc ON public.embeddings(doc_id);

-- Vector index for 1536 dimensions (text-embedding-ada-002)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON public.embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Text search index
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_content ON public.knowledge_docs 
USING gin (to_tsvector('english', content));

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Sessions are viewable by session owner" ON public.sessions;
DROP POLICY IF EXISTS "Sessions are updatable by session owner" ON public.sessions;
DROP POLICY IF EXISTS "Sessions are deletable by session owner" ON public.sessions;
DROP POLICY IF EXISTS "Responses are viewable by session owner" ON public.responses;
DROP POLICY IF EXISTS "Responses are insertable by session owner" ON public.responses;
DROP POLICY IF EXISTS "Options are viewable by session owner" ON public.options;
DROP POLICY IF EXISTS "Options are manageable by session owner" ON public.options;
DROP POLICY IF EXISTS "Messages are viewable by session owner" ON public.messages;
DROP POLICY IF EXISTS "Messages are manageable by session owner" ON public.messages;

-- Create RLS policies
CREATE POLICY "Sessions are viewable by session owner" 
ON public.sessions FOR SELECT 
USING (id::text = current_setting('app.session_id', true));

CREATE POLICY "Sessions are updatable by session owner" 
ON public.sessions FOR UPDATE 
USING (id::text = current_setting('app.session_id', true));

CREATE POLICY "Sessions are deletable by session owner" 
ON public.sessions FOR DELETE 
USING (id::text = current_setting('app.session_id', true));

CREATE POLICY "Responses are viewable by session owner" 
ON public.responses FOR SELECT 
USING (session_id::text = current_setting('app.session_id', true));

CREATE POLICY "Responses are insertable by session owner" 
ON public.responses FOR INSERT 
WITH CHECK (session_id::text = current_setting('app.session_id', true));

CREATE POLICY "Options are viewable by session owner" 
ON public.options FOR SELECT 
USING (session_id::text = current_setting('app.session_id', true));

CREATE POLICY "Options are manageable by session owner" 
ON public.options FOR ALL 
USING (session_id::text = current_setting('app.session_id', true));

CREATE POLICY "Messages are viewable by session owner" 
ON public.messages FOR SELECT 
USING (session_id::text = current_setting('app.session_id', true));

CREATE POLICY "Messages are manageable by session owner" 
ON public.messages FOR ALL 
USING (session_id::text = current_setting('app.session_id', true));

-- PART 2: SEED DATA
-- =================

-- Clear existing seed data (optional, comment out if you want to preserve data)
TRUNCATE public.steps CASCADE;
TRUNCATE public.feelings_bank CASCADE;
TRUNCATE public.values_bank CASCADE;
TRUNCATE public.frameworks CASCADE;
TRUNCATE public.knowledge_docs CASCADE;

-- Seed the seven steps
INSERT INTO public.steps (id, slug, title, description, "order", schema) VALUES
(1, 'lets-name-it', 'Let''s Name It', 'Name the issue briefly and neutrally', 1, '{"prompt": "What''s the situation that''s been sticking with you lately?", "ai_role": "mirror_concise_intent"}'),
(2, 'whats-beneath', 'What''s Beneath That?', 'Explore surface and vulnerable feelings', 2, '{"prompt": "What feelings come up when you think about this? What might be underneath?", "ai_role": "reflect_feelings"}'),
(3, 'your-why', 'Your Why', 'Identify deeper values and purpose', 3, '{"prompt": "What is it about this that feels important to you? What are you hoping for?", "ai_role": "identify_values"}'),
(4, 'coparent-shoes', 'Step Into Your Co-Parent''s Shoes', 'Practice perspective-taking', 4, '{"prompt": "If your co-parent described this, how might they see it? What might they need?", "ai_role": "perspective_take"}'),
(5, 'child-eyes', 'See Through Your Child''s Eyes', 'Consider child''s needs and perspective', 5, '{"prompt": "What might your child be noticing? What do they need right now?", "ai_role": "child_centered"}'),
(6, 'aligned-options', 'Explore Aligned Options', 'Generate options tagged by values served', 6, '{"prompt": "Let''s list aligned options tied to Whys and your child''s needs.", "ai_role": "option_generator"}'),
(7, 'choose-communicate', 'Choose + Communicate', 'Draft CLEAR message', 7, '{"prompt": "Draft a CLEAR message (Concise, Listener-Ready, Essential, Appropriate, Relevant).", "ai_role": "message_drafter"}')
ON CONFLICT (id) DO NOTHING;

-- Seed prompts
INSERT INTO public.prompts (step_id, text, kind) VALUES
(1, 'What''s the situation that''s been sticking with you lately?', 'user_prompt'),
(1, 'I hear that this is about [mirror]. Let me help you explore this.', 'ai_prompt'),
(2, 'What feelings come up when you think about this? What might be underneath?', 'user_prompt'),
(2, 'It sounds like you''re experiencing [feelings]. That makes sense given [context].', 'ai_prompt'),
(3, 'What is it about this that feels important to you? What are you hoping for?', 'user_prompt'),
(3, 'Your values around [values] really come through. This connects to your hope for [outcome].', 'ai_prompt'),
(4, 'If your co-parent described this, how might they see it? What might they need?', 'user_prompt'),
(4, 'From their perspective, they might be focused on [their_values] and need [their_needs].', 'ai_prompt'),
(5, 'What might your child be noticing? What do they need right now?', 'user_prompt'),
(5, 'Your child likely needs [stability/connection/understanding] during this time.', 'ai_prompt'),
(6, 'Let''s list aligned options tied to Whys and your child''s needs.', 'user_prompt'),
(6, 'Here are options that could serve multiple Whys: [options with tags]', 'ai_prompt'),
(7, 'Draft a CLEAR message using this formula: I feel [emotion] when [situation] because [shared Why/child outcome].', 'user_prompt'),
(7, 'Here''s a CLEAR draft: [message following formula]', 'ai_prompt')
ON CONFLICT DO NOTHING;

-- Seed feelings bank
INSERT INTO public.feelings_bank (term, category) VALUES
('angry', 'surface'),
('frustrated', 'surface'),
('annoyed', 'surface'),
('irritated', 'surface'),
('stressed', 'surface'),
('overwhelmed', 'surface'),
('confused', 'surface'),
('worried', 'surface'),
('hurt', 'vulnerable'),
('scared', 'vulnerable'),
('sad', 'vulnerable'),
('lonely', 'vulnerable'),
('disappointed', 'vulnerable'),
('rejected', 'vulnerable'),
('abandoned', 'vulnerable'),
('helpless', 'vulnerable'),
('conflicted', 'nuanced'),
('ambivalent', 'nuanced'),
('uncertain', 'nuanced'),
('torn', 'nuanced'),
('hesitant', 'nuanced'),
('cautious', 'nuanced'),
('determined', 'strength_hopeful'),
('hopeful', 'strength_hopeful'),
('confident', 'strength_hopeful'),
('capable', 'strength_hopeful'),
('resilient', 'strength_hopeful'),
('optimistic', 'strength_hopeful'),
('empowered', 'strength_hopeful'),
('grateful', 'strength_hopeful')
ON CONFLICT (term) DO NOTHING;

-- Seed values bank
INSERT INTO public.values_bank (term, category) VALUES
('stability', 'security'),
('safety', 'security'),
('predictability', 'security'),
('consistency', 'security'),
('structure', 'security'),
('belonging', 'connection'),
('love', 'connection'),
('closeness', 'connection'),
('understanding', 'connection'),
('empathy', 'connection'),
('learning', 'growth'),
('development', 'growth'),
('progress', 'growth'),
('improvement', 'growth'),
('achievement', 'growth'),
('dignity', 'respect'),
('autonomy', 'respect'),
('boundaries', 'respect'),
('consideration', 'respect'),
('acknowledgment', 'respect'),
('peace', 'harmony'),
('balance', 'harmony'),
('cooperation', 'harmony'),
('unity', 'harmony'),
('collaboration', 'harmony')
ON CONFLICT (term) DO NOTHING;

-- Seed frameworks
INSERT INTO public.frameworks (name, content) VALUES
('CLEAR', '{
  "acronym": "CLEAR",
  "components": {
    "C": "Concise - Keep it brief and to the point",
    "L": "Listener-Ready - Consider their state and timing",
    "E": "Essential - Focus on what truly matters",
    "A": "Appropriate - Match tone to context",
    "R": "Relevant - Connect to shared goals"
  },
  "examples": [
    "I feel concerned when schedules change last minute because our son needs predictability. Could we commit to 24-hour notice?",
    "I feel overwhelmed managing sick days alone because I need support too. Can we create a backup plan together?"
  ]
}'),
('BALANCE', '{
  "acronym": "BALANCE",
  "components": {
    "B": "Balance - Consider all perspectives",
    "A": "Aligned - Connect to shared values",
    "L": "Linked to the Why - Ground in purpose",
    "A": "Attainable - Set realistic expectations",
    "N": "Necessary - Focus on what''s needed",
    "C": "Constructive - Build rather than tear down",
    "E": "Evolving - Allow for growth and change"
  },
  "usage": "For setting boundaries that serve everyone"
}'),
('KIDS_NEWS', '{
  "acronym": "KIDS NEWS",
  "purpose": "Neutral updates about children",
  "components": {
    "School": "Academic updates, events, concerns",
    "Health": "Medical appointments, concerns, milestones",
    "Schedule Changes": "Adjustments to routine",
    "Upcoming Events": "Important dates to coordinate",
    "Highlights": "Positive moments to share"
  },
  "tone": "Factual, brief, child-focused"
}')
ON CONFLICT (name) DO NOTHING;

-- Seed knowledge docs
INSERT INTO public.knowledge_docs (title, source, version, kind, content) VALUES
('BeAligned Guardrails', 'curriculum', '1.0', 'guidebook', 
'Core Guardrails:
1. Never provide legal or clinical advice
2. Always maintain child-centered focus
3. Honor both parents perspectives
4. Encourage de-escalation over winning
5. Support communication, not litigation
6. Recognize when professional help is needed'),
('Seven Step Schema', 'curriculum', '1.0', 'schema',
'The seven-step process moves from reaction to reflection:
1. Name It - Neutral problem identification
2. Beneath - Feelings exploration (surface to vulnerable)
3. Your Why - Values identification
4. Their Shoes - Perspective-taking
5. Child Eyes - Child-centered lens
6. Options - Multiple pathways forward
7. Communicate - CLEAR message drafting'),
('Message Formula', 'curriculum', '1.0', 'example',
'Formula: I feel [emotion] when [situation] because [shared Why/child outcome]. [Optional invitation]

Examples:
- I feel worried when pickup times vary because Maya needs consistency to feel secure. Could we stick to the agreed schedule?
- I feel frustrated when I don''t hear back about medical decisions because I want to be involved in Jamie''s care. Can we set a 48-hour response standard?'),
('Handoff Language', 'curriculum', '1.0', 'guidebook',
'When users need professional support beyond our scope:

"I notice you''re dealing with some complex legal/safety/clinical concerns. While I can help with communication, this situation might benefit from professional guidance. Would you like to focus on how to communicate your needs clearly while you seek appropriate support?"

Never diagnose, prescribe, or provide legal interpretation.')
ON CONFLICT DO NOTHING;

-- Create helper functions
CREATE OR REPLACE FUNCTION search_embeddings(
    query_embedding vector(1536),
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

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.sessions 
    WHERE expires_at < NOW();
END;
$$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'BeAligned Lite MVP database setup and seeding complete!';
END $$;