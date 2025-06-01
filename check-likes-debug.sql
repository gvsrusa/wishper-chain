-- Debug SQL queries for checking likes functionality

-- 1. Check all likes in the database
SELECT 
    l.id,
    l.whisper_id,
    l.user_id,
    l.created_at,
    u.username,
    u.email,
    w.transformed_text
FROM likes l
LEFT JOIN users u ON l.user_id = u.id
LEFT JOIN whispers w ON l.whisper_id = w.id
ORDER BY l.created_at DESC;

-- 2. Check likes for a specific user (replace with your user ID)
-- You can find your user ID by checking the users table with your email
SELECT 
    l.*,
    w.transformed_text,
    w.likes_count
FROM likes l
JOIN whispers w ON l.whisper_id = w.id
WHERE l.user_id = 'YOUR_USER_ID_HERE'
ORDER BY l.created_at DESC;

-- 3. Find your user ID by email
SELECT id, clerk_user_id, email, username 
FROM users 
WHERE email = 'YOUR_EMAIL_HERE';

-- 4. Check likes count vs actual likes for whispers
SELECT 
    w.id,
    w.transformed_text,
    w.likes_count as stored_count,
    COUNT(l.id) as actual_count,
    CASE 
        WHEN w.likes_count != COUNT(l.id) THEN 'MISMATCH!'
        ELSE 'OK'
    END as status
FROM whispers w
LEFT JOIN likes l ON w.id = l.whisper_id
GROUP BY w.id, w.transformed_text, w.likes_count
HAVING w.likes_count != COUNT(l.id) OR COUNT(l.id) > 0
ORDER BY w.created_at DESC;

-- 5. Check if there are any duplicate likes (same user liking same whisper multiple times)
SELECT 
    user_id,
    whisper_id,
    COUNT(*) as like_count
FROM likes
GROUP BY user_id, whisper_id
HAVING COUNT(*) > 1;

-- 6. Monitor likes table in real-time (run this multiple times to see changes)
SELECT 
    l.id,
    l.whisper_id,
    l.user_id,
    l.created_at,
    u.username,
    w.transformed_text as whisper_preview
FROM likes l
JOIN users u ON l.user_id = u.id
JOIN whispers w ON l.whisper_id = w.id
ORDER BY l.created_at DESC
LIMIT 10;

-- 7. Check the structure of the likes table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'likes'
ORDER BY ordinal_position;

-- 8. Check if there are any constraints on the likes table
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'likes';