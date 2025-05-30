-- TEMPORARY: Disable RLS for testing
-- WARNING: Only use this for development/testing. Re-enable RLS for production!

-- Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whispers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_whispers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables 
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename;