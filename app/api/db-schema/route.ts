import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  // Only allow running this in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();

    // Create profile_social_integrations table if it doesn't exist
    const { error: integrationTableError } = await supabase.rpc(
      "create_table_if_not_exists",
      {
        _table_name: "profile_social_integrations",
        _table_definition: `
        profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        platform TEXT NOT NULL,
        username TEXT,
        profile_url TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP WITH TIME ZONE,
        scopes TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE,
        PRIMARY KEY (profile_id, platform)
      `,
      }
    );

    if (integrationTableError) {
      throw new Error(
        `Failed to create profile_social_integrations table: ${integrationTableError.message}`
      );
    }

    // Create RLS policies for the social integrations table
    await supabase.rpc("execute_sql", {
      _sql: `
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
      `,
    });

    // Add index for better performance
    await supabase.rpc("execute_sql", {
      _sql: `
        -- Index for faster lookups
        CREATE INDEX IF NOT EXISTS profile_social_integrations_profile_id_idx ON profile_social_integrations(profile_id);
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Database schema updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating database schema:", error);
    return NextResponse.json(
      {
        error: `Failed to update database schema: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
