-- Check what tables already exist in your database
-- Run this first to see the current state

-- List all tables in the public schema
SELECT 
    tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM 
    pg_tables 
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename;

-- Check if specific WhisperChain tables exist
SELECT 
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') as users_exists,
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whispers') as whispers_exists,
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'themes') as themes_exists,
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chain_responses') as chain_responses_exists,
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'likes') as likes_exists;

-- Check the structure of the users table if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
ORDER BY 
    ordinal_position;