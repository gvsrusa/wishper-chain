-- Part 1: Create tables and indexes (safe to run)

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