-- Add default_page_type and default_page_id columns to profiles table
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "default_page_type" TEXT DEFAULT 'rcmd',
ADD COLUMN IF NOT EXISTS "default_page_id" TEXT DEFAULT 'rcmds';

-- Update existing profiles to have a default value
UPDATE "public"."profiles"
SET 
  "default_page_type" = 'rcmd',
  "default_page_id" = 'rcmds'
WHERE "default_page_type" IS NULL OR "default_page_id" IS NULL;

-- Add comment to explain columns
COMMENT ON COLUMN "public"."profiles"."default_page_type" IS 'Type of default page (rcmd, link, collection, or custom)';
COMMENT ON COLUMN "public"."profiles"."default_page_id" IS 'ID of the default page - for standard pages this is just the type name + s, for custom pages this is the page ID'; 