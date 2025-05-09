-- Create a stored procedure to safely create a user profile
-- This function will be used as a fallback when direct insertion fails
CREATE OR REPLACE FUNCTION public.create_user_profile(
  auth_id UUID,
  username_param TEXT,
  profile_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_existing_id UUID;
BEGIN
  -- Generate a UUID if one wasn't provided
  IF profile_id_param IS NULL THEN
    v_profile_id := gen_random_uuid();
  ELSE
    v_profile_id := profile_id_param;
  END IF;
  
  -- Check if a profile already exists for this auth_user_id
  SELECT id INTO v_existing_id
  FROM profiles
  WHERE auth_user_id = auth_id;
  
  -- If profile exists, return the existing ID
  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;
  
  -- Create the profile with ON CONFLICT DO NOTHING to handle race conditions
  INSERT INTO profiles (
    id,
    auth_user_id,
    username,
    handle,
    created_at,
    updated_at,
    onboarding_completed,
    is_onboarded
  )
  VALUES (
    v_profile_id,
    auth_id,
    username_param,
    username_param,
    NOW(),
    NOW(),
    FALSE,
    FALSE
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  -- Check if our insert worked or if another concurrent process inserted
  SELECT id INTO v_existing_id
  FROM profiles
  WHERE auth_user_id = auth_id;
  
  -- Return either our profile ID or the one from a concurrent insert
  RETURN v_existing_id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO service_role;

-- Add a comment explaining the function
COMMENT ON FUNCTION public.create_user_profile IS 'Safely creates a user profile, handling race conditions';

-- Add an index to improve performance of auth_user_id lookups
CREATE INDEX IF NOT EXISTS profiles_auth_user_id_idx ON profiles(auth_user_id);

-- Ensure auth_user_id is unique to prevent duplicate profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'profiles_auth_user_id_key' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Warning: Could not add unique constraint to auth_user_id: %', SQLERRM;
END $$; 