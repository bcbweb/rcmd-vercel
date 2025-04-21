-- Function to check if another function exists (for debugging)
CREATE OR REPLACE FUNCTION public.does_function_exist(function_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_proc
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE pg_proc.proname = function_name
    AND pg_namespace.nspname = 'public'
  );
END;
$$;

-- Grant execution to anon users
GRANT EXECUTE ON FUNCTION public.does_function_exist TO anon;
GRANT EXECUTE ON FUNCTION public.does_function_exist TO authenticated;
GRANT EXECUTE ON FUNCTION public.does_function_exist TO service_role;

-- Function to fetch public RCMDs for a profile bypassing RLS
CREATE OR REPLACE FUNCTION public.get_public_rcmds_for_profile(profile_id_param uuid)
RETURNS SETOF rcmds
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- First try profile_id (new schema)
  SELECT * FROM rcmds 
  WHERE profile_id = profile_id_param
  
  UNION ALL
  
  -- Then try owner_id (legacy schema), excluding any that already matched profile_id
  SELECT * FROM rcmds 
  WHERE owner_id = profile_id_param 
  AND NOT EXISTS (
    SELECT 1 FROM rcmds r2 
    WHERE r2.profile_id = profile_id_param 
    AND r2.id = rcmds.id
  )
  
  ORDER BY created_at DESC;
$$;

-- Grant execution to anon users
GRANT EXECUTE ON FUNCTION public.get_public_rcmds_for_profile TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_rcmds_for_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_rcmds_for_profile TO service_role;

-- Add a similar function for links
CREATE OR REPLACE FUNCTION public.get_public_links_for_profile(profile_id_param uuid)
RETURNS SETOF links
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- First try profile_id (new schema)
  SELECT * FROM links 
  WHERE profile_id = profile_id_param
  
  UNION ALL
  
  -- Then try owner_id (legacy schema), excluding any that already matched profile_id
  SELECT * FROM links 
  WHERE owner_id = profile_id_param 
  AND NOT EXISTS (
    SELECT 1 FROM links l2 
    WHERE l2.profile_id = profile_id_param 
    AND l2.id = links.id
  )
  
  ORDER BY created_at DESC;
$$;

-- Grant execution to anon users
GRANT EXECUTE ON FUNCTION public.get_public_links_for_profile TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_links_for_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_links_for_profile TO service_role; 