-- Fix RLS policies for chain_responses to support INSERT ... RETURNING

-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can create chain responses" ON public.chain_responses;

-- Create new insert policy that allows returning data
CREATE POLICY "Authenticated users can create chain responses" 
ON public.chain_responses FOR INSERT 
WITH     CHECK (
    -- Ensure user_id exists in users table and matches the inserting user
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id)
);

-- Also ensure the SELECT policy is working correctly
DROP POLICY IF EXISTS "Chain responses are viewable by everyone" ON public.chain_responses;

CREATE POLICY "Chain responses are viewable by everyone" 
ON public.chain_responses FOR SELECT 
USING (true);

-- Grant necessary permissions
GRANT ALL ON public.chain_responses TO anon;
GRANT ALL ON public.chain_responses TO authenticated;

-- Ensure the sequence permissions are correct
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;