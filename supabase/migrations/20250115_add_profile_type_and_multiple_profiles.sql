-- Remove unique constraint on auth_user_id to allow multiple profiles per user
-- First, drop the existing unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'profiles_auth_user_id_key' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_auth_user_id_key;
  END IF;
END $$;

-- Add profile_type column to distinguish between business and creator profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'personal';

-- Update existing profiles to have a default type
-- We'll assume existing profiles are personal/content creator type
UPDATE public.profiles
SET profile_type = 'creator'
WHERE profile_type IS NULL OR profile_type = 'personal';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON public.profiles(profile_type);

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.profile_type IS 'Type of profile: personal, creator, or business';

-- Create a table to track the current active profile for each user
CREATE TABLE IF NOT EXISTS public.user_active_profiles (
  auth_user_id UUID NOT NULL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user_active_profile_user FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_active_profile_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS on user_active_profiles
ALTER TABLE public.user_active_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own active profile
CREATE POLICY user_active_profiles_select_policy ON public.user_active_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Create policy for users to insert their own active profile
CREATE POLICY user_active_profiles_insert_policy ON public.user_active_profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Create policy for users to update their own active profile
CREATE POLICY user_active_profiles_update_policy ON public.user_active_profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Create a function to set the active profile for a user
CREATE OR REPLACE FUNCTION public.set_active_profile(
  p_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  -- Get the authenticated user
  v_auth_user_id := auth.uid();
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Verify the profile belongs to the user
  SELECT auth_user_id INTO v_auth_user_id
  FROM profiles
  WHERE id = p_profile_id AND auth_user_id = v_auth_user_id;
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Profile does not belong to the authenticated user';
  END IF;
  
  -- Insert or update the active profile
  INSERT INTO user_active_profiles (auth_user_id, profile_id, updated_at)
  VALUES (v_auth_user_id, p_profile_id, NOW())
  ON CONFLICT (auth_user_id) 
  DO UPDATE SET 
    profile_id = p_profile_id,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.set_active_profile TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.set_active_profile IS 'Sets the active profile for the authenticated user';

