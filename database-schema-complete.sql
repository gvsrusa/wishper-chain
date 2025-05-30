-- WhisperChain Complete Database Schema
-- Run this in your Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE TABLES
-- =============================================

-- 1. USERS TABLE (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  is_anonymous BOOLEAN DEFAULT false,
  avatar_url TEXT,
  bio TEXT,
  
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

-- 2. THEMES TABLE
CREATE TABLE public.themes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_system_theme BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT theme_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 50)
);

-- 3. WHISPERS TABLE
CREATE TABLE public.whispers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES public.themes(id),
  
  -- Content
  original_text TEXT NOT NULL,
  transformed_text TEXT NOT NULL,
  transformation_type TEXT DEFAULT 'ai_poetry',
  
  -- Metadata
  language TEXT DEFAULT 'en',
  word_count INTEGER,
  character_count INTEGER,
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  
  -- Engagement metrics
  likes_count INTEGER DEFAULT 0,
  chain_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_published BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved', -- pending, approved, rejected
  
  -- Geographic (optional)
  location_city TEXT,
  location_country TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Search
  search_vector tsvector,
  
  -- Constraints
  CONSTRAINT original_text_length CHECK (char_length(original_text) >= 1 AND char_length(original_text) <= 1000),
  CONSTRAINT transformed_text_length CHECK (char_length(transformed_text) >= 1 AND char_length(transformed_text) <= 2000)
);

-- 4. CHAIN RESPONSES TABLE
CREATE TABLE public.chain_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  whisper_id UUID NOT NULL REFERENCES public.whispers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_response_id UUID REFERENCES public.chain_responses(id), -- For nested responses
  
  -- Content
  original_text TEXT NOT NULL,
  transformed_text TEXT NOT NULL,
  transformation_type TEXT DEFAULT 'ai_poetry',
  
  -- Metadata
  response_order INTEGER DEFAULT 1,
  depth_level INTEGER DEFAULT 1,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT original_text_length CHECK (char_length(original_text) >= 1 AND char_length(original_text) <= 500),
  CONSTRAINT depth_level_check CHECK (depth_level >= 1 AND depth_level <= 5)
);

-- 5. LIKES TABLE (for whispers and chain responses)
CREATE TABLE public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  whisper_id UUID REFERENCES public.whispers(id) ON DELETE CASCADE,
  chain_response_id UUID REFERENCES public.chain_responses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one like per user per item
  UNIQUE(user_id, whisper_id),
  UNIQUE(user_id, chain_response_id),
  
  -- Ensure exactly one of whisper_id or chain_response_id is set
  CONSTRAINT like_target_check CHECK (
    (whisper_id IS NOT NULL AND chain_response_id IS NULL) OR
    (whisper_id IS NULL AND chain_response_id IS NOT NULL)
  )
);

-- =============================================
-- SOCIAL FEATURES
-- =============================================

-- 6. FOLLOWS TABLE
CREATE TABLE public.follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent self-following and duplicate follows
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- 7. COLLECTIONS TABLE (user-created whisper collections)
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  whisper_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT collection_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- 8. COLLECTION_WHISPERS TABLE (many-to-many)
CREATE TABLE public.collection_whispers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  whisper_id UUID NOT NULL REFERENCES public.whispers(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(collection_id, whisper_id)
);

-- =============================================
-- GAMIFICATION & ACHIEVEMENTS
-- =============================================

-- 9. ACHIEVEMENTS TABLE
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'milestone', -- milestone, streak, social, special
  criteria JSONB, -- Flexible criteria storage
  points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. USER_ACHIEVEMENTS TABLE
CREATE TABLE public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 100, -- Progress percentage
  
  UNIQUE(user_id, achievement_id)
);

-- =============================================
-- REPORTING & MODERATION
-- =============================================

-- 11. REPORTS TABLE
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  whisper_id UUID REFERENCES public.whispers(id) ON DELETE CASCADE,
  chain_response_id UUID REFERENCES public.chain_responses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Reported user
  
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure one target is reported
  CONSTRAINT report_target_check CHECK (
    (whisper_id IS NOT NULL AND chain_response_id IS NULL AND user_id IS NULL) OR
    (whisper_id IS NULL AND chain_response_id IS NOT NULL AND user_id IS NULL) OR
    (whisper_id IS NULL AND chain_response_id IS NULL AND user_id IS NOT NULL)
  )
);

