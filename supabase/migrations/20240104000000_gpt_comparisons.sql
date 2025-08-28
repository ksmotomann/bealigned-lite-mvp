-- Create table for storing GPT reference responses for comparison
CREATE TABLE IF NOT EXISTS public.gpt_reference_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    step_id INTEGER NOT NULL,
    user_text TEXT NOT NULL,
    app_response TEXT NOT NULL,
    gpt_response TEXT NOT NULL,
    comparison_notes TEXT,
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    key_differences JSONB,
    improvements_needed TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT DEFAULT 'admin'
);

-- Create table for model improvement patterns
CREATE TABLE IF NOT EXISTS public.model_improvements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_type TEXT NOT NULL, -- 'tone', 'empathy', 'probing', 'transition', 'completion'
    step_id INTEGER,
    trigger_phrase TEXT,
    current_response TEXT,
    improved_response TEXT,
    improvement_reason TEXT,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Create table for response quality metrics
CREATE TABLE IF NOT EXISTS public.response_quality_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID REFERENCES public.responses(id),
    gpt_comparison_id UUID REFERENCES public.gpt_reference_responses(id),
    metrics JSONB NOT NULL, -- {empathy_score, clarity_score, child_focus_score, etc.}
    overall_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_gpt_reference_session ON public.gpt_reference_responses(session_id);
CREATE INDEX idx_gpt_reference_step ON public.gpt_reference_responses(step_id);
CREATE INDEX idx_gpt_reference_quality ON public.gpt_reference_responses(quality_score);
CREATE INDEX idx_model_improvements_pattern ON public.model_improvements(pattern_type);
CREATE INDEX idx_model_improvements_active ON public.model_improvements(is_active);

-- Enable RLS
ALTER TABLE public.gpt_reference_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to gpt_reference_responses" ON public.gpt_reference_responses
    FOR ALL USING (true);

CREATE POLICY "Allow all access to model_improvements" ON public.model_improvements
    FOR ALL USING (true);

CREATE POLICY "Allow all access to response_quality_metrics" ON public.response_quality_metrics
    FOR ALL USING (true);

-- Function to analyze response differences
CREATE OR REPLACE FUNCTION analyze_response_difference(app_text TEXT, gpt_text TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    result = jsonb_build_object(
        'app_length', length(app_text),
        'gpt_length', length(gpt_text),
        'app_sentences', array_length(string_to_array(app_text, '.'), 1),
        'gpt_sentences', array_length(string_to_array(gpt_text, '.'), 1),
        'has_question', CASE WHEN app_text LIKE '%?%' THEN true ELSE false END,
        'gpt_has_question', CASE WHEN gpt_text LIKE '%?%' THEN true ELSE false END,
        'empathy_words', (
            SELECT COUNT(*)
            FROM unnest(ARRAY['understand', 'hear', 'appreciate', 'courage', 'challenging', 'difficult']) AS word
            WHERE lower(app_text) LIKE '%' || word || '%'
        ),
        'gpt_empathy_words', (
            SELECT COUNT(*)
            FROM unnest(ARRAY['understand', 'hear', 'appreciate', 'courage', 'challenging', 'difficult']) AS word
            WHERE lower(gpt_text) LIKE '%' || word || '%'
        )
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;