-- Development-friendly RLS policies
-- These are permissive for testing but should be tightened for production

-- First, ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whispers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow all for development" ON public.users;
DROP POLICY IF EXISTS "Allow all for development" ON public.themes;
DROP POLICY IF EXISTS "Allow all for development" ON public.whispers;
DROP POLICY IF EXISTS "Allow all for development" ON public.likes;
DROP POLICY IF EXISTS "Allow all for development" ON public.chain_responses;

-- Create permissive policies for development
-- These allow anonymous users to do everything

-- Users: Allow all operations
CREATE POLICY "Allow all for development" ON public.users
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Themes: Allow read for everyone
CREATE POLICY "Allow all for development" ON public.themes
  FOR SELECT
  USING (true);

-- Whispers: Allow all operations
CREATE POLICY "Allow all for development" ON public.whispers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Likes: Allow all operations
CREATE POLICY "Allow all for development" ON public.likes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chain responses: Allow all operations  
CREATE POLICY "Allow all for development" ON public.chain_responses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM 
    pg_policies 
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, policyname;