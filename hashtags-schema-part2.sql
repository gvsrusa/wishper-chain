-- Part 2: Create functions (safe to run)

-- Function to extract hashtags from text
CREATE OR REPLACE FUNCTION extract_hashtags(text_content TEXT)
RETURNS TEXT[] AS $$
DECLARE
    hashtags TEXT[];
BEGIN
    -- Extract hashtags using regex pattern
    -- Matches hashtags that start with # followed by alphanumeric characters (including unicode)
    SELECT ARRAY(
        SELECT DISTINCT lower(match[1])
        FROM regexp_matches(text_content, '#([A-Za-z0-9_]+)', 'g') AS match
    ) INTO hashtags;
    
    RETURN hashtags;
END;
$$ LANGUAGE plpgsql;

-- Function to process hashtags for a whisper
CREATE OR REPLACE FUNCTION process_whisper_hashtags(whisper_id UUID, text_content TEXT)
RETURNS VOID AS $$
DECLARE
    extracted_tags TEXT[];
    tag TEXT;
    hashtag_id UUID;
BEGIN
    -- Extract hashtags from text
    extracted_tags := extract_hashtags(text_content);
    
    -- Process each hashtag
    FOREACH tag IN ARRAY extracted_tags
    LOOP
        -- Insert hashtag if it doesn't exist
        INSERT INTO hashtags (tag)
        VALUES (tag)
        ON CONFLICT (tag) DO NOTHING;
        
        -- Get hashtag ID
        SELECT id INTO hashtag_id FROM hashtags WHERE hashtags.tag = tag;
        
        -- Insert hashtag usage
        INSERT INTO hashtag_usage (hashtag_id, whisper_id)
        VALUES (hashtag_id, whisper_id)
        ON CONFLICT (hashtag_id, whisper_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically process hashtags when a whisper is created or updated
CREATE OR REPLACE FUNCTION trigger_process_whisper_hashtags()
RETURNS TRIGGER AS $$
BEGIN
    -- Process hashtags from both original and transformed text
    PERFORM process_whisper_hashtags(
        NEW.id, 
        COALESCE(NEW.original_text, '') || ' ' || COALESCE(NEW.transformed_text, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;