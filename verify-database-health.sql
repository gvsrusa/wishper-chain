-- VERIFY DATABASE HEALTH
-- Run this script to ensure your database is properly configured

-- 1. Core Tables Check
SELECT 'CORE TABLES CHECK' as section;
WITH required_tables AS (
    SELECT unnest(ARRAY['users', 'themes', 'whispers', 'chain_responses', 'likes']) as table_name
)
SELECT 
    rt.table_name,
    CASE WHEN it.table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM required_tables rt
LEFT JOIN information_schema.tables it 
    ON rt.table_name = it.table_name 
    AND it.table_schema = 'public'
ORDER BY rt.table_name;

-- 2. Users Table Structure Check
SELECT 'USERS TABLE STRUCTURE' as section;
WITH required_columns AS (
    SELECT column_name, expected_type FROM (VALUES
        ('id', 'uuid'),
        ('clerk_user_id', 'text'),
        ('username', 'text'),
        ('email', 'text'),
        ('display_name', 'text'),
        ('is_anonymous', 'boolean')
    ) AS t(column_name, expected_type)
)
SELECT 
    rc.column_name,
    rc.expected_type,
    ic.data_type as actual_type,
    CASE 
        WHEN ic.data_type = rc.expected_type THEN '✅ CORRECT'
        WHEN ic.data_type IS NULL THEN '❌ MISSING'
        ELSE '⚠️ WRONG TYPE'
    END as status
FROM required_columns rc
LEFT JOIN information_schema.columns ic 
    ON rc.column_name = ic.column_name 
    AND ic.table_name = 'users'
    AND ic.table_schema = 'public'
ORDER BY rc.column_name;

-- 3. Required Functions Check
SELECT 'REQUIRED FUNCTIONS' as section;
SELECT 
    'upsert_user_from_clerk' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'upsert_user_from_clerk' 
            AND routine_schema = 'public'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 4. Test User Sync Function
SELECT 'TEST USER SYNC' as section;
SELECT * FROM upsert_user_from_clerk(
    'test_health_check_' || extract(epoch from now())::text,
    'healthcheck@test.com',
    'healthcheck_user',
    'Health',
    'Check',
    'Health Check User',
    null
) as test_result;

-- Clean up test user
DELETE FROM users WHERE email = 'healthcheck@test.com';

-- 5. Constraints Check
SELECT 'CONSTRAINTS CHECK' as section;
SELECT 
    conname as constraint_name,
    CASE contype 
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
    END as constraint_type,
    '✅' as status
FROM pg_constraint
WHERE conrelid = 'users'::regclass
ORDER BY contype, conname;

-- 6. Sample Data Check
SELECT 'SAMPLE DATA CHECK' as section;
SELECT 
    (SELECT COUNT(*) FROM users) as user_count,
    (SELECT COUNT(*) FROM themes) as theme_count,
    (SELECT COUNT(*) FROM whispers) as whisper_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM users) > 0 THEN '✅ HAS DATA'
        ELSE '⚠️ NO DATA'
    END as status;

-- 7. RLS Status Check
SELECT 'RLS STATUS CHECK' as section;
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '⚠️ DISABLED'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('users', 'whispers', 'themes', 'chain_responses', 'likes')
ORDER BY tablename;

-- 8. Overall Health Summary
SELECT 'OVERALL HEALTH SUMMARY' as section;
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) = 5 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'themes', 'whispers', 'chain_responses', 'likes')
        ) AND EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'upsert_user_from_clerk' 
            AND routine_schema = 'public'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'clerk_user_id' 
            AND data_type = 'text'
        ) THEN '✅ DATABASE IS HEALTHY AND READY FOR CLERK INTEGRATION'
        ELSE '❌ DATABASE NEEDS ATTENTION - Check sections above'
    END as overall_status;