-- Production-ready RLS policies for WhisperChain
-- These work with Supabase Auth (auth.uid())

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whispers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_responses ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Whispers policies  
CREATE POLICY "Anyone can view published whispers" ON public.whispers
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can create whispers" ON public.whispers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whispers" ON public.whispers
  FOR UPDATE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage their likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Chain responses policies
CREATE POLICY "Anyone can view chain responses" ON public.chain_responses
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create responses" ON public.chain_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Special policy for anonymous whispers (if you want to support them)
CREATE POLICY "Allow anonymous whispers" ON public.whispers
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE is_anonymous = true
    )
  );