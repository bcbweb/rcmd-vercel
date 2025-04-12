-- Debug query to check the profile_pages table
CREATE OR REPLACE FUNCTION public.debug_profile_pages(p_profile_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_pages_count INTEGER;
  v_auth_user_id TEXT;
BEGIN
  -- Get authenticated user
  v_auth_user_id := auth.uid();
  
  -- Count pages
  SELECT COUNT(*) INTO v_pages_count 
  FROM profile_pages 
  WHERE profile_id = p_profile_id;
  
  -- Build result
  SELECT jsonb_build_object(
    'profile_id', p_profile_id,
    'auth_user_id', v_auth_user_id,
    'pages_count', v_pages_count,
    'first_page', (
      SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'created_at', created_at
      )
      FROM profile_pages
      WHERE profile_id = p_profile_id
      ORDER BY created_at ASC
      LIMIT 1
    ),
    'all_pages', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'created_at', created_at
        )
      )
      FROM profile_pages
      WHERE profile_id = p_profile_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Add a comment
COMMENT ON FUNCTION public.debug_profile_pages IS 'Helper function to debug profile pages'; 