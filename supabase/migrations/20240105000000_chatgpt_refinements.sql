-- Add ChatGPT response field to refined_responses table
ALTER TABLE public.refined_responses 
ADD COLUMN IF NOT EXISTS chatgpt_response TEXT,
ADD COLUMN IF NOT EXISTS use_chatgpt_as_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS applied_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_rate DECIMAL(3,2);

-- Create index for finding best refinements quickly
CREATE INDEX IF NOT EXISTS idx_refined_responses_lookup 
ON public.refined_responses(step_id, is_approved, applied_count DESC);

-- Create function to find best refinement for a user input
CREATE OR REPLACE FUNCTION get_best_refinement(
    p_step_id INTEGER,
    p_user_text TEXT
)
RETURNS TABLE(
    refined_text TEXT,
    chatgpt_response TEXT,
    use_chatgpt BOOLEAN,
    confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.refined_text,
        r.chatgpt_response,
        r.use_chatgpt_as_primary,
        CASE 
            WHEN similarity(r.user_text, p_user_text) > 0.7 THEN 0.9
            WHEN similarity(r.user_text, p_user_text) > 0.5 THEN 0.7
            WHEN similarity(r.user_text, p_user_text) > 0.3 THEN 0.5
            ELSE 0.3
        END as confidence
    FROM public.refined_responses r
    WHERE 
        r.step_id = p_step_id
        AND r.is_approved = true
        AND (r.refined_text IS NOT NULL OR r.chatgpt_response IS NOT NULL)
    ORDER BY 
        similarity(r.user_text, p_user_text) DESC,
        r.applied_count DESC,
        r.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Add similarity extension if not exists (for fuzzy matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Update model_improvements to track ChatGPT patterns
ALTER TABLE public.model_improvements
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual', -- 'manual', 'chatgpt', 'validation'
ADD COLUMN IF NOT EXISTS chatgpt_pattern TEXT;

-- Create view for active refinements
CREATE OR REPLACE VIEW active_refinements AS
SELECT 
    r.id,
    r.step_id,
    r.user_text,
    COALESCE(
        CASE WHEN r.use_chatgpt_as_primary THEN r.chatgpt_response ELSE NULL END,
        r.refined_text,
        r.chatgpt_response
    ) as best_response,
    r.feedback,
    r.applied_count,
    r.success_rate
FROM public.refined_responses r
WHERE r.is_approved = true
ORDER BY r.step_id, r.applied_count DESC;