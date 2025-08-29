-- Add confidence scoring to model improvements and refined responses
ALTER TABLE model_improvements 
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.7;

-- Update existing rows with default confidence
UPDATE model_improvements 
SET confidence_score = 0.7 
WHERE confidence_score IS NULL;

-- Add index for high-confidence queries
CREATE INDEX IF NOT EXISTS idx_model_improvements_confidence 
ON model_improvements(confidence_score DESC, step_id);

-- Update refined_responses confidence default
ALTER TABLE refined_responses 
ALTER COLUMN confidence SET DEFAULT 0.7;

COMMENT ON COLUMN model_improvements.confidence_score IS 'Confidence in this improvement (0-1). Admin edits during chat get 0.95+';
COMMENT ON COLUMN refined_responses.confidence IS 'Confidence in this refinement. Admin edits during chat get 0.95+';