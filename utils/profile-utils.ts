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

    // Use the new RPC function that prevents duplicates
    try {
      const { data: profileId, error } = await withRetry<{
        data: string | null;
        error: any;
      }>(() =>
        supabase.rpc("ensure_default_profile", {
          p_auth_user_id: userId,
        })
      );

      if (error) {
        console.error(
          "[Profile Utils] ensure_default_profile RPC error:",
          error.code,
          error.message,
          error.details
        );
        throw error;
      }

      if (profileId) {
        console.log(
          `[Profile Utils] Created or found default profile: ${profileId}`
        );
        return profileId;
      }
    } catch (rpcError) {
      console.error("[Profile Utils] ensure_default_profile failed:", rpcError);
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