-- =============================================
-- ANALYTICS & INSIGHTS
-- =============================================

-- 12. ANALYTICS_EVENTS TABLE
CREATE TABLE public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- whisper_created, whisper_viewed, like_given, etc.
  whisper_id UUID REFERENCES public.whispers(id) ON DELETE CASCADE,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whispers_updated_at BEFORE UPDATE ON public.whispers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update counters
CREATE OR REPLACE FUNCTION update_whisper_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'likes' AND NEW.whisper_id IS NOT NULL THEN
      UPDATE public.whispers SET likes_count = likes_count + 1 WHERE id = NEW.whisper_id;
    ELSIF TG_TABLE_NAME = 'chain_responses' THEN
      UPDATE public.whispers SET chain_count = chain_count + 1 WHERE id = NEW.whisper_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'likes' AND OLD.whisper_id IS NOT NULL THEN
      UPDATE public.whispers SET likes_count = likes_count - 1 WHERE id = OLD.whisper_id;
    ELSIF TG_TABLE_NAME = 'chain_responses' THEN
      UPDATE public.whispers SET chain_count = chain_count - 1 WHERE id = OLD.whisper_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers for counters
CREATE TRIGGER update_whisper_likes_count AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION update_whisper_stats();
CREATE TRIGGER update_whisper_chain_count AFTER INSERT OR DELETE ON public.chain_responses FOR EACH ROW EXECUTE FUNCTION update_whisper_stats();

-- Function for search vector
CREATE OR REPLACE FUNCTION update_whisper_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.original_text, '') || ' ' || COALESCE(NEW.transformed_text, ''));
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whisper_search_vector_trigger 
  BEFORE INSERT OR UPDATE ON public.whispers 
  FOR EACH ROW EXECUTE FUNCTION update_whisper_search_vector();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_is_anonymous ON public.users(is_anonymous);

-- Whispers indexes
CREATE INDEX idx_whispers_user_id ON public.whispers(user_id);
CREATE INDEX idx_whispers_theme_id ON public.whispers(theme_id);
CREATE INDEX idx_whispers_created_at ON public.whispers(created_at DESC);
CREATE INDEX idx_whispers_likes_count ON public.whispers(likes_count DESC);
CREATE INDEX idx_whispers_published ON public.whispers(is_published, published_at DESC);
CREATE INDEX idx_whispers_search ON public.whispers USING GIN(search_vector);

-- Chain responses indexes
CREATE INDEX idx_chain_responses_whisper_id ON public.chain_responses(whisper_id);
CREATE INDEX idx_chain_responses_user_id ON public.chain_responses(user_id);
CREATE INDEX idx_chain_responses_parent ON public.chain_responses(parent_response_id);

-- Likes indexes
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_whisper_id ON public.likes(whisper_id);
CREATE INDEX idx_likes_chain_response_id ON public.likes(chain_response_id);

-- Social indexes
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default themes
INSERT INTO public.themes (name, color, icon, description, is_system_theme) VALUES
  ('Love', '#EC407A', 'heart', 'Expressions of love, romance, and affection', true),
  ('Dreams', '#7C5CFF', 'cloud', 'Hopes, aspirations, and nighttime visions', true),
  ('Nature', '#4CAF50', 'leaf', 'Connection with the natural world', true),
  ('Joy', '#FF9800', 'happy', 'Happiness, celebration, and positive emotions', true),
  ('Sadness', '#5C6BC0', 'rainy', 'Melancholy, loss, and emotional depth', true),
  ('Fear', '#7E2A33', 'warning', 'Anxieties, worries, and facing the unknown', true),
  ('Hope', '#26A69A', 'sunny', 'Optimism, faith, and looking forward', true),
  ('Abstract', '#00BCD4', 'shapes', 'Creative, artistic, and conceptual thoughts', true),
  ('Loneliness', '#9E9E9E', 'person', 'Solitude, isolation, and introspection', true),
  ('Friendship', '#795548', 'people', 'Bonds, companionship, and social connections', true);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, type, criteria, points) VALUES
  ('First Whisper', 'Created your very first whisper', 'create', 'milestone', '{"whispers_created": 1}', 10),
  ('Heart Collector', 'Received 10 likes on a single whisper', 'heart', 'milestone', '{"whisper_likes": 10}', 25),
  ('Chain Starter', 'Started 5 whisper chains', 'link', 'social', '{"chains_started": 5}', 20),
  ('Deep Thinker', 'Created 10 whispers', 'bulb', 'milestone', '{"whispers_created": 10}', 30),
  ('Community Favorite', 'Received 100 total likes', 'star', 'milestone', '{"total_likes": 100}', 50),
  ('Poet', 'Created 50 whispers', 'feather-alt', 'milestone', '{"whispers_created": 50}', 75),
  ('Weekly Warrior', 'Posted whispers for 7 consecutive days', 'calendar', 'streak', '{"daily_streak": 7}', 40),
  ('Social Butterfly', 'Followed 10 other users', 'users', 'social', '{"following_count": 10}', 15),
  ('Conversation Catalyst', 'Responded to 20 whisper chains', 'comment-dots', 'social', '{"chain_responses": 20}', 35);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whispers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_whispers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Themes policies (public read, admin write)
