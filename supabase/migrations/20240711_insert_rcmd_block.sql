-- Create the insert_rcmd_block RPC function
CREATE OR REPLACE FUNCTION public.insert_rcmd_block(
  p_profile_id TEXT,
  p_rcmd_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id TEXT;
  v_display_order INT;
  v_profile_block_id TEXT;
  v_page_id TEXT;
  v_result JSONB;
  v_page_count INT;
BEGIN
  -- Get the authenticated user
  v_auth_user_id := auth.uid();
  
  -- First check if the profile exists
  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile ID cannot be null';
  END IF;
  
  -- Count pages for this profile
  SELECT COUNT(*) INTO v_page_count
  FROM profile_pages
  WHERE profile_id = p_profile_id;
  
  IF v_page_count = 0 THEN
    RAISE EXCEPTION 'No pages found for profile %. Please create a page first.', p_profile_id;
  END IF;
  
  -- Try to get the first page for the profile
  SELECT id INTO v_page_id
  FROM profile_pages
  WHERE profile_id = p_profile_id
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Double check that we have a valid page_id
  IF v_page_id IS NULL OR v_page_id = '' THEN
    RAISE EXCEPTION 'Could not determine a valid page_id for profile %', p_profile_id;
  END IF;
  
  -- Calculate next display order directly
  SELECT COALESCE(MAX(display_order), 0) + 1 
  INTO v_display_order
  FROM profile_blocks
  WHERE profile_id = p_profile_id;
  
  -- Create the profile block first with explicit NOT NULL check
  BEGIN
    INSERT INTO profile_blocks (
      id,
      profile_id,
      type,
      auth_user_id,
      display_order,
      page_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_profile_id,
      'rcmd',
      v_auth_user_id,
      v_display_order,
      v_page_id,  -- This should not be NULL at this point
      now(),
      now()
    )
    RETURNING id INTO v_profile_block_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create profile block: % (page_id: %)', SQLERRM, v_page_id;
  END;
  
  -- Create the rcmd block
  BEGIN
    INSERT INTO rcmd_blocks (
      id,
      profile_block_id,
      rcmd_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_profile_block_id,
      p_rcmd_id,
      now(),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Clean up the profile block if rcmd block fails
    DELETE FROM profile_blocks WHERE id = v_profile_block_id;
    RAISE EXCEPTION 'Failed to create RCMD block: %', SQLERRM;
  END;
  
  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'profile_block_id', v_profile_block_id,
    'display_order', v_display_order,
    'page_id', v_page_id,
    'pages_count', v_page_count
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.insert_rcmd_block IS 'Creates a new RCMD block for a profile page'; 