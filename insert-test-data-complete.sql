-- Insert complete test data for WhisperChain
-- This creates a full test environment with users, themes, whispers, likes, and chains

-- 1. First check if we have themes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.themes LIMIT 1) THEN
    -- Insert default themes
    INSERT INTO public.themes (name, description, color, is_active) VALUES
    ('abstract', 'Abstract thoughts and ideas', '#9333EA', true),
    ('dreams', 'Dreams and aspirations', '#7C3AED', true),
    ('love', 'Love and relationships', '#EC4899', true),
    ('sadness', 'Sadness and melancholy', '#3B82F6', true),
    ('fear', 'Fears and anxieties', '#6B7280', true),
    ('nature', 'Nature and environment', '#10B981', true),
    ('joy', 'Joy and happiness', '#F59E0B', true),
    ('hope', 'Hope and optimism', '#14B8A6', true);
  END IF;
END $$;

-- 2. Check if we have users (create test users if needed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
    -- Insert test users
    INSERT INTO public.users (id, username, display_name, created_at) VALUES
    ('test-user-1', 'whisper_poet', 'Whisper Poet', NOW()),
    ('test-user-2', 'dream_catcher', 'Dream Catcher', NOW()),
    ('test-user-3', 'soul_writer', 'Soul Writer', NOW());
  END IF;
END $$;

-- 3. Insert test whispers
DO $$
DECLARE
  user1_id text;
  user2_id text;
  user3_id text;
  abstract_theme_id uuid;
  dreams_theme_id uuid;
  love_theme_id uuid;
  sadness_theme_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO user1_id FROM public.users WHERE username = 'whisper_poet' LIMIT 1;
  SELECT id INTO user2_id FROM public.users WHERE username = 'dream_catcher' LIMIT 1;
  SELECT id INTO user3_id FROM public.users WHERE username = 'soul_writer' LIMIT 1;
  
  -- If no test users exist, use any existing users
  IF user1_id IS NULL THEN
    SELECT id INTO user1_id FROM public.users LIMIT 1;
  END IF;
  IF user2_id IS NULL THEN
    SELECT id INTO user2_id FROM public.users OFFSET 1 LIMIT 1;
  END IF;
  IF user3_id IS NULL THEN
    SELECT id INTO user3_id FROM public.users OFFSET 2 LIMIT 1;
  END IF;
  
  -- Get theme IDs
  SELECT id INTO abstract_theme_id FROM public.themes WHERE name = 'abstract' LIMIT 1;
  SELECT id INTO dreams_theme_id FROM public.themes WHERE name = 'dreams' LIMIT 1;
  SELECT id INTO love_theme_id FROM public.themes WHERE name = 'love' LIMIT 1;
  SELECT id INTO sadness_theme_id FROM public.themes WHERE name = 'sadness' LIMIT 1;
  
  -- Only insert if we don't have many whispers
  IF (SELECT COUNT(*) FROM public.whispers) < 10 THEN
    -- Insert whispers with different themes and engagement levels
    INSERT INTO public.whispers (
      user_id, 
      original_text, 
      transformed_text, 
      theme_id, 
      is_published, 
      likes_count, 
      chain_count,
      ai_hashtags,
      created_at
    ) VALUES
    -- Popular whisper
    (user1_id, 
     'I feel like I''m floating in a sea of thoughts', 
     'Adrift in consciousness\nwaves of wonder wash over\nmy wandering mind', 
     abstract_theme_id, 
     true, 
     15, 
     3,
     ARRAY['#consciousness', '#thoughts', '#mindfulness'],
     NOW() - INTERVAL '2 days'),
     
    -- Recent whisper
    (user2_id, 
     'Last night I dreamed I could fly over the city', 
     'Nocturnal wings unfold—\nthe cityscape beneath me\nbecomes stardust', 
     dreams_theme_id, 
     true, 
     7, 
     1,
     ARRAY['#dreams', '#flying', '#freedom'],
     NOW() - INTERVAL '1 hour'),
     
    -- Love themed
    (user3_id, 
     'Missing someone who was never really mine', 
     'Ghost of what could be\nlingers in empty spaces\nwhere hope used to live', 
     love_theme_id, 
     true, 
     12, 
     2,
     ARRAY['#unrequited', '#longing', '#memories'],
     NOW() - INTERVAL '12 hours'),
     
    -- Sadness themed
    (user1_id, 
     'The rain matches my mood today', 
     'Sky weeps with me—\neach drop a liquid poem\nof shared sorrow', 
     sadness_theme_id, 
     true, 
     8, 
     0,
     ARRAY['#rain', '#melancholy', '#emotions'],
     NOW() - INTERVAL '6 hours'),
     
    -- Another abstract
    (user2_id, 
     'Time feels like it''s moving in circles', 
     'Ouroboros hours—\nthe clock devours its tail\nwhile I stand still', 
     abstract_theme_id, 
     true, 
     10, 
     1,
     ARRAY['#time', '#cycles', '#existence'],
     NOW() - INTERVAL '1 day');
  END IF;
END $$;

-- 4. Add some likes
DO $$
DECLARE
  whisper_cursor CURSOR FOR 
    SELECT id, user_id FROM public.whispers WHERE is_published = true LIMIT 5;
  user_cursor CURSOR FOR 
    SELECT id FROM public.users LIMIT 3;
  w_record RECORD;
  u_record RECORD;
BEGIN
  -- Add likes from different users to different whispers
  FOR w_record IN whisper_cursor LOOP
    FOR u_record IN user_cursor LOOP
      -- Don't let users like their own whispers
      IF w_record.user_id != u_record.id THEN
        -- Only add like if it doesn't exist
        INSERT INTO public.likes (whisper_id, user_id)
        VALUES (w_record.id, u_record.id)
        ON CONFLICT (whisper_id, user_id) DO NOTHING;
        
        -- Only add first 2 users' likes to create variety
        EXIT WHEN random() > 0.6;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 5. Add some chain responses
DO $$
DECLARE
  whisper_id uuid;
  user_id text;
BEGIN
  -- Get a popular whisper to add chains to
  SELECT id INTO whisper_id 
  FROM public.whispers 
  WHERE is_published = true AND chain_count > 0
  LIMIT 1;
  
  -- Get a user who didn't create this whisper
  SELECT u.id INTO user_id
  FROM public.users u
  WHERE u.id != (SELECT user_id FROM public.whispers WHERE id = whisper_id)
  LIMIT 1;
  
  IF whisper_id IS NOT NULL AND user_id IS NOT NULL THEN
    -- Only add if we don't have many chain responses
    IF (SELECT COUNT(*) FROM public.chain_responses) < 5 THEN
      INSERT INTO public.chain_responses (
        whisper_id,
        user_id,
        original_text,
        transformed_text,
        response_order
      ) VALUES
      (whisper_id,
       user_id,
       'This resonates with my own journey',
       'Echoes of your path\nreverberate through my soul—\nwe walk together',
       1);
    END IF;
  END IF;
END $$;

-- 6. Update counts (in case they're out of sync)
UPDATE public.whispers w
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.likes l 
  WHERE l.whisper_id = w.id
);

UPDATE public.whispers w
SET chain_count = (
  SELECT COUNT(*) 
  FROM public.chain_responses cr 
  WHERE cr.whisper_id = w.id
);

-- 7. Verify the data
SELECT 'Data insertion complete!' as status;
SELECT 
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.themes) as total_themes,
  (SELECT COUNT(*) FROM public.whispers WHERE is_published = true) as published_whispers,
  (SELECT COUNT(*) FROM public.likes) as total_likes,
  (SELECT COUNT(*) FROM public.chain_responses) as total_chains;