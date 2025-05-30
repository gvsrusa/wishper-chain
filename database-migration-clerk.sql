-- WhisperChain Database Migration from Supabase Auth to Clerk
-- Run this AFTER backing up your database

-- =============================================
-- STEP 1: Rename existing users table (backup)
-- =============================================
ALTER TABLE public.users RENAME TO users_backup;

-- =============================================
-- STEP 2: Create new users table for Clerk
-- =============================================
CREATE TABLE public.users (
  id TEXT PRIMARY KEY, -- Clerk uses string IDs, not UUIDs
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  is_anonymous BOOLEAN DEFAULT false,
  avatar_url TEXT,
  bio TEXT,
  
  -- Clerk-specific fields
  clerk_user_id TEXT UNIQUE NOT NULL, -- Store the original Clerk ID
  first_name TEXT,
  last_name TEXT,
  
  -- User preferences
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  privacy_mode BOOLEAN DEFAULT false,
  
  -- User stats
  total_whispers INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  total_chain_responses INTEGER DEFAULT 0,
  whisper_streak INTEGER DEFAULT 0,
  last_whisper_date TIMESTAMP WITH TIME ZONE,
  
  -- Social features
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT display_name_length CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 50)
);

-- Create index for Clerk user ID for fast lookups
CREATE INDEX idx_users_clerk_user_id ON public.users(clerk_user_id);

-- =============================================
-- STEP 3: Update foreign key references
-- =============================================

-- First, we need to drop existing foreign key constraints
-- and recreate tables with TEXT user IDs

-- 3.1 Update whispers table
ALTER TABLE public.whispers DROP CONSTRAINT IF EXISTS whispers_user_id_fkey;
ALTER TABLE public.whispers ALTER COLUMN user_id TYPE TEXT;

-- 3.2 Update chain_responses table
ALTER TABLE public.chain_responses DROP CONSTRAINT IF EXISTS chain_responses_user_id_fkey;
ALTER TABLE public.chain_responses DROP CONSTRAINT IF EXISTS chain_responses_original_whisper_user_id_fkey;
ALTER TABLE public.chain_responses ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.chain_responses ALTER COLUMN original_whisper_user_id TYPE TEXT;

-- 3.3 Update likes table
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE public.likes ALTER COLUMN user_id TYPE TEXT;

-- 3.4 Update follows table
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
ALTER TABLE public.follows ALTER COLUMN follower_id TYPE TEXT;
ALTER TABLE public.follows ALTER COLUMN following_id TYPE TEXT;

-- 3.5 Update collections table
ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_user_id_fkey;
ALTER TABLE public.collections ALTER COLUMN user_id TYPE TEXT;

-- 3.6 Update collection_items table
ALTER TABLE public.collection_items DROP CONSTRAINT IF EXISTS collection_items_added_by_fkey;
ALTER TABLE public.collection_items ALTER COLUMN added_by TYPE TEXT;

-- 3.7 Update user_achievements table
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE public.user_achievements ALTER COLUMN user_id TYPE TEXT;

-- 3.8 Update notifications table
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_from_user_id_fkey;
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.notifications ALTER COLUMN from_user_id TYPE TEXT;

-- 3.9 Update blocked_users table
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_user_id_fkey;
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocked_user_id_fkey;
ALTER TABLE public.blocked_users ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.blocked_users ALTER COLUMN blocked_user_id TYPE TEXT;

-- 3.10 Update reports table
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;
ALTER TABLE public.reports ALTER COLUMN reporter_id TYPE TEXT;
ALTER TABLE public.reports ALTER COLUMN reported_user_id TYPE TEXT;

-- =============================================
-- STEP 4: Re-add foreign key constraints
-- =============================================

-- 4.1 Whispers
ALTER TABLE public.whispers 
  ADD CONSTRAINT whispers_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 4.2 Chain responses
ALTER TABLE public.chain_responses 
  ADD CONSTRAINT chain_responses_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.chain_responses 
  ADD CONSTRAINT chain_responses_original_whisper_user_id_fkey 
  FOREIGN KEY (original_whisper_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 4.3 Likes
ALTER TABLE public.likes 
  ADD CONSTRAINT likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4.4 Follows
ALTER TABLE public.follows 
  ADD CONSTRAINT follows_follower_id_fkey 
  FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.follows 
  ADD CONSTRAINT follows_following_id_fkey 
  FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4.5 Collections
ALTER TABLE public.collections 
  ADD CONSTRAINT collections_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4.6 Collection items
ALTER TABLE public.collection_items 
  ADD CONSTRAINT collection_items_added_by_fkey 
  FOREIGN KEY (added_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 4.7 User achievements
ALTER TABLE public.user_achievements 
  ADD CONSTRAINT user_achievements_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4.8 Notifications
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_from_user_id_fkey 
  FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 4.9 Blocked users
ALTER TABLE public.blocked_users 
  ADD CONSTRAINT blocked_users_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.blocked_users 
  ADD CONSTRAINT blocked_users_blocked_user_id_fkey 
  FOREIGN KEY (blocked_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4.10 Reports
ALTER TABLE public.reports 
  ADD CONSTRAINT reports_reporter_id_fkey 
  FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.reports 
  ADD CONSTRAINT reports_reported_user_id_fkey 
  FOREIGN KEY (reported_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- =============================================
-- STEP 5: Create function to sync Clerk users
-- =============================================
CREATE OR REPLACE FUNCTION public.create_or_update_user_from_clerk(
  p_clerk_user_id TEXT,
  p_email TEXT,
  p_username TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_display_name TEXT,
  p_avatar_url TEXT
) RETURNS public.users AS $$
DECLARE
  v_user public.users;
  v_generated_username TEXT;
BEGIN
  -- Generate username if not provided
  IF p_username IS NULL OR p_username = '' THEN
    v_generated_username := LOWER(SPLIT_PART(p_email, '@', 1));
    -- Add random suffix if username exists
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_generated_username) LOOP
      v_generated_username := LOWER(SPLIT_PART(p_email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
    END LOOP;
  ELSE
    v_generated_username := p_username;
  END IF;

  -- Insert or update user
  INSERT INTO public.users (
    id,
    clerk_user_id,
    email,
    username,
    first_name,
    last_name,
    display_name,
    avatar_url,
    is_anonymous,
    created_at,
    updated_at
  ) VALUES (
    p_clerk_user_id, -- Use Clerk ID as primary key
    p_clerk_user_id,
    p_email,
    v_generated_username,
    p_first_name,
    p_last_name,
    COALESCE(p_display_name, p_first_name || ' ' || p_last_name, p_email),
    p_avatar_url,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (clerk_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.users.username, EXCLUDED.username),
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW(),
    last_seen = NOW()
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 6: Update RLS policies
-- =============================================

-- Drop old policies that reference auth.uid()
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create new policies without auth.uid()
-- These will need to be enforced at the application level since Clerk handles auth

-- Allow all authenticated requests to read users
CREATE POLICY "Allow read access to users" ON public.users
  FOR SELECT USING (true);

-- For other operations, you'll need to implement authorization in your API layer
-- since Supabase won't have access to Clerk's auth context

-- =============================================
-- STEP 7: Create indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_whispers_user_id ON public.whispers(user_id);
CREATE INDEX IF NOT EXISTS idx_chain_responses_user_id ON public.chain_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Note: After running this migration:
-- 1. Update your application code to use Clerk user IDs
-- 2. Sync existing Clerk users to the database
-- 3. Test all functionality thoroughly
-- 4. Once verified, you can drop the users_backup table