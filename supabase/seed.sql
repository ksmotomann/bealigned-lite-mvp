-- Seed the seven steps
INSERT INTO public.steps (id, slug, title, description, "order", schema) VALUES
(1, 'lets-name-it', 'Let''s Name It', 'Name the issue briefly and neutrally', 1, '{"prompt": "What''s the situation that''s been sticking with you lately?", "ai_role": "mirror_concise_intent"}'),
(2, 'whats-beneath', 'What''s Beneath That?', 'Explore surface and vulnerable feelings', 2, '{"prompt": "What feelings come up when you think about this? What might be underneath?", "ai_role": "reflect_feelings"}'),
(3, 'your-why', 'Your Why', 'Identify deeper values and purpose', 3, '{"prompt": "What is it about this that feels important to you? What are you hoping for?", "ai_role": "identify_values"}'),
(4, 'coparent-shoes', 'Step Into Your Co-Parent''s Shoes', 'Practice perspective-taking', 4, '{"prompt": "If your co-parent described this, how might they see it? What might they need?", "ai_role": "perspective_take"}'),
(5, 'child-eyes', 'See Through Your Child''s Eyes', 'Consider child''s needs and perspective', 5, '{"prompt": "What might your child be noticing? What do they need right now?", "ai_role": "child_centered"}'),
(6, 'aligned-options', 'Explore Aligned Options', 'Generate options tagged by values served', 6, '{"prompt": "Let''s list aligned options tied to Whys and your child''s needs.", "ai_role": "option_generator"}'),
(7, 'choose-communicate', 'Choose + Communicate', 'Draft CLEAR message', 7, '{"prompt": "Draft a CLEAR message (Concise, Listener-Ready, Essential, Appropriate, Relevant).", "ai_role": "message_drafter"}');

-- Seed prompts for each step
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
(7, 'Here''s a CLEAR draft: [message following formula]', 'ai_prompt');

-- Seed feelings bank
INSERT INTO public.feelings_bank (term, category) VALUES
-- Surface feelings
('angry', 'surface'),
('frustrated', 'surface'),
('annoyed', 'surface'),
('irritated', 'surface'),
('stressed', 'surface'),
('overwhelmed', 'surface'),
('confused', 'surface'),
('worried', 'surface'),
-- Vulnerable feelings
('hurt', 'vulnerable'),
('scared', 'vulnerable'),
('sad', 'vulnerable'),
('lonely', 'vulnerable'),
('disappointed', 'vulnerable'),
('rejected', 'vulnerable'),
('abandoned', 'vulnerable'),
('helpless', 'vulnerable'),
-- Nuanced feelings
('conflicted', 'nuanced'),
('ambivalent', 'nuanced'),
('uncertain', 'nuanced'),
('torn', 'nuanced'),
('hesitant', 'nuanced'),
('cautious', 'nuanced'),
-- Strength/Hopeful feelings
('determined', 'strength_hopeful'),
('hopeful', 'strength_hopeful'),
('confident', 'strength_hopeful'),
('capable', 'strength_hopeful'),
('resilient', 'strength_hopeful'),
('optimistic', 'strength_hopeful'),
('empowered', 'strength_hopeful'),
('grateful', 'strength_hopeful');

-- Seed values bank
INSERT INTO public.values_bank (term, category) VALUES
-- Security
('stability', 'security'),
('safety', 'security'),
('predictability', 'security'),
('consistency', 'security'),
('structure', 'security'),
-- Connection
('belonging', 'connection'),
('love', 'connection'),
('closeness', 'connection'),
('understanding', 'connection'),
('empathy', 'connection'),
-- Growth
('learning', 'growth'),
('development', 'growth'),
('progress', 'growth'),
('improvement', 'growth'),
('achievement', 'growth'),
-- Respect
('dignity', 'respect'),
('autonomy', 'respect'),
('boundaries', 'respect'),
('consideration', 'respect'),
('acknowledgment', 'respect'),
-- Harmony
('peace', 'harmony'),
('balance', 'harmony'),
('cooperation', 'harmony'),
('unity', 'harmony'),
('collaboration', 'harmony');

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
}');

-- Seed initial knowledge docs
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

Never diagnose, prescribe, or provide legal interpretation.');

-- Create a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.sessions 
    WHERE expires_at < NOW();
END;
$$;