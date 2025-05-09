-- Check if meta_deletion_logs table exists, if not create it
CREATE TABLE IF NOT EXISTS meta_deletion_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  requested_at timestamp with time zone NOT NULL,
  completed_at timestamp with time zone,
  status text NOT NULL,
  error_details jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add confirmation_code column to meta_deletion_logs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meta_deletion_logs' AND column_name = 'confirmation_code'
  ) THEN
    ALTER TABLE meta_deletion_logs ADD COLUMN confirmation_code uuid;
    
    -- Set existing rows to have random UUIDs (if any)
    UPDATE meta_deletion_logs SET confirmation_code = gen_random_uuid() WHERE confirmation_code IS NULL;
    
    -- Make confirmation_code NOT NULL for future records
    ALTER TABLE meta_deletion_logs ALTER COLUMN confirmation_code SET NOT NULL;
  END IF;
END
$$; 