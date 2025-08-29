-- Add confidence column to refined_responses if it doesn't exist
ALTER TABLE refined_responses 
ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 0.7;

-- Update existing rows with default confidence based on approval status
UPDATE refined_responses 
SET confidence = CASE 
  WHEN is_approved = true THEN 0.85
  ELSE 0.7
END
WHERE confidence IS NULL;

-- Add comment
COMMENT ON COLUMN refined_responses.confidence IS 'Confidence score for this refinement (0-1). Admin edits during chat get 0.95+';

-- Now insert the addiction response example with high confidence
INSERT INTO refined_responses (
  step_id,
  user_text,
  original_text,
  refined_text,
  chatgpt_response,
  use_chatgpt_as_primary,
  feedback,
  confidence,
  is_approved,
  created_at
) VALUES (
  1,
  'My co-parent is an addict and its taking a heavy toll on me and my sons.',
  'Thank you for naming that. I can hear that this is really affecting you.',
  '',
  E'Addiction in a co-parenting relationship brings such profound challenges. The constant worry about your sons'' safety and wellbeing, the unpredictability, trying to maintain stability when everything feels chaotic... This is an enormous weight you''re carrying. The impact on you and your boys is significant, and navigating this takes tremendous strength.\n\n**2. WHAT''S BENEATH THAT?**\n**What feelings come up when you think about this?**',
  true,
  'For addiction and other heavy topics, we need deep, genuine compassion - not clinical acknowledgment. Really sit with their pain before moving to the next prompt.',
  0.98,
  true,
  NOW()
);

-- Add another example for serious illness
INSERT INTO refined_responses (
  step_id,
  user_text,
  original_text,
  refined_text,
  chatgpt_response,
  use_chatgpt_as_primary,
  feedback,
  confidence,
  is_approved,
  created_at
) VALUES (
  1,
  'My ex has been diagnosed with cancer and I don''t know how to talk to our kids about it',
  'That sounds really challenging.',
  '',
  E'A cancer diagnosis in your co-parenting relationship, and helping your children navigate this too. The weight of trying to be strong for them while processing your own complex emotions is immense. There''s no roadmap for this kind of uncertainty and fear. Whatever you''re feeling right now - fear, sadness, even complicated feelings about your ex - all of it makes sense.\n\n**2. WHAT''S BENEATH THAT?**\n**What feelings come up when you think about this?**',
  true,
  'Serious illness requires deep empathy and acknowledgment of the complexity',
  0.98,
  true,
  NOW()
);

-- Add example for domestic violence/abuse
INSERT INTO refined_responses (
  step_id,
  user_text,
  original_text,
  refined_text,
  chatgpt_response,
  use_chatgpt_as_primary,
  feedback,
  confidence,
  is_approved,
  created_at
) VALUES (
  1,
  'My ex was abusive and now wants more time with the kids',
  'I hear you. This must be very difficult.',
  '',
  E'This touches on something deeply difficult. When there''s been abuse, every decision about the children feels impossibly heavy - balancing their safety, their relationship with their other parent, legal requirements, and your own trauma. The fear and protectiveness you must feel, coupled with navigating a system that doesn''t always understand... The weight of trying to do right by your children while carrying this history is profound.\n\n**2. WHAT''S BENEATH THAT?**\n**What feelings come up when you think about this?**',
  true,
  'Abuse situations require extreme sensitivity and validation of the protective instinct',
  0.98,
  true,
  NOW()
);