CREATE POLICY "Themes are viewable by everyone" ON public.themes FOR SELECT USING (true);

-- Whispers policies
CREATE POLICY "Published whispers are viewable by everyone" ON public.whispers FOR SELECT USING (is_published = true);
CREATE POLICY "Users can insert their own whispers" ON public.whispers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own whispers" ON public.whispers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own whispers" ON public.whispers FOR DELETE USING (auth.uid() = user_id);

-- Chain responses policies
CREATE POLICY "Chain responses are viewable by everyone" ON public.chain_responses FOR SELECT USING (true);
CREATE POLICY "Users can insert their own chain responses" ON public.chain_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chain responses" ON public.chain_responses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chain responses" ON public.chain_responses FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Collections policies
CREATE POLICY "Public collections are viewable by everyone" ON public.collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage their own collections" ON public.collections FOR ALL USING (auth.uid() = user_id);

-- Collection whispers policies
CREATE POLICY "Collection whispers follow collection visibility" ON public.collection_whispers FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND (is_public = true OR user_id = auth.uid())));
CREATE POLICY "Users can manage their own collection whispers" ON public.collection_whispers FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND user_id = auth.uid()));

-- Achievements policies (public read)
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "User achievements are viewable by everyone" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "System can insert user achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);

-- Reports policies
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =============================================
-- FUNCTIONS FOR APPLICATION USE
-- =============================================

-- Function to get user feed (following + popular)
CREATE OR REPLACE FUNCTION get_user_feed(user_uuid UUID, page_size INTEGER DEFAULT 20, page_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  whisper_id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  original_text TEXT,
  transformed_text TEXT,
  theme_name TEXT,
  theme_color TEXT,
  likes_count INTEGER,
  chain_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  is_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    u.username,
    u.display_name,
    w.original_text,
    w.transformed_text,
    t.name,
    t.color,
    w.likes_count,
    w.chain_count,
    w.created_at,
    EXISTS(SELECT 1 FROM public.likes l WHERE l.whisper_id = w.id AND l.user_id = user_uuid) as is_liked
  FROM public.whispers w
  JOIN public.users u ON w.user_id = u.id
  LEFT JOIN public.themes t ON w.theme_id = t.id
  WHERE w.is_published = true
  ORDER BY w.created_at DESC
  LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search whispers
CREATE OR REPLACE FUNCTION search_whispers(search_term TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  whisper_id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  original_text TEXT,
  transformed_text TEXT,
  theme_name TEXT,
  theme_color TEXT,
  likes_count INTEGER,
  chain_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    u.username,
    u.display_name,
    w.original_text,
    w.transformed_text,
    t.name,
    t.color,
    w.likes_count,
    w.chain_count,
    w.created_at,
    ts_rank(w.search_vector, plainto_tsquery('english', search_term)) as rank
  FROM public.whispers w
  JOIN public.users u ON w.user_id = u.id
  LEFT JOIN public.themes t ON w.theme_id = t.id
  WHERE w.is_published = true
    AND w.search_vector @@ plainto_tsquery('english', search_term)
  ORDER BY rank DESC, w.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;