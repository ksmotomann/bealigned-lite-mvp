-- Create table for storing refined responses
CREATE TABLE IF NOT EXISTS public.refined_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID REFERENCES public.responses(id),
    step_id INTEGER NOT NULL,
    user_text TEXT NOT NULL,
    original_text TEXT NOT NULL,
    refined_text TEXT NOT NULL,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT DEFAULT 'admin',
    is_approved BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0
);

-- Create table for validation results
CREATE TABLE IF NOT EXISTS public.validation_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_run_id TEXT NOT NULL,
    results JSONB NOT NULL,
    summary JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for admin settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value) 
VALUES 
    ('admin_mode', '{"enabled": false, "show_refinement": false}'),
    ('refinement_mode', '{"live_mode": false, "auto_apply": false}')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes
CREATE INDEX idx_refined_responses_step_id ON public.refined_responses(step_id);
CREATE INDEX idx_refined_responses_approved ON public.refined_responses(is_approved);
CREATE INDEX idx_validation_results_test_run ON public.validation_results(test_run_id);

-- Add column to responses table for tracking if a response was refined
ALTER TABLE public.responses 
ADD COLUMN IF NOT EXISTS was_refined BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refined_response_id UUID REFERENCES public.refined_responses(id);

-- Create RLS policies
ALTER TABLE public.refined_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin policies (for now, allow all access - in production, restrict to admin users)
CREATE POLICY "Allow all access to refined_responses" ON public.refined_responses
    FOR ALL USING (true);

CREATE POLICY "Allow all access to validation_results" ON public.validation_results
    FOR ALL USING (true);

CREATE POLICY "Allow read access to admin_settings" ON public.admin_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow update access to admin_settings" ON public.admin_settings
    FOR UPDATE USING (true);