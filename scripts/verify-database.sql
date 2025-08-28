-- Verify BeAligned Database Setup
-- Run this in Supabase SQL Editor to confirm everything is set up correctly

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'sessions', 'steps', 'prompts', 'feelings_bank', 
    'values_bank', 'frameworks', 'knowledge_docs', 
    'embeddings', 'responses', 'options', 'messages', 'audit_logs'
)
ORDER BY table_name;

-- Check row counts
SELECT 'steps' as table_name, COUNT(*) as row_count FROM steps
UNION ALL
SELECT 'prompts', COUNT(*) FROM prompts
UNION ALL
SELECT 'feelings_bank', COUNT(*) FROM feelings_bank
UNION ALL
SELECT 'values_bank', COUNT(*) FROM values_bank
UNION ALL
SELECT 'frameworks', COUNT(*) FROM frameworks
UNION ALL
SELECT 'knowledge_docs', COUNT(*) FROM knowledge_docs;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sessions', 'responses', 'options', 'messages');

-- Expected results:
-- 12 tables should exist
-- steps: 7 rows
-- prompts: 14 rows
-- feelings_bank: 30 rows
-- values_bank: 25 rows
-- frameworks: 3 rows
-- knowledge_docs: 4 rows
-- RLS should be enabled (true) for sessions, responses, options, messages