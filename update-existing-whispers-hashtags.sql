-- First, ensure the ai_hashtags column exists
ALTER TABLE whispers 
ADD COLUMN IF NOT EXISTS ai_hashtags TEXT[] DEFAULT '{}';

-- Create index for hashtag searching
CREATE INDEX IF NOT EXISTS idx_whispers_ai_hashtags ON whispers USING GIN(ai_hashtags);

-- Function to generate hashtags based on whisper content
CREATE OR REPLACE FUNCTION generate_hashtags_for_whisper(original_text TEXT, transformed_text TEXT, created_at TIMESTAMP)
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
        hashtags := hashtags || '#LateNightThoughts';
    ELSIF hour_of_day >= 4 AND hour_of_day <= 6 THEN
        hashtags := hashtags || '#EarlyMorningWhispers';
    ELSIF hour_of_day >= 17 AND hour_of_day <= 19 THEN
        hashtags := hashtags || '#EveningReflections';
    END IF;
    
    -- Emotion-based hashtags
    IF combined_text LIKE '%love%' OR combined_text LIKE '%heart%' THEN
        hashtags := hashtags || '#LoveWhispers';
    END IF;
    
    IF combined_text LIKE '%dream%' OR combined_text LIKE '%sleep%' THEN
        hashtags := hashtags || '#DreamScape';
    END IF;
    
    IF combined_text LIKE '%sad%' OR combined_text LIKE '%cry%' OR combined_text LIKE '%tear%' THEN
        hashtags := hashtags || '#EmotionalRelease';
    END IF;
    
    IF combined_text LIKE '%happy%' OR combined_text LIKE '%joy%' OR combined_text LIKE '%smile%' THEN
        hashtags := hashtags || '#JoyfulMoments';
    END IF;
    
    IF combined_text LIKE '%miss%' OR combined_text LIKE '%memory%' OR combined_text LIKE '%remember%' THEN
        hashtags := hashtags || '#Nostalgia';
    END IF;
    
    IF combined_text LIKE '%hope%' OR combined_text LIKE '%wish%' OR combined_text LIKE '%future%' THEN
        hashtags := hashtags || '#HopefulWhispers';
    END IF;
    
    IF combined_text LIKE '%fear%' OR combined_text LIKE '%scared%' OR combined_text LIKE '%afraid%' THEN
        hashtags := hashtags || '#FacingFears';
    END IF;
    
    -- Content-based hashtags
    IF combined_text LIKE '%confession%' OR combined_text LIKE '%secret%' THEN
        hashtags := hashtags || '#SecretConfessions';
    END IF;
    
    IF combined_text LIKE '%soul%' OR combined_text LIKE '%spirit%' THEN
        hashtags := hashtags || '#SoulSearching';
    END IF;
    
    IF combined_text LIKE '%quiet%' OR combined_text LIKE '%silence%' OR combined_text LIKE '%peace%' THEN
        hashtags := hashtags || '#QuietMoments';
    END IF;
    
    IF combined_text LIKE '%feeling%' OR combined_text LIKE '%emotion%' THEN
        hashtags := hashtags || '#DeepFeels';
    END IF;
    
    IF combined_text LIKE '%voice%' OR combined_text LIKE '%speak%' OR combined_text LIKE '%say%' THEN
        hashtags := hashtags || '#InnerVoice';
    END IF;
    
    -- Length-based hashtags
    IF array_length(hashtags, 1) IS NULL OR array_length(hashtags, 1) = 0 THEN
        IF LENGTH(original_text) < 50 THEN
            hashtags := hashtags || '#BriefThoughts';
        ELSIF LENGTH(original_text) > 200 THEN
            hashtags := hashtags || '#DeepContemplation';
        ELSE
            hashtags := hashtags || '#RandomWhispers';
        END IF;
    END IF;
    
    -- Limit to 3 hashtags
    IF array_length(hashtags, 1) > 3 THEN
        hashtags := hashtags[1:3];
    END IF;
    
    RETURN hashtags;
END;
$$ LANGUAGE plpgsql;

-- Update all existing whispers with AI-generated hashtags
UPDATE whispers
SET ai_hashtags = generate_hashtags_for_whisper(original_text, transformed_text, created_at)
WHERE is_published = true AND (ai_hashtags IS NULL OR array_length(ai_hashtags, 1) = 0);

-- Create the function for getting trending hashtags
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

-- Show the results
SELECT hashtag, count FROM get_trending_hashtags(30, 10);

-- Show sample whispers with their hashtags
SELECT id, substring(original_text, 1, 50) as text_preview, ai_hashtags 
FROM whispers 
WHERE ai_hashtags IS NOT NULL AND array_length(ai_hashtags, 1) > 0
LIMIT 10;