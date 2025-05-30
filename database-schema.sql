-- WhisperChain Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  is_anonymous BOOLEAN DEFAULT true,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Themes table
CREATE TABLE themes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default themes
INSERT INTO themes (name, color, icon) VALUES
  ('Love', '#EC407A', 'heart'),
  ('Fear', '#7E2A33', 'warning'),
  ('Dreams', '#7C5CFF', 'cloud'),
  ('Nature', '#4CAF50', 'leaf'),
  ('Abstract', '#00BCD4', 'shapes'),
  ('Joy', '#FF9800', 'happy'),
  ('Hope', '#26A69A', 'sunny'),
  ('Sadness', '#5C6BC0', 'rainy'),
  ('Loneliness', '#9E9E9E', 'person');

-- Whispers table
CREATE TABLE whispers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  transformed_text TEXT NOT NULL,
  theme_id UUID REFERENCES themes(id),
  likes_count INTEGER DEFAULT 0,
  chain_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chain responses table
CREATE TABLE chain_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  whisper_id UUID REFERENCES whispers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  transformed_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table (for tracking user likes)
CREATE TABLE whisper_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  whisper_id UUID REFERENCES whispers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(whisper_id, user_id)
);

-- Achievements table
CREATE TABLE achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements junction table
CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Insert default achievements
INSERT INTO achievements (name, description, icon) VALUES
  ('First Whisper', 'Created your first whisper', 'create'),
  ('Heart Collector', 'Received 10 likes on a single whisper', 'heart'),
  ('Chain Starter', 'Started 5 whisper chains', 'link'),
  ('Deep Thinker', 'Created 10 whispers', 'bulb'),
  ('Community Favorite', 'Received 100 total likes', 'star');

-- Functions to update counters

-- Function to update whisper likes count
CREATE OR REPLACE FUNCTION update_whisper_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE whispers 
    SET likes_count = likes_count + 1, updated_at = NOW()
    WHERE id = NEW.whisper_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE whispers 
    SET likes_count = likes_count - 1, updated_at = NOW()
    WHERE id = OLD.whisper_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update chain count
CREATE OR REPLACE FUNCTION update_whisper_chain_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE whispers 
    SET chain_count = chain_count + 1, updated_at = NOW()
    WHERE id = NEW.whisper_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE whispers 
    SET chain_count = chain_count - 1, updated_at = NOW()
    WHERE id = OLD.whisper_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_whisper_likes_count
  AFTER INSERT OR DELETE ON whisper_likes
  FOR EACH ROW EXECUTE FUNCTION update_whisper_likes_count();

CREATE TRIGGER trigger_update_whisper_chain_count
  AFTER INSERT OR DELETE ON chain_responses
  FOR EACH ROW EXECUTE FUNCTION update_whisper_chain_count();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whispers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whisper_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read all users but only update their own
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Whispers are public for reading, users can only insert/update their own
CREATE POLICY "Whispers are viewable by everyone" ON whispers FOR SELECT USING (true);
CREATE POLICY "Users can insert their own whispers" ON whispers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own whispers" ON whispers FOR UPDATE USING (auth.uid() = user_id);

-- Chain responses are public for reading, users can only insert their own
CREATE POLICY "Chain responses are viewable by everyone" ON chain_responses FOR SELECT USING (true);
CREATE POLICY "Users can insert their own chain responses" ON chain_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Likes are viewable by everyone, users can only manage their own likes
CREATE POLICY "Likes are viewable by everyone" ON whisper_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON whisper_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON whisper_likes FOR DELETE USING (auth.uid() = user_id);

-- User achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);

-- Themes and achievements are readable by everyone
CREATE POLICY "Themes are viewable by everyone" ON themes FOR SELECT USING (true);
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);