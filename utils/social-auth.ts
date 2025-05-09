import { createClient } from "@/utils/supabase/client";
import { ensureUserProfile } from "@/utils/profile-utils";

// Define types for our social media integrations
export type SocialPlatform =
  | "instagram"
  | "twitter" // X/Twitter added back for basic integration
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "facebook"; // Add Facebook as a separate platform

export interface SocialIntegration {
  platform: SocialPlatform;
  connected: boolean;
  username?: string;
  profileUrl?: string;
  accessToken?: string;
  tokenExpiry?: Date;
  scopes?: string[];
  userId?: string; // Add user ID field for platforms that provide it
}

// Configuration for OAuth providers
const OAUTH_CONFIG = {
  instagram: {
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["public_profile", "email"],
    redirectUri: `/api/auth/callback/instagram`,
  },
  facebook: {
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["public_profile", "email"],
    redirectUri: `/api/auth/callback/facebook`,
  },
  // Twitter integration - basic placeholder for type safety
  twitter: {
    clientId: "",
    authUrl: "",
    tokenUrl: "",
    scopes: [],
    redirectUri: "",
    manualConnect: true, // Flag to indicate this doesn't use OAuth
  },
  youtube: {
    clientId: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
    redirectUri: `/api/auth/callback/youtube`,
  },
  tiktok: {
    clientId: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID,
    authUrl: "https://www.tiktok.com/auth/authorize/",
    tokenUrl: "https://open-api.tiktok.com/oauth/access_token/",
    scopes: ["user.info.profile"],
    redirectUri:
      typeof window !== "undefined"
        ? `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/api/auth/callback/tiktok`
        : `/api/auth/callback/tiktok`,
    manualConnect: true, // Add option for manual connection
  },
  linkedin: {
    clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["r_liteprofile", "r_emailaddress"],
    redirectUri: `/api/auth/callback/linkedin`,
  },
} as const;

/**
 * Initiates the OAuth flow for a specific social media platform
 */
export function initiateOAuthFlow(platform: SocialPlatform): void {
  const config = OAUTH_CONFIG[platform];

  if (!config.clientId) {
    console.error(`Client ID for ${platform} is not configured`);
    return;
  }

  // Generate and store state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem(`${platform}_oauth_state`, state);

  // Build OAuth URL with appropriate parameters
  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.append("client_id", config.clientId);

  // Determine base URL - try environment variable first, then window.location.origin
  const baseUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      : "https://rcmd.bcbrown.com"; // Fallback for SSR

  console.log(`[DEBUG] Base URL: ${baseUrl}`);

  // Ensure redirectUri is absolute
  const redirectUri = config.redirectUri.startsWith("http")
    ? config.redirectUri
    : `${baseUrl}${config.redirectUri}`;

  console.log(`[DEBUG] Platform: ${platform}`);
  console.log(`[DEBUG] Redirect URI: ${redirectUri}`);

  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("state", state);

  // Platform-specific handling for scopes
  if (platform === "tiktok") {
    authUrl.searchParams.append("scope", config.scopes.join(","));
  } else {
    authUrl.searchParams.append("scope", config.scopes.join(" "));
  }

  // Additional platform-specific parameters
  if (platform === "instagram") {
    // Instagram/Facebook needs these parameters
    authUrl.searchParams.append("auth_type", "rerequest");
  }

  // Debug the final URL
  console.log(`[DEBUG] Auth URL: ${authUrl.toString()}`);

  // Redirect to the auth URL
  window.location.href = authUrl.toString();
}

/**
 * Stores social media integration data in Supabase
 */
