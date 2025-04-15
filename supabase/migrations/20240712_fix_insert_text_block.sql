CREATE OR REPLACE FUNCTION public.insert_text_block(
  p_profile_id TEXT,
  p_text TEXT,
  p_page_id TEXT DEFAULT NULL,
  p_show_border BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  auth_user_id TEXT,
  created_at TIMESTAMPTZ,
  display_order INTEGER,
  id TEXT,
  page_id TEXT,
  profile_id TEXT,
  show_border BOOLEAN,
  type TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_id TEXT;
  v_profile_id TEXT;
  v_page_id TEXT;
  v_next_order INTEGER;
  v_profile_block_id TEXT;
  v_text_block_id TEXT;
  v_profile_block record;
BEGIN
  -- Get the authenticated user ID
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate profile_id exists and belongs to the authenticated user
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE id = p_profile_id AND auth_user_id = v_auth_id;
  
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found or unauthorized';
  END IF;

  -- If page_id is provided, validate it exists and belongs to the profile
  IF p_page_id IS NOT NULL THEN
    SELECT id INTO v_page_id
    FROM profile_pages
    WHERE id = p_page_id AND profile_id = v_profile_id;
    
    IF v_page_id IS NULL THEN
      RAISE EXCEPTION 'Page not found or doesn''t belong to this profile';
    END IF;
  ELSE
    -- If page_id is not provided, get the default page for the profile
    SELECT default_page_id INTO v_page_id
    FROM profiles
    WHERE id = v_profile_id;
    
    IF v_page_id IS NULL THEN
      -- If no default page, try to get the first available page
      SELECT id INTO v_page_id
      FROM profile_pages
      WHERE profile_id = v_profile_id
      ORDER BY created_at ASC
      LIMIT 1;
      
      IF v_page_id IS NULL THEN
        RAISE EXCEPTION 'No pages found for this profile';
      END IF;
    END IF;
  END IF;

  -- Get the next display order for blocks in this page
  SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_next_order
  FROM profile_blocks
  WHERE page_id = v_page_id;

  -- Create the profile block
  INSERT INTO profile_blocks (
    auth_user_id,
    profile_id,
    page_id,
    type,
    display_order,
    show_border
  )
  VALUES (
    v_auth_id,
    v_profile_id,
    v_page_id,
    'text',
    v_next_order,
    p_show_border
  )
  RETURNING * INTO v_profile_block;
  
  v_profile_block_id := v_profile_block.id;

  -- Create the text block
  INSERT INTO text_blocks (
    profile_block_id,
    text
  )
  VALUES (
    v_profile_block_id,
    p_text
  )
  RETURNING id INTO v_text_block_id;

  -- Return the profile block
  RETURN QUERY
  SELECT *
  FROM profile_blocks
  WHERE id = v_profile_block_id;
END;
$$; 