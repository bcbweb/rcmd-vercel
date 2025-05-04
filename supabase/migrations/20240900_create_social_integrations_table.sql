-- Create profile_social_integrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS profile_social_integrations (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT,
  profile_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (profile_id, platform)
);

-- Enable RLS on profile_social_integrations
ALTER TABLE profile_social_integrations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own integrations
DROP POLICY IF EXISTS profile_social_integrations_select_policy ON profile_social_integrations;
CREATE POLICY profile_social_integrations_select_policy ON profile_social_integrations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM profiles WHERE id = profile_id
    )
  );

-- Create policy for users to insert their own integrations
DROP POLICY IF EXISTS profile_social_integrations_insert_policy ON profile_social_integrations;
CREATE POLICY profile_social_integrations_insert_policy ON profile_social_integrations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT auth_user_id FROM profiles WHERE id = profile_id
    )
  );

-- Create policy for users to update their own integrations
DROP POLICY IF EXISTS profile_social_integrations_update_policy ON profile_social_integrations;
CREATE POLICY profile_social_integrations_update_policy ON profile_social_integrations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT auth_user_id FROM profiles WHERE id = profile_id
    )
  );

-- Create policy for users to delete their own integrations
DROP POLICY IF EXISTS profile_social_integrations_delete_policy ON profile_social_integrations;
CREATE POLICY profile_social_integrations_delete_policy ON profile_social_integrations
  FOR DELETE USING (
    auth.uid() IN (
      SELECT auth_user_id FROM profiles WHERE id = profile_id
    )
  );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS profile_social_integrations_profile_id_idx ON profile_social_integrations(profile_id);

-- Comment on the metadata column
COMMENT ON COLUMN profile_social_integrations.metadata IS 'Additional platform-specific data like user IDs, avatar URLs, etc.'; 