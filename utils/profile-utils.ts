import { createClient, withRetry } from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

interface Profile {
  id: string;
}

/**
 * Ensures a user profile exists in the database
 * @param userId - The authenticated user ID
 * @returns The profile ID
 */
export async function ensureUserProfile(
  userId: string
): Promise<string | null> {
  try {
    if (!userId) {
      console.error("[Profile Utils] Cannot ensure profile for empty userId");
      return null;
    }

    console.log(`[Profile Utils] Ensuring profile exists for user ${userId}`);

    const supabase = createClient();

    // First try to get the profile if it already exists - using retry utility
    // Since multiple profiles are allowed, we'll get the first one (or the active one)
    try {
      // First check for an active profile
      const { data: activeProfile } = await withRetry<
        PostgrestSingleResponse<{ profile_id: string }>
      >(() =>
        supabase
          .from("user_active_profiles")
          .select("profile_id")
          .eq("auth_user_id", userId)
          .single()
      );

      if (activeProfile?.profile_id) {
        console.log(
          `[Profile Utils] Found active profile: ${activeProfile.profile_id}`
        );
        return activeProfile.profile_id;
      }

      // If no active profile, get the first profile for this user
      const existingProfiles = await withRetry<{
        data: Profile[] | null;
        error: any;
      }>(() =>
        supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", userId)
          .order("created_at", { ascending: true })
          .limit(1)
      );

      if (existingProfiles?.data && existingProfiles.data.length > 0) {
        const profileId = existingProfiles.data[0].id;
        console.log(`[Profile Utils] Found existing profile: ${profileId}`);
        return profileId;
      }
    } catch (error: any) {
      // Ignore PGRST116 errors (not found)
      if (error?.code !== "PGRST116") {
        console.warn(
          "[Profile Utils] Error checking for existing profile:",
          error
        );
      }
    }

    console.log(`[Profile Utils] No profile found for ${userId}, creating one`);

    // Generate a profile ID and handle
    const newProfileId = uuidv4();
    const handle = `user_${newProfileId.substring(0, 8)}`;
    const email = `${handle}@placeholder.com`;

    // Try multiple approaches with retry utility

    // First try: Use direct insert with correct column names
    try {
      const { error } = await withRetry<{ data: null; error: any }>(() =>
        supabase.from("profiles").insert({
          id: newProfileId,
          auth_user_id: userId,
          handle: handle,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_onboarded: false,
          profile_type: "default", // Default profile type for new users
        })
      );

      if (!error) {
        console.log(
          `[Profile Utils] Created profile via direct insert: ${newProfileId}`
        );
        return newProfileId;
      } else {
        console.warn(
          "[Profile Utils] Insert error:",
          error.code,
          error.message,
          error.details
        );
      }
    } catch (insertError) {
      console.warn("[Profile Utils] Direct insert failed:", insertError);
    }

    // Second try: Use the RPC function with updated parameter names
    try {
      console.log("[Profile Utils] Attempting RPC function");

      const { data, error } = await withRetry<{
        data: string | null;
        error: any;
      }>(() =>
        supabase.rpc("create_user_profile", {
          auth_id: userId,
          handle_param: handle,
          profile_id_param: newProfileId,
        })
      );

      if (error) {
        console.error(
          "[Profile Utils] RPC error details:",
          error.code,
          error.message,
          error.details
        );
        throw error;
      }

      if (data) {
        console.log(`[Profile Utils] Created profile via RPC: ${data}`);
        return data;
      }
    } catch (rpcError) {
      // If RPC fails, try one last method
      console.warn("[Profile Utils] RPC function failed:", rpcError);
    }

    // Third try: Upsert operation with conflict handling
    try {
      const { error } = await withRetry<{ data: null; error: any }>(() =>
        supabase.from("profiles").upsert(
          {
            id: newProfileId,
            auth_user_id: userId,
            handle: handle,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_onboarded: false,
            profile_type: "default", // Default profile type for new users
          },
          {
            onConflict: "auth_user_id",
          }
        )
      );

      if (error) {
        console.warn(
          "[Profile Utils] Upsert error:",
          error.code,
          error.message,
          error.details
        );
        throw error;
      }

      // Verify the profile was created
      const verifyProfiles = await withRetry<{
        data: Profile[] | null;
        error: any;
      }>(() =>
        supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", userId)
          .order("created_at", { ascending: true })
          .limit(1)
      );

      if (verifyProfiles?.data && verifyProfiles.data.length > 0) {
        const profileId = verifyProfiles.data[0].id;
        console.log(`[Profile Utils] Created profile via upsert: ${profileId}`);
        return profileId;
      }
    } catch (upsertError) {
      console.warn("[Profile Utils] Upsert operation failed:", upsertError);
    }

    // If we get here, all profile creation attempts failed
    console.error(
      "[Profile Utils] Failed to create profile after all attempts"
    );
    return null;
  } catch (error) {
    console.error("[Profile Utils] Fatal error ensuring user profile:", error);
    return null;
  }
}

/**
 * Fetches the profile ID for a user, but doesn't create one if it doesn't exist
 * @param userId - The authenticated user ID
 * @returns The profile ID or null if not found
 */
export async function getProfileId(userId: string): Promise<string | null> {
  try {
    const supabase = createClient();

    // First check for an active profile
    const { data: activeProfile } = await withRetry<
      PostgrestSingleResponse<{ profile_id: string }>
    >(() =>
      supabase
        .from("user_active_profiles")
        .select("profile_id")
        .eq("auth_user_id", userId)
        .single()
    );

    if (activeProfile?.profile_id) {
      return activeProfile.profile_id;
    }

    // If no active profile, get the first profile for this user
    const result = await withRetry<{
      data: Profile[] | null;
      error: any;
    }>(() =>
      supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
    );

    if (result?.error || !result?.data || result.data.length === 0) {
      return null;
    }

    return result.data[0].id;
  } catch (error) {
    console.error("[Profile Utils] Error getting profile ID:", error);
    return null;
  }
}
