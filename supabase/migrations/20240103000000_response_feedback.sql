-- Create table for storing response feedback
CREATE TABLE IF NOT EXISTS public.response_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID REFERENCES public.responses(id),
    session_id TEXT NOT NULL,
    step_id INTEGER NOT NULL,
    is_helpful BOOLEAN NOT NULL,
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for quick lookups
CREATE INDEX idx_response_feedback_response ON public.response_feedback(response_id);
CREATE INDEX idx_response_feedback_session ON public.response_feedback(session_id);
CREATE INDEX idx_response_feedback_helpful ON public.response_feedback(is_helpful);

-- Add columns to responses table for quick aggregation
ALTER TABLE public.responses 
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unhelpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS feedback_score DECIMAL(3,2) DEFAULT NULL;

-- Enable RLS
ALTER TABLE public.response_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to response_feedback" ON public.response_feedback
    FOR ALL USING (true);

-- Function to update feedback counts
CREATE OR REPLACE FUNCTION update_response_feedback_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.responses
        SET 
            helpful_count = helpful_count + CASE WHEN NEW.is_helpful THEN 1 ELSE 0 END,
            unhelpful_count = unhelpful_count + CASE WHEN NOT NEW.is_helpful THEN 1 ELSE 0 END,
            feedback_score = CASE 
                WHEN (helpful_count + unhelpful_count) > 0 
                THEN CAST(helpful_count AS DECIMAL) / (helpful_count + unhelpful_count)
                ELSE NULL
            END
        WHERE id = NEW.response_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic count updates
CREATE TRIGGER update_feedback_counts
    AFTER INSERT ON public.response_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_response_feedback_counts();