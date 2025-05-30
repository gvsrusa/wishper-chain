-- Diagnose the users table constraints and fix the issue

-- Step 1: Check all constraints on the users table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'public.users'::regclass;

-- Step 2: Check if auth.users table exists (Supabase Auth)
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) as auth_users_exists;

-- Step 3: Drop the problematic foreign key constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 4: If you're not using Supabase Auth, let's insert sample users without auth dependency
-- First, let's check and potentially modify the users table
DO $$
BEGIN
    -- Check if the table has the problematic constraint
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'users_id_fkey' 
        AND conrelid = 'public.users'::regclass
    ) THEN
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT users_id_fkey';
        RAISE NOTICE 'Dropped users_id_fkey constraint';
    END IF;
    
    -- Check if clerk_user_id column exists (from Clerk migration)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'clerk_user_id'
    ) THEN
        -- Make clerk_user_id nullable if it's not
        EXECUTE 'ALTER TABLE public.users ALTER COLUMN clerk_user_id DROP NOT NULL';
        RAISE NOTICE 'Made clerk_user_id nullable';
    END IF;
END $$;

-- Step 5: Now insert the sample users
INSERT INTO public.users (id, username, display_name, email, is_anonymous, bio, total_whispers, total_likes_received) VALUES
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'moonwhisperer', 'Luna Starlight', 'luna@example.com', false, 'Dancing with words under moonlight', 5, 23),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'dreamcatcher', 'River Song', 'river@example.com', false, 'Collecting dreams, one whisper at a time', 4, 18),
    ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'silentpoet', 'Anonymous Poet', null, true, null, 3, 15),
    ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'naturelover', 'Willow Green', 'willow@example.com', false, 'Finding poetry in every leaf', 4, 20),
    ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'midnightmuse', 'Midnight Writer', 'midnight@example.com', false, 'Writing when the world sleeps', 3, 12)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email;

-- Step 6: Verify users were inserted
SELECT id, username, display_name FROM public.users LIMIT 5;

-- Step 7: Now insert whispers with the existing users
INSERT INTO public.whispers (id, user_id, theme_id, original_text, transformed_text, likes_count, chain_count, created_at)
SELECT 
    uuid_generate_v4(),
    u.id,
    t.id,
    w.original_text,
    w.transformed_text,
    w.likes_count,
    w.chain_count,
    w.created_at
FROM (VALUES
    ('moonwhisperer', 'I miss the way you laugh at my bad jokes', 'In echoes of laughter, where bad jokes bloom like wildflowers, I search for the melody of your joy', 8, 2, NOW() - INTERVAL '2 days', 'Love'),
    ('dreamcatcher', 'Your smile makes everything better', 'In the curve of your smile, universes unfold, and broken things learn to dance again', 12, 3, NOW() - INTERVAL '3 days', 'Love'),
    ('silentpoet', 'I dreamt I could fly above the clouds', 'Above cotton castles in the sky, my wings remember what my feet forgot', 6, 1, NOW() - INTERVAL '1 day', 'Dreams'),
    ('moonwhisperer', 'Sometimes I dream in colors that don''t exist', 'My dreams paint with impossible hues, creating rainbows the waking world has never seen', 9, 2, NOW() - INTERVAL '4 days', 'Dreams'),
    ('naturelover', 'The trees whisper secrets in the wind', 'Ancient guardians speak in rustling tongues, their wisdom scattered on autumn''s breath', 7, 2, NOW() - INTERVAL '5 days', 'Nature'),
    ('naturelover', 'Rain sounds like the earth is crying happy tears', 'Sky''s joy falls in silver symphonies, each drop a celebration of earth''s embrace', 10, 1, NOW() - INTERVAL '6 days', 'Nature'),
    ('midnightmuse', 'Some days feel heavier than others', 'Today wears lead shoes, tomorrow might learn to float', 5, 2, NOW() - INTERVAL '7 days', 'Sadness'),
    ('dreamcatcher', 'I collect my tears in invisible jars', 'Crystal vessels line my soul''s shelves, each holding storms that passed through me', 8, 1, NOW() - INTERVAL '8 days', 'Sadness'),
    ('midnightmuse', 'Tomorrow might be the day everything changes', 'On tomorrow''s horizon, possibility dances with dawn, painting new worlds in morning light', 11, 3, NOW() - INTERVAL '9 days', 'Hope'),
    ('moonwhisperer', 'Even broken things can grow flowers', 'Through cracks in my foundation, wildflowers find their way to sun', 15, 4, NOW() - INTERVAL '10 days', 'Hope')
) AS w(username, original_text, transformed_text, likes_count, chain_count, created_at, theme_name)
JOIN public.users u ON u.username = w.username
JOIN public.themes t ON t.name = w.theme_name
WHERE NOT EXISTS (
    SELECT 1 FROM public.whispers WHERE original_text = w.original_text
);

-- Step 8: Display final summary
SELECT 
    'Data insertion complete!' as status,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.whispers) as total_whispers,
    (SELECT COUNT(*) FROM public.themes) as total_themes;