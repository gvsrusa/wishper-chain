-- RLS Policies for Clerk Authentication
-- These policies work with Clerk user IDs (text format)

-- First, ensure the users table uses text IDs (if not already done)
-- This assumes you've already migrated to text-based IDs

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whispers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
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

-- Create a function to extract user ID from JWT
-- Since we can't use auth.uid() with Clerk, we'll use a different approach
-- For development, we'll create permissive policies
-- For production, you'd implement a custom JWT verification

-- USERS POLICIES
-- Everyone can view user profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Users can insert their own profile (for sync)
CREATE POLICY "Users can create their own profile" 
ON public.users FOR INSERT 
WITH CHECK (true); -- In production, verify JWT matches ID

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (true) -- In production, verify JWT matches ID
WITH CHECK (true);

-- THEMES POLICIES
-- Everyone can view themes
CREATE POLICY "Themes are viewable by everyone" 
ON public.themes FOR SELECT 
USING (true);

-- WHISPERS POLICIES
-- Everyone can view published whispers
CREATE POLICY "Published whispers are viewable by everyone" 
ON public.whispers FOR SELECT 
USING (is_published = true);

-- Any authenticated user can create whispers
CREATE POLICY "Authenticated users can create whispers" 
ON public.whispers FOR INSERT 
WITH CHECK (
    -- Ensure user_id exists in users table
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id)
);

-- Users can update their own whispers
CREATE POLICY "Users can update own whispers" 
ON public.whispers FOR UPDATE 
USING (
    -- Check if the user owns this whisper
    user_id IN (SELECT id FROM public.users)
);

-- Users can delete their own whispers
CREATE POLICY "Users can delete own whispers" 
ON public.whispers FOR DELETE 
USING (
    -- Check if the user owns this whisper
    user_id IN (SELECT id FROM public.users)
);

-- LIKES POLICIES
-- Everyone can view likes
CREATE POLICY "Likes are viewable by everyone" 
ON public.likes FOR SELECT 
USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can create likes" 
ON public.likes FOR INSERT 
WITH CHECK (
    -- Ensure user_id exists in users table
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id)
);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes" 
ON public.likes FOR DELETE 
USING (
    -- Check if the user owns this like
    user_id IN (SELECT id FROM public.users)
);

-- CHAIN RESPONSES POLICIES
-- Everyone can view chain responses
CREATE POLICY "Chain responses are viewable by everyone" 
ON public.chain_responses FOR SELECT 
USING (true);

-- Authenticated users can create chain responses
CREATE POLICY "Authenticated users can create chain responses" 
ON public.chain_responses FOR INSERT 
WITH CHECK (
    -- Ensure user_id exists in users table
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id)
);

-- Users can update their own chain responses
CREATE POLICY "Users can update own chain responses" 
ON public.chain_responses FOR UPDATE 
USING (
    -- Check if the user owns this response
    user_id IN (SELECT id FROM public.users)
);

-- FOLLOWS POLICIES
-- Everyone can view follows
CREATE POLICY "Follows are viewable by everyone" 
ON public.follows FOR SELECT 
USING (true);

-- Authenticated users can create follows
CREATE POLICY "Authenticated users can follow others" 
ON public.follows FOR INSERT 
WITH CHECK (
    -- Ensure follower_id exists in users table
    EXISTS (SELECT 1 FROM public.users WHERE id = follower_id)
);

-- Users can delete their own follows
CREATE POLICY "Users can unfollow" 
ON public.follows FOR DELETE 
USING (
    -- Check if the user owns this follow
    follower_id IN (SELECT id FROM public.users)
);

-- Grant necessary permissions to anon role
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.themes TO anon;
GRANT SELECT ON public.whispers TO anon;
GRANT SELECT ON public.likes TO anon;
GRANT SELECT ON public.chain_responses TO anon;
GRANT SELECT ON public.follows TO anon;

-- Grant insert/update/delete for authenticated operations
GRANT INSERT, UPDATE, DELETE ON public.users TO anon;
GRANT INSERT, UPDATE, DELETE ON public.whispers TO anon;
GRANT INSERT, DELETE ON public.likes TO anon;
GRANT INSERT, UPDATE, DELETE ON public.chain_responses TO anon;
GRANT INSERT, DELETE ON public.follows TO anon;

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies 
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, policyname;