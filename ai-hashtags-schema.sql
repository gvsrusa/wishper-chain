-- AI-Generated Hashtags Schema

-- Add hashtags column to whispers table
ALTER TABLE whispers 
ADD COLUMN IF NOT EXISTS ai_hashtags TEXT[] DEFAULT '{}';

-- Create index for hashtag searching
CREATE INDEX IF NOT EXISTS idx_whispers_ai_hashtags ON whispers USING GIN(ai_hashtags);

-- Function to get trending hashtags
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

-- Function to get whispers by hashtag
CREATE OR REPLACE FUNCTION get_whispers_by_hashtag(search_hashtag TEXT)
RETURNS TABLE(whisper_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT id as whisper_id
    FROM whispers
    WHERE search_hashtag = ANY(ai_hashtags)
        AND is_published = true
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;