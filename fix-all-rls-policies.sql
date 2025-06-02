-- COMPREHENSIVE FIX FOR ALL RLS POLICIES
-- This script makes the database more permissive for development
-- Run this in Supabase SQL Editor to fix all data access issues

-- Step 1: Disable RLS temporarily to ensure we can make changes
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whispers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whispers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Step 4: Create VERY PERMISSIVE policies for development

-- USERS - Everyone can do everything (development only!)
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (true);

-- WHISPERS - Everyone can do everything
CREATE POLICY "whispers_select" ON public.whispers FOR SELECT USING (true);
CREATE POLICY "whispers_insert" ON public.whispers FOR INSERT WITH CHECK (true);
CREATE POLICY "whispers_update" ON public.whispers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "whispers_delete" ON public.whispers FOR DELETE USING (true);

-- LIKES - Everyone can do everything
CREATE POLICY "likes_select" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON public.likes FOR INSERT WITH CHECK (true);
CREATE POLICY "likes_update" ON public.likes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "likes_delete" ON public.likes FOR DELETE USING (true);

-- CHAIN_RESPONSES - Everyone can do everything
CREATE POLICY "chain_responses_select" ON public.chain_responses FOR SELECT USING (true);
CREATE POLICY "chain_responses_insert" ON public.chain_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "chain_responses_update" ON public.chain_responses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "chain_responses_delete" ON public.chain_responses FOR DELETE USING (true);

-- THEMES - Everyone can view
CREATE POLICY "themes_select" ON public.themes FOR SELECT USING (true);

-- FOLLOWS - Everyone can do everything
CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (true);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (true);

-- Step 5: Grant all permissions to anon role
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.whispers TO anon;
GRANT ALL ON public.likes TO anon;
GRANT ALL ON public.chain_responses TO anon;
GRANT ALL ON public.themes TO anon;
GRANT ALL ON public.follows TO anon;

-- Step 6: Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 7: Verify the changes
SELECT 'RLS Status After Fix:' as status;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'whispers', 'likes', 'chain_responses', 'themes', 'follows');

SELECT 'Policy Count by Table:' as status;
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Step 8: Test query
SELECT 'Test Query - Whispers:' as status;
SELECT COUNT(*) as total_whispers, 
       COUNT(CASE WHEN is_published = true THEN 1 END) as published_whispers
FROM public.whispers;

-- WARNING: These policies are VERY permissive and should only be used for development!
-- For production, implement proper authentication-based policies