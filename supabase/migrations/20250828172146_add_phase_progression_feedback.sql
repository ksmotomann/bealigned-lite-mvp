-- Track when admin indicates phase should have progressed
CREATE TABLE phase_progression_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL,
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  
  -- Context
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  conversation_turn INTEGER NOT NULL,
  
  -- Feedback
  should_have_progressed BOOLEAN NOT NULL DEFAULT true,
  admin_notes TEXT,
  
  -- Learning signals
  user_word_count INTEGER,
  had_emotions BOOLEAN,
  had_values BOOLEAN,
  had_perspective BOOLEAN,
  message_category TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for learning queries
CREATE INDEX idx_phase_progression_feedback_step ON phase_progression_feedback(step_id);
CREATE INDEX idx_phase_progression_feedback_category ON phase_progression_feedback(message_category);

-- Track learned phase progression patterns
CREATE TABLE phase_progression_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id INTEGER NOT NULL,
  
  -- Pattern criteria learned from feedback
  min_conversation_turns INTEGER DEFAULT 1,
  min_word_count INTEGER,
  requires_emotions BOOLEAN DEFAULT false,
  requires_values BOOLEAN DEFAULT false,
  requires_perspective BOOLEAN DEFAULT false,
  
  -- Categories that should trigger progression
  triggering_categories TEXT[],
  
  -- Confidence based on feedback volume
  feedback_count INTEGER DEFAULT 0,
  confidence_score FLOAT DEFAULT 0.5,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initialize with current aggressive defaults
INSERT INTO phase_progression_patterns (step_id, min_conversation_turns, confidence_score) 
VALUES 
  (1, 1, 0.5),
  (2, 1, 0.5),
  (3, 1, 0.5),
  (4, 1, 0.5),
  (5, 1, 0.5),
  (6, 1, 0.5),
  (7, 1, 0.5);

COMMENT ON TABLE phase_progression_feedback IS 'Admin feedback on when phases should have progressed';
COMMENT ON TABLE phase_progression_patterns IS 'Learned patterns for automatic phase progression';