export async function storeSocialIntegration(
  integration: SocialIntegration
): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Ensure a profile exists before proceeding
    const profileId = await ensureUserProfile(user.id);
    if (!profileId) {
      throw new Error("Failed to create or find profile");
    }

    // Store the social media integration
    const { error } = await supabase
      .from("profile_social_integrations")
      .upsert({
        profile_id: profileId,
        platform: integration.platform,
        username: integration.username,
        profile_url: integration.profileUrl,
        access_token: integration.accessToken,
        token_expiry: integration.tokenExpiry?.toISOString(),
        scopes: integration.scopes,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Update the existing social_links record if it exists
    await supabase.from("profile_social_links").upsert({
      profile_id: profileId,
      platform: integration.platform,
      handle: integration.username,
      updated_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error storing social integration:", error);
    return false;
  }
}

/**
 * Retrieves all social media integrations for the current user
 */
export async function getUserSocialIntegrations(): Promise<
  SocialIntegration[]
> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Ensure a profile exists before proceeding
    const profileId = await ensureUserProfile(user.id);
    if (!profileId) {
      return []; // Return empty array if no profile found
    }

    // Get social integrations
    const { data: integrations } = await supabase
      .from("profile_social_integrations")
      .select("*")
      .eq("profile_id", profileId);

    if (!integrations) return [];

    return integrations.map((i: any) => ({
      platform: i.platform as SocialPlatform,
      connected: true,
      username: i.username,
      profileUrl: i.profile_url,
      accessToken: i.access_token,
      tokenExpiry: i.token_expiry ? new Date(i.token_expiry) : undefined,
      scopes: i.scopes,
      userId: i.user_id,
    }));
  } catch (error) {
    console.error("Error fetching social integrations:", error);
    return [];
  }
}

/**
 * Removes a social media integration for the current user
 */
export async function disconnectSocialIntegration(
  platform: SocialPlatform
): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Ensure a profile exists before proceeding
    const profileId = await ensureUserProfile(user.id);
    if (!profileId) {
      throw new Error("Failed to create or find profile");
    }

    // Remove the integration
    const { error } = await supabase
      .from("profile_social_integrations")
      .delete()
      .eq("profile_id", profileId)
      .eq("platform", platform);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error disconnecting social integration:", error);
    return false;
  }
}

/**
 * Fetches TikTok user info directly using username
 * For Display API usage without OAuth login
 */
export async function fetchTikTokUserInfo(username: string): Promise<{
  success: boolean;
  data?: {
    username: string;
    profileUrl: string;
  };
  error?: string;
}> {
  try {
    // For TikTok, we can just store the username without verification
    // The Display API can be used later to fetch content using this username
    const profileUrl = `https://www.tiktok.com/@${username}`;

    return {
      success: true,
      data: {
        username,
        profileUrl,
      },
    };
  } catch (error) {
    console.error("Error fetching TikTok user info:", error);
    return {
      success: false,
      error: "Failed to verify TikTok username",
    };
  }
}

/**
 * Stores a manual social account connection
 * Works for platforms that don't require OAuth or can work with just a username
 */
export async function storeManualSocialAccount(
  platform: SocialPlatform,
  username: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Ensure a profile exists before proceeding
    const profileId = await ensureUserProfile(user.id);
    if (!profileId) {
      throw new Error("Failed to create or find profile");
    }

    let profileUrl = "";
    let metadata = {};

    // Platform-specific handling
    if (platform === "twitter") {
      profileUrl = `https://x.com/${username}`;
    } else if (platform === "tiktok") {
      // Fetch additional info for TikTok if needed
      const tikTokResult = await fetchTikTokUserInfo(username);
      if (!tikTokResult.success) {
        throw new Error(
          tikTokResult.error || "Failed to verify TikTok account"
        );
      }

      profileUrl =
        tikTokResult.data?.profileUrl || `https://www.tiktok.com/@${username}`;
      metadata = {
        display_name: username,
        profile_deep_link: profileUrl,
      };
    }

    // Store the social media integration
    const { error } = await supabase
      .from("profile_social_integrations")
      .upsert({
        profile_id: profileId,
        platform: platform,
        username: username,
        profile_url: profileUrl,
        metadata,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Update the existing social_links record if it exists
    await supabase.from("profile_social_links").upsert({
      profile_id: profileId,
      platform: platform,
      handle: username,
      updated_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error storing manual social account:", error);
    return false;
  }
}
