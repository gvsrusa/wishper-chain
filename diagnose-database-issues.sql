-- Comprehensive database diagnostic script
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if tables exist and have data
SELECT 'Tables and row counts:' as check_type;
SELECT 'users' as table_name, COUNT(*) as row_count FROM public.users
UNION ALL
SELECT 'whispers', COUNT(*) FROM public.whispers
UNION ALL
SELECT 'likes', COUNT(*) FROM public.likes
UNION ALL
SELECT 'chain_responses', COUNT(*) FROM public.chain_responses
UNION ALL
SELECT 'themes', COUNT(*) FROM public.themes;

-- 2. Check published whispers
SELECT 'Published whispers:' as check_type;
SELECT COUNT(*) as published_count FROM public.whispers WHERE is_published = true;

-- 3. Check sample whispers data
SELECT 'Sample whispers (first 5):' as check_type;
SELECT 
  w.id,
  w.original_text,
  w.transformed_text,
  w.is_published,
  w.likes_count,
  w.chain_count,
  w.theme_id,
  w.user_id,
  w.created_at
FROM public.whispers w
WHERE w.is_published = true
ORDER BY w.created_at DESC
LIMIT 5;

-- 4. Check RLS status
SELECT 'RLS Status:' as check_type;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'whispers', 'likes', 'chain_responses', 'themes');

-- 5. Check current RLS policies
SELECT 'Current RLS Policies:' as check_type;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Test simple SELECT as anon role
SELECT 'Test SELECT as anon role:' as check_type;
SET ROLE anon;
SELECT COUNT(*) as visible_whispers FROM public.whispers WHERE is_published = true;
RESET ROLE;

-- 7. Check if whispers have proper foreign key relationships
SELECT 'Whispers with invalid foreign keys:' as check_type;
SELECT 
  w.id,
  w.user_id,
  w.theme_id,
  CASE WHEN u.id IS NULL THEN 'Missing user' ELSE 'User exists' END as user_status,
  CASE WHEN t.id IS NULL THEN 'Missing theme' ELSE 'Theme exists' END as theme_status
FROM public.whispers w
LEFT JOIN public.users u ON w.user_id = u.id
LEFT JOIN public.themes t ON w.theme_id = t.id
WHERE w.is_published = true
  AND (u.id IS NULL OR t.id IS NULL)
LIMIT 10;

-- 8. Check permissions on tables
SELECT 'Table permissions for anon role:' as check_type;
SELECT 
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND table_name IN ('users', 'whispers', 'likes', 'chain_responses', 'themes')
ORDER BY table_name, privilege_type;