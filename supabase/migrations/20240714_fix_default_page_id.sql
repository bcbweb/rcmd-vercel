-- Fix any non-UUID values in default_page_id
-- For any rows where default_page_id is not a valid UUID but the default_page_type is set,
-- set default_page_id to NULL and keep the default_page_type

-- Reset all default_page_id values to NULL where default_page_type is not 'custom'
-- This preserves the default_page_type to indicate which type of page is default
-- For custom pages, we'll keep the default_page_id as it should be a valid UUID

UPDATE profiles
SET default_page_id = NULL
WHERE default_page_type != 'custom';

-- Add constraint to ensure default_page_id is a valid UUID when not NULL
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_default_page_id_is_uuid'
  ) THEN
    -- Use a similar pattern check that is safer than casting
    ALTER TABLE profiles
    ADD CONSTRAINT check_default_page_id_is_uuid
    CHECK (
      default_page_id IS NULL OR 
      default_page_id SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    );
  END IF;
END $$; 