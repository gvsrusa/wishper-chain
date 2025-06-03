-- ALIGN DATABASE WITH CLERK INTEGRATION
-- This script ensures your database is properly configured for Clerk while maintaining UUID structure

-- 1. Check current state
SELECT 'Current Database State' as section;
SELECT 
    'Users table ID type' as check_item,
    data_type as current_value,
    CASE 
        WHEN data_type = 'uuid' THEN 'Good - using UUID'
        ELSE 'Issue - should be UUID'
    END as status
FROM information_schema.columns
WHERE table_name = 'users' 
    AND column_name = 'id'
    AND table_schema = 'public';

-- 2. Ensure all required columns exist
DO $$
BEGIN
    -- Add clerk_user_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'clerk_user_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN clerk_user_id TEXT UNIQUE NOT NULL;
        CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
    END IF;
    
    -- Add first_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'first_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN first_name TEXT;
    END IF;
    
    -- Add last_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN last_name TEXT;
    END IF;
    
    -- Add theme_preference if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'theme_preference'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN theme_preference TEXT DEFAULT 'dark';
    END IF;
    
    -- Add notification_settings if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'notification_settings'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN notification_settings JSONB DEFAULT '{}';
    END IF;
END $$;

-- 3. Drop and recreate the upsert function with proper error handling
DROP FUNCTION IF EXISTS public.upsert_user_from_clerk CASCADE;

CREATE OR REPLACE FUNCTION public.upsert_user_from_clerk(
    p_clerk_user_id text, 
    p_email text, 
    p_username text, 
    p_first_name text, 
    p_last_name text, 
    p_display_name text, 
    p_avatar_url text
)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user public.users;
  v_generated_username TEXT;
  v_is_anonymous BOOLEAN;
BEGIN
  -- Log input for debugging
  RAISE NOTICE 'upsert_user_from_clerk called with clerk_id: %, email: %', p_clerk_user_id, p_email;
  
  -- Validate required parameters
  IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
    RAISE EXCEPTION 'clerk_user_id is required';
  END IF;
  
  -- Determine if user is anonymous
  v_is_anonymous := CASE 
    WHEN p_email IS NULL THEN false
    WHEN p_email LIKE '%@whisperchain.app%' THEN true
    ELSE false
  END;

  -- Generate username if not provided
  IF p_username IS NULL OR p_username = '' THEN
    IF p_email IS NOT NULL AND p_email != '' THEN
      v_generated_username := LOWER(SPLIT_PART(p_email, '@', 1));
    ELSE
      v_generated_username := 'user_' || SUBSTR(p_clerk_user_id, -6);
    END IF;
    
    -- Add random suffix if username exists
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_generated_username) LOOP
      v_generated_username := v_generated_username || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
    END LOOP;
  ELSE
    v_generated_username := p_username;
  END IF;

  -- Try to find user by clerk_user_id first
  SELECT * INTO v_user FROM public.users WHERE clerk_user_id = p_clerk_user_id;
  
  IF v_user.id IS NULL THEN
    -- Insert new user with generated UUID
    INSERT INTO public.users (
      id,
      clerk_user_id,
      email,
      username,
      display_name,
      first_name,
      last_name,
      avatar_url,
      is_anonymous,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_clerk_user_id,
      p_email,
      v_generated_username,
      COALESCE(
        p_display_name, 
        NULLIF(TRIM(CONCAT(p_first_name, ' ', p_last_name)), ''), 
        v_generated_username
      ),
      p_first_name,
      p_last_name,
      p_avatar_url,
      v_is_anonymous,
      NOW(),
      NOW()
    )
    RETURNING * INTO v_user;
    
    RAISE NOTICE 'Created new user with id: %, clerk_id: %', v_user.id, v_user.clerk_user_id;
  ELSE
    -- Update existing user (preserve existing data)
    UPDATE public.users SET
      email = COALESCE(p_email, email),
      username = COALESCE(username, v_generated_username),
      display_name = COALESCE(p_display_name, display_name),
      first_name = COALESCE(p_first_name, first_name),
      last_name = COALESCE(p_last_name, last_name),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      updated_at = NOW(),
      last_seen = NOW()
    WHERE clerk_user_id = p_clerk_user_id
    RETURNING * INTO v_user;
    
    RAISE NOTICE 'Updated existing user with id: %, clerk_id: %', v_user.id, v_user.clerk_user_id;
  END IF;

  RETURN v_user;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle unique constraint violations
    RAISE NOTICE 'Unique constraint violation for clerk_id: %', p_clerk_user_id;
    -- Try to return existing user
    SELECT * INTO v_user FROM public.users WHERE clerk_user_id = p_clerk_user_id;
    IF v_user.id IS NOT NULL THEN
      RETURN v_user;
    ELSE
      RAISE;
    END IF;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in upsert_user_from_clerk: %', SQLERRM;
    RAISE;
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.upsert_user_from_clerk TO anon, authenticated;

-- 4. Check and fix any missing foreign key relationships
DO $$
BEGIN
    -- Check if whispers table has proper foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'whispers' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'whispers_user_id_fkey'
        AND table_name = 'whispers'
    ) THEN
        ALTER TABLE whispers 
        ADD CONSTRAINT whispers_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Enable RLS if needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies if they don't exist
DO $$
BEGIN
    -- Allow users to read all user profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can view all profiles'
    ) THEN
        CREATE POLICY "Users can view all profiles" ON users
            FOR SELECT USING (true);
    END IF;
    
    -- Allow users to update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (
                auth.uid()::text = clerk_user_id OR
                auth.jwt() ->> 'sub' = clerk_user_id
            );
    END IF;
END $$;

-- 7. Final verification
SELECT 'Database Alignment Complete' as status;

-- Show current state
SELECT 
    'Table' as object_type,
    table_name as name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'themes', 'whispers', 'chain_responses', 'likes')

UNION ALL

SELECT 
    'Function' as object_type,
    routine_name as name,
    'EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'upsert_user_from_clerk'

UNION ALL

SELECT 
    'Index' as object_type,
    indexname as name,
    'EXISTS' as status
FROM pg_indexes
WHERE tablename = 'users'
AND indexname LIKE '%clerk%'

ORDER BY object_type, name;