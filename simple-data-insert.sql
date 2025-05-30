-- Simple data insertion that works with existing tables
-- This avoids foreign key issues by checking what exists first

-- Step 1: Check if we have any users
DO $$
DECLARE
    user_count INTEGER;
    first_user_id TEXT;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users found. Please create at least one user first through your authentication system.';
    ELSE
        -- Get the first user's ID
        SELECT id::text INTO first_user_id FROM public.users LIMIT 1;
        RAISE NOTICE 'Found % users. Using first user ID: %', user_count, first_user_id;
        
        -- Insert themes if they don't exist
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
        
        -- Insert sample whispers using the existing user
        INSERT INTO public.whispers (user_id, theme_id, original_text, transformed_text, likes_count, chain_count, created_at)
        SELECT 
            first_user_id::uuid,  -- Cast to UUID if needed
            t.id,
            w.original_text,
            w.transformed_text,
            w.likes_count,
            w.chain_count,
            w.created_at
        FROM (VALUES
            ('I miss the way you laugh at my bad jokes', 'In echoes of laughter, where bad jokes bloom like wildflowers, I search for the melody of your joy', 8, 2, NOW() - INTERVAL '2 days', 'Love'),
            ('Your smile makes everything better', 'In the curve of your smile, universes unfold, and broken things learn to dance again', 12, 3, NOW() - INTERVAL '3 days', 'Love'),
            ('I dreamt I could fly above the clouds', 'Above cotton castles in the sky, my wings remember what my feet forgot', 6, 1, NOW() - INTERVAL '1 day', 'Dreams'),
            ('Sometimes I dream in colors that don''t exist', 'My dreams paint with impossible hues, creating rainbows the waking world has never seen', 9, 2, NOW() - INTERVAL '4 days', 'Dreams'),
            ('The trees whisper secrets in the wind', 'Ancient guardians speak in rustling tongues, their wisdom scattered on autumn''s breath', 7, 2, NOW() - INTERVAL '5 days', 'Nature'),
            ('Rain sounds like the earth is crying happy tears', 'Sky''s joy falls in silver symphonies, each drop a celebration of earth''s embrace', 10, 1, NOW() - INTERVAL '6 days', 'Nature'),
            ('Some days feel heavier than others', 'Today wears lead shoes, tomorrow might learn to float', 5, 2, NOW() - INTERVAL '7 days', 'Sadness'),
            ('I collect my tears in invisible jars', 'Crystal vessels line my soul''s shelves, each holding storms that passed through me', 8, 1, NOW() - INTERVAL '8 days', 'Sadness'),
            ('Tomorrow might be the day everything changes', 'On tomorrow''s horizon, possibility dances with dawn, painting new worlds in morning light', 11, 3, NOW() - INTERVAL '9 days', 'Hope'),
            ('Even broken things can grow flowers', 'Through cracks in my foundation, wildflowers find their way to sun', 15, 4, NOW() - INTERVAL '10 days', 'Hope')
        ) AS w(original_text, transformed_text, likes_count, chain_count, created_at, theme_name)
        JOIN public.themes t ON t.name = w.theme_name
        WHERE NOT EXISTS (
            SELECT 1 FROM public.whispers WHERE original_text = w.original_text
        );
    END IF;
END $$;

-- Display summary
SELECT 
    'Data check complete!' as status,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.whispers) as total_whispers,
    (SELECT COUNT(*) FROM public.themes) as total_themes;