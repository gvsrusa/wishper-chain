-- Check for unpublished whispers
SELECT 
    id,
    user_id,
    original_text,
    is_published,
    created_at
FROM whispers
WHERE is_published = false
ORDER BY created_at DESC;

-- Check total counts
SELECT 
    COUNT(*) as total_whispers,
    COUNT(CASE WHEN is_published = true THEN 1 END) as published_whispers,
    COUNT(CASE WHEN is_published = false THEN 1 END) as unpublished_whispers
FROM whispers;