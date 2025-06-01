-- Create hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create hashtag_usage table to track which whispers use which hashtags
CREATE TABLE IF NOT EXISTS hashtag_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
    whisper_id UUID REFERENCES whispers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(hashtag_id, whisper_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hashtag_usage_hashtag_id ON hashtag_usage(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_usage_whisper_id ON hashtag_usage(whisper_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_usage_created_at ON hashtag_usage(created_at DESC);

-- Create a view for trending hashtags (last 7 days)
CREATE OR REPLACE VIEW trending_hashtags AS
SELECT 
    h.id,
    h.tag,
    COUNT(hu.id) as usage_count,
    MAX(hu.created_at) as last_used_at
FROM hashtags h
INNER JOIN hashtag_usage hu ON h.id = hu.hashtag_id
WHERE hu.created_at > NOW() - INTERVAL '7 days'
GROUP BY h.id, h.tag
ORDER BY usage_count DESC, last_used_at DESC
LIMIT 20;

-- Create RLS policies for hashtags
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_usage ENABLE ROW LEVEL SECURITY;

-- Everyone can read hashtags
CREATE POLICY "Hashtags are viewable by everyone" ON hashtags
    FOR SELECT USING (true);

-- Everyone can read hashtag usage
CREATE POLICY "Hashtag usage is viewable by everyone" ON hashtag_usage
    FOR SELECT USING (true);

-- Only authenticated users can create hashtags
CREATE POLICY "Authenticated users can create hashtags" ON hashtags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can create hashtag usage
CREATE POLICY "Authenticated users can create hashtag usage" ON hashtag_usage
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

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

-- Trigger to automatically process hashtags when a whisper is created or updated
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

-- Create trigger
DROP TRIGGER IF EXISTS process_hashtags_on_whisper ON whispers;
CREATE TRIGGER process_hashtags_on_whisper
    AFTER INSERT OR UPDATE OF original_text, transformed_text ON whispers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_process_whisper_hashtags();

-- Process existing whispers for hashtags (run once)
DO $$
DECLARE
    whisper RECORD;
BEGIN
    FOR whisper IN SELECT id, original_text, transformed_text FROM whispers WHERE is_published = true
    LOOP
        PERFORM process_whisper_hashtags(
            whisper.id,
            COALESCE(whisper.original_text, '') || ' ' || COALESCE(whisper.transformed_text, '')
        );
    END LOOP;
END $$;