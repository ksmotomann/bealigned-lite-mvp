-- Create enum for response categories
CREATE TYPE response_category AS ENUM (
    'direct_answer',
    'partial_indirect_answer', 
    'conversational_social',
    'meta_app_directed',
    'off_topic_non_sequitur',
    'refusal_avoidance',
    'emotional_expressive'
);

-- Add categorization to responses table
ALTER TABLE public.responses 
ADD COLUMN IF NOT EXISTS user_response_category response_category,
ADD COLUMN IF NOT EXISTS category_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS category_notes TEXT,
ADD COLUMN IF NOT EXISTS categorized_by TEXT,
ADD COLUMN IF NOT EXISTS categorized_at TIMESTAMPTZ;

-- Create table for category patterns
CREATE TABLE IF NOT EXISTS public.response_category_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    step_id INTEGER NOT NULL,
    category response_category NOT NULL,
    pattern_text TEXT NOT NULL,
    pattern_keywords TEXT[],
    example_responses TEXT[],
    frequency INTEGER DEFAULT 1,
    affects_progression BOOLEAN DEFAULT false,
    requires_followup BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for category analytics
CREATE TABLE IF NOT EXISTS public.category_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    step_id INTEGER NOT NULL,
    category_counts JSONB NOT NULL, -- {direct_answer: 5, partial: 2, ...}
    progression_quality TEXT, -- 'smooth', 'needs_probing', 'stuck'
    session_effectiveness DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_responses_category ON public.responses(user_response_category);
CREATE INDEX IF NOT EXISTS idx_responses_category_step ON public.responses(step_id, user_response_category);
CREATE INDEX IF NOT EXISTS idx_category_patterns_step ON public.response_category_patterns(step_id, category);
CREATE INDEX IF NOT EXISTS idx_category_analytics_session ON public.category_analytics(session_id);

-- Function to analyze response category
CREATE OR REPLACE FUNCTION analyze_response_category(
    p_user_text TEXT,
    p_step_id INTEGER
)
RETURNS response_category AS $$
DECLARE
    v_category response_category;
    v_word_count INTEGER;
    v_has_question BOOLEAN;
BEGIN
    v_word_count := array_length(string_to_array(p_user_text, ' '), 1);
    v_has_question := p_user_text LIKE '%?%';
    
    -- Detect meta/app-directed comments
    IF p_user_text ~* '\b(app|system|bot|AI|this tool|this program)\b' THEN
        RETURN 'meta_app_directed';
    END IF;
    
    -- Detect refusal/avoidance
    IF p_user_text ~* '\b(don''t know|not sure|can''t|won''t|rather not|skip)\b' AND v_word_count < 10 THEN
        RETURN 'refusal_avoidance';
    END IF;
    
    -- Detect emotional/expressive
    IF p_user_text ~* '\b(feel|felt|feeling|angry|sad|frustrated|happy|excited|worried|scared|overwhelmed)\b' AND p_step_id = 2 THEN
        RETURN 'direct_answer'; -- Emotions are direct answers in step 2
    ELSIF p_user_text ~* '!{2,}|😀|😢|😡|❤️' OR (p_user_text ~* '\b(ugh|wow|damn|hell)\b') THEN
        RETURN 'emotional_expressive';
    END IF;
    
    -- Detect conversational/social
    IF p_user_text ~* '\b(hello|hi|thanks|thank you|good morning|how are you|bye)\b' AND v_word_count < 10 THEN
        RETURN 'conversational_social';
    END IF;
    
    -- Detect off-topic
    IF p_step_id > 1 AND NOT (
        p_user_text ~* '\b(child|kid|parent|custody|schedule|time|feel|value|they|them)\b'
    ) THEN
        RETURN 'off_topic_non_sequitur';
    END IF;
    
    -- Determine if direct or partial based on length and content
    IF v_word_count >= 15 AND NOT v_has_question THEN
        RETURN 'direct_answer';
    ELSIF v_word_count >= 8 THEN
        RETURN 'partial_indirect_answer';
    ELSE
        RETURN 'partial_indirect_answer';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get category statistics
CREATE OR REPLACE FUNCTION get_category_stats(p_session_id TEXT)
RETURNS TABLE(
    category response_category,
    count BIGINT,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH category_counts AS (
        SELECT 
            user_response_category as category,
            COUNT(*) as count
        FROM public.responses
        WHERE session_id = p_session_id
        AND user_response_category IS NOT NULL
        GROUP BY user_response_category
    ),
    total AS (
        SELECT SUM(count) as total_count
        FROM category_counts
    )
    SELECT 
        cc.category,
        cc.count,
        ROUND((cc.count::DECIMAL / t.total_count) * 100, 2) as percentage
    FROM category_counts cc, total t
    ORDER BY cc.count DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.response_category_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to response_category_patterns" ON public.response_category_patterns
    FOR ALL USING (true);

CREATE POLICY "Allow all access to category_analytics" ON public.category_analytics
    FOR ALL USING (true);