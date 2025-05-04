-- Add metadata column to profile_social_integrations table
ALTER TABLE IF EXISTS profile_social_integrations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Comment on the metadata column
COMMENT ON COLUMN profile_social_integrations.metadata IS 'Additional platform-specific data like user IDs, avatar URLs, etc.'; 