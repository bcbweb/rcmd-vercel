-- Add default_page_type column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS default_page_type TEXT;

-- Update existing profiles to set default_page_type to 'custom' if default_page_id is set
UPDATE profiles 
SET default_page_type = 'custom' 
WHERE default_page_id IS NOT NULL AND default_page_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.default_page_type IS 'Type of default page (rcmd, link, collection, or custom)'; 