-- Create session feedback table for user feedback on completed sessions
CREATE TABLE IF NOT EXISTS session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for querying by session
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON session_feedback(session_id);

-- Add index for created_at for reporting
CREATE INDEX IF NOT EXISTS idx_session_feedback_created_at ON session_feedback(created_at);