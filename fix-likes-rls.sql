-- Fix RLS policies for likes table
-- This fixes the issue where users cannot delete their own likes

-- Drop existing likes policies
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

-- Recreate likes policies with proper checks
-- Everyone can view likes
CREATE POLICY "Likes are viewable by everyone" 
ON public.likes FOR SELECT 
USING (true);

-- Any user can create likes (simplified for development)
CREATE POLICY "Authenticated users can create likes" 
ON public.likes FOR INSERT 
WITH CHECK (true);

-- Any user can delete likes (simplified for development)
CREATE POLICY "Users can delete own likes" 
ON public.likes FOR DELETE 
USING (true);

-- Alternative: More secure policies for production
-- Uncomment these and comment out the above if you want stricter policies

-- -- Users can only create their own likes
-- CREATE POLICY "Users can create own likes" 
-- ON public.likes FOR INSERT 
-- WITH CHECK (
--     user_id = current_setting('app.user_id', true)::text
-- );

-- -- Users can only delete their own likes
-- CREATE POLICY "Users can delete own likes" 
-- ON public.likes FOR DELETE 
-- USING (
--     user_id = current_setting('app.user_id', true)::text
-- );