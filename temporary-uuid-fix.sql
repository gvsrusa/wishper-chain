-- Temporary fix for UUID/TEXT mismatch issue
-- This modifies the users table to accept both UUID and TEXT formats

-- Option 1: If migration wasn't run, add clerk_user_id column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON public.users(clerk_user_id);

-- Option 2: Create a function to handle both ID formats
CREATE OR REPLACE FUNCTION public.upsert_user_from_clerk(
  p_clerk_user_id TEXT,
  p_email TEXT,
  p_username TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_display_name TEXT,
  p_avatar_url TEXT
) RETURNS public.users AS $$
DECLARE
  v_user public.users;
  v_generated_username TEXT;
BEGIN
  -- Generate username if not provided
  IF p_username IS NULL OR p_username = '' THEN
    v_generated_username := LOWER(SPLIT_PART(p_email, '@', 1));
    -- Add random suffix if username exists
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_generated_username) LOOP
      v_generated_username := LOWER(SPLIT_PART(p_email, '@', 1)) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
    END LOOP;
  ELSE
    v_generated_username := p_username;
  END IF;

  -- Try to find user by clerk_user_id first
  SELECT * INTO v_user FROM public.users WHERE clerk_user_id = p_clerk_user_id;
  
  IF v_user.id IS NULL THEN
    -- Insert new user
    INSERT INTO public.users (
      id,
      clerk_user_id,
      email,
      username,
      display_name,
      avatar_url,
      is_anonymous,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(), -- Generate UUID for id
      p_clerk_user_id,
      p_email,
      v_generated_username,
      COALESCE(p_display_name, p_first_name || ' ' || p_last_name, p_email),
      p_avatar_url,
      false,
      NOW(),
      NOW()
    )
    RETURNING * INTO v_user;
  ELSE
    -- Update existing user
    UPDATE public.users SET
      email = COALESCE(p_email, email),
      username = COALESCE(username, v_generated_username),
      display_name = COALESCE(p_display_name, display_name),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      updated_at = NOW(),
      last_seen = NOW()
    WHERE clerk_user_id = p_clerk_user_id
    RETURNING * INTO v_user;
  END IF;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_user_from_clerk TO anon, authenticated;