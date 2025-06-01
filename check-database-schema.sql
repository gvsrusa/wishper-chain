-- Check current database schema for users table
-- Run this in Supabase SQL editor to verify if Clerk migration was applied

-- 1. Check the data type of the id column in users table
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name IN ('id', 'clerk_user_id')
ORDER BY ordinal_position;

-- 2. Check if users_backup table exists (indicates migration was run)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users_backup'
) AS migration_was_run;

-- 3. Check primary key constraint on users table
SELECT 
    c.column_name,
    c.data_type,
    tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_name = kcu.table_name 
    AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public' 
    AND c.table_name = 'users'
    AND tc.constraint_type = 'PRIMARY KEY';

-- 4. Check if there are any existing users and their ID format
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as uuid_format_ids,
    COUNT(CASE WHEN id::text LIKE 'user_%' THEN 1 END) as clerk_format_ids
FROM public.users;

-- 5. Show sample of user IDs (limit 5)
SELECT id, clerk_user_id, username, created_at 
FROM public.users 
LIMIT 5;