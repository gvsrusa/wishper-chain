-- Part 4: Process existing whispers (optional - run if you want to extract hashtags from existing content)

-- This will process all existing published whispers to extract any hashtags they contain
DO $$
DECLARE
    whisper RECORD;
    processed_count INTEGER := 0;
BEGIN
    FOR whisper IN 
        SELECT id, original_text, transformed_text 
        FROM whispers 
        WHERE is_published = true
    LOOP
        PERFORM process_whisper_hashtags(
            whisper.id,
            COALESCE(whisper.original_text, '') || ' ' || COALESCE(whisper.transformed_text, '')
        );
        processed_count := processed_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Processed % whispers for hashtags', processed_count;
END $$;