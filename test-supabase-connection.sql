-- Simple test to verify Supabase connection and data
-- Run this in Supabase SQL Editor

-- 1. Test basic connection
SELECT 'Connection test: If you see this, connection works!' as test_result;

-- 2. Check if whispers table has any data
SELECT COUNT(*) as total_whispers, 
       COUNT(CASE WHEN is_published = true THEN 1 END) as published_whispers
FROM public.whispers;

-- 3. Get a sample whisper to check data structure
SELECT * FROM public.whispers 
WHERE is_published = true 
LIMIT 1;

-- 4. Check if anon role can read data
SET ROLE anon;
SELECT 'Testing as anon role' as role_test;
SELECT COUNT(*) as visible_whispers FROM public.whispers WHERE is_published = true;
RESET ROLE;

-- 5. Simple insert test (will create a test whisper)
-- Uncomment to test insert:
-- INSERT INTO public.whispers (
--   user_id,
--   original_text,
--   transformed_text,
--   theme_id,
--   is_published,
--   likes_count,
--   chain_count
-- ) VALUES (
--   (SELECT id FROM public.users LIMIT 1), -- Use first user
--   'Test whisper original text',
--   'Test whisper transformed text',
--   (SELECT id FROM public.themes WHERE name = 'abstract' LIMIT 1),
--   true,
--   0,
--   0
-- ) RETURNING *;