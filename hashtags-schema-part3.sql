-- Part 3: Create trigger (this part triggers the warning)
-- Check if trigger exists first
SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'process_hashtags_on_whisper';

-- If the above returns 1, you can safely run this to update it:
DROP TRIGGER IF EXISTS process_hashtags_on_whisper ON whispers;

-- Create the trigger
CREATE TRIGGER process_hashtags_on_whisper
    AFTER INSERT OR UPDATE OF original_text, transformed_text ON whispers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_process_whisper_hashtags();