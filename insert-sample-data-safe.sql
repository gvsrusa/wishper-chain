-- Safe Sample Data Insertion for WhisperChain
-- This script checks for existing data before inserting

-- First, check if we have the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if themes exist, if not insert them
INSERT INTO public.themes (name, color, icon, description, is_system_theme) 
SELECT * FROM (VALUES
  ('Love', '#EC407A', 'heart', 'Expressions of love, romance, and affection', true),
  ('Dreams', '#7C5CFF', 'cloud', 'Hopes, aspirations, and nighttime visions', true),
  ('Nature', '#4CAF50', 'leaf', 'Connection with the natural world', true),
  ('Joy', '#FF9800', 'happy', 'Happiness, celebration, and positive emotions', true),
  ('Sadness', '#5C6BC0', 'rainy', 'Melancholy, loss, and emotional depth', true),
  ('Fear', '#7E2A33', 'warning', 'Anxieties, worries, and facing the unknown', true),
  ('Hope', '#26A69A', 'sunny', 'Optimism, faith, and looking forward', true),
  ('Abstract', '#00BCD4', 'shapes', 'Creative, artistic, and conceptual thoughts', true),
  ('Loneliness', '#9E9E9E', 'person', 'Solitude, isolation, and introspection', true),
  ('Friendship', '#795548', 'people', 'Bonds, companionship, and social connections', true)
) AS t(name, color, icon, description, is_system_theme)
WHERE NOT EXISTS (
  SELECT 1 FROM public.themes WHERE themes.name = t.name
);

-- Check what type of ID the users table uses
DO $$
DECLARE
    user_id_type text;
    sample_user_id text;
BEGIN
    -- Get the data type of the id column in users table
    SELECT data_type INTO user_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'id';
    
    -- If users table exists and uses UUID
    IF user_id_type = 'uuid' THEN
        -- Insert sample users with UUIDs
        INSERT INTO public.users (id, username, display_name, email, is_anonymous, bio, total_whispers, total_likes_received) VALUES
          ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'moonwhisperer', 'Luna Starlight', 'luna@example.com', false, 'Dancing with words under moonlight', 5, 23),
          ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'dreamcatcher', 'River Song', 'river@example.com', false, 'Collecting dreams, one whisper at a time', 4, 18),
          ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'silentpoet', 'Anonymous Poet', null, true, null, 3, 15),
          ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'naturelover', 'Willow Green', 'willow@example.com', false, 'Finding poetry in every leaf', 4, 20),
          ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'midnightmuse', 'Midnight Writer', 'midnight@example.com', false, 'Writing when the world sleeps', 3, 12)
        ON CONFLICT (id) DO NOTHING;
        
        -- Set the sample user ID for whispers
        sample_user_id := '550e8400-e29b-41d4-a716-446655440001';
        
    -- If users table uses text/varchar (Clerk migration)
    ELSIF user_id_type IN ('text', 'character varying') THEN
        -- Insert sample users with text IDs
        INSERT INTO public.users (id, username, display_name, email, is_anonymous, bio, total_whispers, total_likes_received) VALUES
          ('user_sample_001', 'moonwhisperer', 'Luna Starlight', 'luna@example.com', false, 'Dancing with words under moonlight', 5, 23),
          ('user_sample_002', 'dreamcatcher', 'River Song', 'river@example.com', false, 'Collecting dreams, one whisper at a time', 4, 18),
          ('user_sample_003', 'silentpoet', 'Anonymous Poet', null, true, null, 3, 15),
          ('user_sample_004', 'naturelover', 'Willow Green', 'willow@example.com', false, 'Finding poetry in every leaf', 4, 20),
          ('user_sample_005', 'midnightmuse', 'Midnight Writer', 'midnight@example.com', false, 'Writing when the world sleeps', 3, 12)
        ON CONFLICT (id) DO NOTHING;
        
        -- Set the sample user ID for whispers
        sample_user_id := 'user_sample_001';
    END IF;
END $$;

-- Insert sample whispers (only if whispers table is empty)
INSERT INTO public.whispers (id, user_id, theme_id, original_text, transformed_text, likes_count, chain_count, created_at)
SELECT 
    uuid_generate_v4(),
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'uuid')
        THEN '550e8400-e29b-41d4-a716-446655440001'::uuid::text
        ELSE 'user_sample_001'
    END,
    t.id,
    w.original_text,
    w.transformed_text,
    w.likes_count,
    w.chain_count,
    w.created_at
FROM (VALUES
    ('I miss the way you laugh at my bad jokes', 'In echoes of laughter, where bad jokes bloom like wildflowers, I search for the melody of your joy', 8, 2, NOW() - INTERVAL '2 days'),
    ('Your smile makes everything better', 'In the curve of your smile, universes unfold, and broken things learn to dance again', 12, 3, NOW() - INTERVAL '3 days'),
    ('I dreamt I could fly above the clouds', 'Above cotton castles in the sky, my wings remember what my feet forgot', 6, 1, NOW() - INTERVAL '1 day'),
    ('Sometimes I dream in colors that don''t exist', 'My dreams paint with impossible hues, creating rainbows the waking world has never seen', 9, 2, NOW() - INTERVAL '4 days'),
    ('The trees whisper secrets in the wind', 'Ancient guardians speak in rustling tongues, their wisdom scattered on autumn''s breath', 7, 2, NOW() - INTERVAL '5 days'),
    ('Rain sounds like the earth is crying happy tears', 'Sky''s joy falls in silver symphonies, each drop a celebration of earth''s embrace', 10, 1, NOW() - INTERVAL '6 days'),
    ('Some days feel heavier than others', 'Today wears lead shoes, tomorrow might learn to float', 5, 2, NOW() - INTERVAL '7 days'),
    ('I collect my tears in invisible jars', 'Crystal vessels line my soul''s shelves, each holding storms that passed through me', 8, 1, NOW() - INTERVAL '8 days'),
    ('Tomorrow might be the day everything changes', 'On tomorrow''s horizon, possibility dances with dawn, painting new worlds in morning light', 11, 3, NOW() - INTERVAL '9 days'),
    ('Even broken things can grow flowers', 'Through cracks in my foundation, wildflowers find their way to sun', 15, 4, NOW() - INTERVAL '10 days')
) AS w(original_text, transformed_text, likes_count, chain_count, created_at),
LATERAL (
    SELECT id FROM public.themes 
    WHERE name = CASE 
        WHEN w.original_text LIKE '%laugh%' OR w.original_text LIKE '%smile%' THEN 'Love'
        WHEN w.original_text LIKE '%dream%' OR w.original_text LIKE '%fly%' THEN 'Dreams'
        WHEN w.original_text LIKE '%trees%' OR w.original_text LIKE '%rain%' THEN 'Nature'
        WHEN w.original_text LIKE '%tears%' OR w.original_text LIKE '%heavier%' THEN 'Sadness'
        WHEN w.original_text LIKE '%tomorrow%' OR w.original_text LIKE '%broken%' THEN 'Hope'
        ELSE 'Abstract'
    END
    LIMIT 1
) AS t
WHERE NOT EXISTS (
    SELECT 1 FROM public.whispers WHERE original_text = w.original_text
);

-- Display summary
SELECT 
    'Data insertion complete!' as status,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.whispers) as total_whispers,
    (SELECT COUNT(*) FROM public.themes) as total_themes;