-- Insert Sample Data for WhisperChain
-- This script adds sample data to test the application

-- First, create some test users (using auth.users would require Supabase auth, so we'll create them in public.users)
-- For testing, we'll generate UUIDs manually

-- Sample Users
INSERT INTO public.users (id, username, display_name, email, is_anonymous, bio, total_whispers, total_likes_received) VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'moonwhisperer', 'Luna Starlight', 'luna@example.com', false, 'Dancing with words under moonlight', 5, 23),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'dreamcatcher', 'River Song', 'river@example.com', false, 'Collecting dreams, one whisper at a time', 4, 18),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'silentpoet', 'Anonymous Poet', null, true, null, 3, 15),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'naturelover', 'Willow Green', 'willow@example.com', false, 'Finding poetry in every leaf', 4, 20),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'midnightmuse', 'Midnight Writer', 'midnight@example.com', false, 'Writing when the world sleeps', 3, 12)
ON CONFLICT (id) DO NOTHING;

-- Sample Whispers
INSERT INTO public.whispers (id, user_id, theme_id, original_text, transformed_text, likes_count, chain_count, created_at) VALUES
  -- Love themed whispers
  ('660e8400-e29b-41d4-a716-446655440001'::uuid, 
   '550e8400-e29b-41d4-a716-446655440001'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Love'),
   'I miss the way you laugh at my bad jokes',
   'In echoes of laughter, where bad jokes bloom like wildflowers, I search for the melody of your joy',
   8, 2, NOW() - INTERVAL '2 days'),
   
  ('660e8400-e29b-41d4-a716-446655440002'::uuid,
   '550e8400-e29b-41d4-a716-446655440002'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Love'),
   'Your smile makes everything better',
   'In the curve of your smile, universes unfold, and broken things learn to dance again',
   12, 3, NOW() - INTERVAL '3 days'),

  -- Dreams themed whispers
  ('660e8400-e29b-41d4-a716-446655440003'::uuid,
   '550e8400-e29b-41d4-a716-446655440003'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Dreams'),
   'I dreamt I could fly above the clouds',
   'Above cotton castles in the sky, my wings remember what my feet forgot',
   6, 1, NOW() - INTERVAL '1 day'),
   
  ('660e8400-e29b-41d4-a716-446655440004'::uuid,
   '550e8400-e29b-41d4-a716-446655440001'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Dreams'),
   'Sometimes I dream in colors that don''t exist',
   'My dreams paint with impossible hues, creating rainbows the waking world has never seen',
   9, 2, NOW() - INTERVAL '4 days'),

  -- Nature themed whispers
  ('660e8400-e29b-41d4-a716-446655440005'::uuid,
   '550e8400-e29b-41d4-a716-446655440004'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Nature'),
   'The trees whisper secrets in the wind',
   'Ancient guardians speak in rustling tongues, their wisdom scattered on autumn''s breath',
   7, 2, NOW() - INTERVAL '5 days'),
   
  ('660e8400-e29b-41d4-a716-446655440006'::uuid,
   '550e8400-e29b-41d4-a716-446655440004'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Nature'),
   'Rain sounds like the earth is crying happy tears',
   'Sky''s joy falls in silver symphonies, each drop a celebration of earth''s embrace',
   10, 1, NOW() - INTERVAL '6 days'),

  -- Sadness themed whispers
  ('660e8400-e29b-41d4-a716-446655440007'::uuid,
   '550e8400-e29b-41d4-a716-446655440005'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Sadness'),
   'Some days feel heavier than others',
   'Today wears lead shoes, tomorrow might learn to float',
   5, 2, NOW() - INTERVAL '7 days'),
   
  ('660e8400-e29b-41d4-a716-446655440008'::uuid,
   '550e8400-e29b-41d4-a716-446655440002'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Sadness'),
   'I collect my tears in invisible jars',
   'Crystal vessels line my soul''s shelves, each holding storms that passed through me',
   8, 1, NOW() - INTERVAL '8 days'),

  -- Hope themed whispers
  ('660e8400-e29b-41d4-a716-446655440009'::uuid,
   '550e8400-e29b-41d4-a716-446655440005'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Hope'),
   'Tomorrow might be the day everything changes',
   'On tomorrow''s horizon, possibility dances with dawn, painting new worlds in morning light',
   11, 3, NOW() - INTERVAL '9 days'),
   
  ('660e8400-e29b-41d4-a716-446655440010'::uuid,
   '550e8400-e29b-41d4-a716-446655440001'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Hope'),
   'Even broken things can grow flowers',
   'Through cracks in my foundation, wildflowers find their way to sun',
   15, 4, NOW() - INTERVAL '10 days'),

  -- Joy themed whispers
  ('660e8400-e29b-41d4-a716-446655440011'::uuid,
   '550e8400-e29b-41d4-a716-446655440003'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Joy'),
   'My happiness bubbles up like champagne',
   'Effervescent soul, I overflow with golden bubbles of light',
   9, 2, NOW() - INTERVAL '11 days'),

  -- Abstract themed whispers
  ('660e8400-e29b-41d4-a716-446655440012'::uuid,
   '550e8400-e29b-41d4-a716-446655440004'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Abstract'),
   'Time feels like melting clocks today',
   'Salvador''s prophecy drips from my walls, each second a surreal masterpiece',
   7, 1, NOW() - INTERVAL '12 days'),

  -- Loneliness themed whispers
  ('660e8400-e29b-41d4-a716-446655440013'::uuid,
   '550e8400-e29b-41d4-a716-446655440002'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Loneliness'),
   'The silence is too loud tonight',
   'Quiet screams in frequencies only the lonely can hear',
   6, 2, NOW() - INTERVAL '13 days'),

  -- Fear themed whispers
  ('660e8400-e29b-41d4-a716-446655440014'::uuid,
   '550e8400-e29b-41d4-a716-446655440005'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Fear'),
   'My shadows have shadows',
   'In the darkness behind darkness, I find mirrors reflecting what I dare not see',
   4, 1, NOW() - INTERVAL '14 days'),

  -- Recent whispers for search testing
  ('660e8400-e29b-41d4-a716-446655440015'::uuid,
   '550e8400-e29b-41d4-a716-446655440001'::uuid,
   (SELECT id FROM public.themes WHERE name = 'Dreams'),
   'Stars are just dreams the sky is having',
   'Celestial slumber paints wishes across the void, each twinkle a REM cycle of the universe',
   3, 0, NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Sample Chain Responses
INSERT INTO public.chain_responses (whisper_id, user_id, original_text, transformed_text, likes_count, created_at) VALUES
  -- Responses to "Your smile makes everything better"
  ('660e8400-e29b-41d4-a716-446655440002'::uuid,
   '550e8400-e29b-41d4-a716-446655440004'::uuid,
   'Smiles are contagious magic',
   'Like dandelion wishes on summer wind, joy spreads from soul to soul',
   5, NOW() - INTERVAL '2 days 12 hours'),
   
  ('660e8400-e29b-41d4-a716-446655440002'::uuid,
   '550e8400-e29b-41d4-a716-446655440005'::uuid,
   'I keep smiles in my pocket for rainy days',
   'Sunshine collection, folded neat between lint and lost coins',
   3, NOW() - INTERVAL '2 days 6 hours'),

  -- Responses to "Tomorrow might be the day everything changes"
  ('660e8400-e29b-41d4-a716-446655440009'::uuid,
   '550e8400-e29b-41d4-a716-446655440002'::uuid,
   'Change comes on butterfly wings',
   'Metamorphosis whispers: today''s caterpillar dreams tomorrow''s flight',
   4, NOW() - INTERVAL '8 days 18 hours'),
   
  ('660e8400-e29b-41d4-a716-446655440009'::uuid,
   '550e8400-e29b-41d4-a716-446655440003'::uuid,
   'I''m planting seeds for tomorrow''s garden',
   'Hope buried in dark soil, waiting for dawn''s permission to bloom',
   6, NOW() - INTERVAL '8 days 12 hours'),

  -- Response to "Even broken things can grow flowers"
  ('660e8400-e29b-41d4-a716-446655440010'::uuid,
   '550e8400-e29b-41d4-a716-446655440004'::uuid,
   'My scars are gardens now',
   'Where pain once carved rivers, wildflowers drink and dance',
   8, NOW() - INTERVAL '9 days 20 hours')
ON CONFLICT (id) DO NOTHING;

-- Sample Likes
INSERT INTO public.likes (user_id, whisper_id) VALUES
  -- User 1 likes
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '660e8400-e29b-41d4-a716-446655440005'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '660e8400-e29b-41d4-a716-446655440009'::uuid),
  
  -- User 2 likes
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '660e8400-e29b-41d4-a716-446655440010'::uuid),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '660e8400-e29b-41d4-a716-446655440006'::uuid),
  
  -- User 3 likes
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '660e8400-e29b-41d4-a716-446655440004'::uuid),
  
  -- User 4 likes
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '660e8400-e29b-41d4-a716-446655440010'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '660e8400-e29b-41d4-a716-446655440009'::uuid),
  
  -- User 5 likes
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '660e8400-e29b-41d4-a716-446655440010'::uuid)
ON CONFLICT (user_id, whisper_id) DO NOTHING;

-- Sample Follows
INSERT INTO public.follows (follower_id, following_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid)
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Update follower/following counts
UPDATE public.users u SET 
  followers_count = (SELECT COUNT(*) FROM public.follows WHERE following_id = u.id),
  following_count = (SELECT COUNT(*) FROM public.follows WHERE follower_id = u.id);

COMMIT;