-- Step 1: Add the ai_hashtags column if it doesn't exist
ALTER TABLE whispers 
ADD COLUMN IF NOT EXISTS ai_hashtags TEXT[] DEFAULT '{}';

-- Step 2: Create index for hashtag searching
CREATE INDEX IF NOT EXISTS idx_whispers_ai_hashtags ON whispers USING GIN(ai_hashtags);

-- Step 3: Create the function to generate hashtags FIRST (before using it)
CREATE OR REPLACE FUNCTION generate_hashtags_for_whisper(original_text TEXT, transformed_text TEXT, created_at TIMESTAMP WITH TIME ZONE)
RETURNS TEXT[] AS $$
DECLARE
    hashtags TEXT[] := '{}';
    combined_text TEXT;
    hour_of_day INTEGER;
BEGIN
    combined_text := LOWER(COALESCE(original_text, '') || ' ' || COALESCE(transformed_text, ''));
    hour_of_day := EXTRACT(HOUR FROM created_at);
    
    -- Time-based hashtags
    IF hour_of_day >= 22 OR hour_of_day <= 3 THEN
        hashtags := hashtags || '#latenightthoughts';
    ELSIF hour_of_day >= 4 AND hour_of_day <= 6 THEN
        hashtags := hashtags || '#earlymorningwhispers';
    ELSIF hour_of_day >= 17 AND hour_of_day <= 19 THEN
        hashtags := hashtags || '#eveningreflections';
    END IF;
    
    -- Emotion-based hashtags
    IF combined_text LIKE '%love%' OR combined_text LIKE '%heart%' THEN
        hashtags := hashtags || '#lovewhispers';
    END IF;
    
    IF combined_text LIKE '%dream%' OR combined_text LIKE '%sleep%' THEN
        hashtags := hashtags || '#dreamscape';
    END IF;
    
    IF combined_text LIKE '%sad%' OR combined_text LIKE '%cry%' OR combined_text LIKE '%tear%' THEN
        hashtags := hashtags || '#emotionalrelease';
    END IF;
    
    IF combined_text LIKE '%happy%' OR combined_text LIKE '%joy%' OR combined_text LIKE '%smile%' THEN
        hashtags := hashtags || '#joyfulmoments';
    END IF;
    
    IF combined_text LIKE '%miss%' OR combined_text LIKE '%memory%' OR combined_text LIKE '%remember%' THEN
        hashtags := hashtags || '#nostalgia';
    END IF;
    
    IF combined_text LIKE '%hope%' OR combined_text LIKE '%wish%' OR combined_text LIKE '%future%' THEN
        hashtags := hashtags || '#hopefulwhispers';
    END IF;
    
    IF combined_text LIKE '%fear%' OR combined_text LIKE '%scared%' OR combined_text LIKE '%afraid%' THEN
        hashtags := hashtags || '#facingfears';
    END IF;
    
    -- Content-based hashtags
    IF combined_text LIKE '%confession%' OR combined_text LIKE '%secret%' THEN
        hashtags := hashtags || '#secretconfessions';
    END IF;
    
    IF combined_text LIKE '%soul%' OR combined_text LIKE '%spirit%' THEN
        hashtags := hashtags || '#soulsearching';
    END IF;
    
    IF combined_text LIKE '%quiet%' OR combined_text LIKE '%silence%' OR combined_text LIKE '%peace%' THEN
        hashtags := hashtags || '#quietmoments';
    END IF;
    
    IF combined_text LIKE '%feeling%' OR combined_text LIKE '%emotion%' THEN
        hashtags := hashtags || '#deepfeels';
    END IF;
    
    IF combined_text LIKE '%voice%' OR combined_text LIKE '%speak%' OR combined_text LIKE '%say%' THEN
        hashtags := hashtags || '#innervoice';
    END IF;
    
    -- Length-based hashtags
    IF array_length(hashtags, 1) IS NULL OR array_length(hashtags, 1) = 0 THEN
        IF LENGTH(original_text) < 50 THEN
            hashtags := hashtags || '#briefthoughts';
        ELSIF LENGTH(original_text) > 200 THEN
            hashtags := hashtags || '#deepcontemplation';
        ELSE
            hashtags := hashtags || '#randomwhispers';
        END IF;
    END IF;
    
    -- Limit to 3 hashtags
    IF array_length(hashtags, 1) > 3 THEN
        hashtags := hashtags[1:3];
    END IF;
    
    RETURN hashtags;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Now update all existing whispers with AI-generated hashtags
UPDATE whispers
SET ai_hashtags = generate_hashtags_for_whisper(original_text, transformed_text, created_at)
WHERE is_published = true AND (ai_hashtags IS NULL OR array_length(ai_hashtags, 1) = 0);

-- Step 5: Create the function for getting trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(days_back INTEGER DEFAULT 7, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(hashtag TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(ai_hashtags) as hashtag,
        COUNT(*) as count
    FROM whispers
    WHERE created_at > NOW() - INTERVAL '1 day' * days_back
        AND is_published = true
        AND ai_hashtags IS NOT NULL
        AND array_length(ai_hashtags, 1) > 0
    GROUP BY hashtag
    ORDER BY count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Show the results
SELECT 'Trending hashtags:' as info;
SELECT hashtag, count FROM get_trending_hashtags(30, 10);

-- Step 7: Show sample whispers with their hashtags
SELECT 'Sample whispers with hashtags:' as info;
SELECT 
    id, 
    substring(original_text, 1, 50) as text_preview, 
    ai_hashtags,
    created_at::date as date
FROM whispers 
WHERE ai_hashtags IS NOT NULL AND array_length(ai_hashtags, 1) > 0
ORDER BY created_at DESC
LIMIT 10;

-- Step 8: Show total counts
SELECT 'Statistics:' as info;
SELECT 
    COUNT(*) as total_whispers,
    COUNT(CASE WHEN ai_hashtags IS NOT NULL AND array_length(ai_hashtags, 1) > 0 THEN 1 END) as whispers_with_hashtags
FROM whispers
WHERE is_published = true;