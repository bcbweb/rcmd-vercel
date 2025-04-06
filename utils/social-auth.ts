import { createClient } from "@/utils/supabase/client";

// Define types for our social media integrations
export type SocialPlatform =
  | "instagram"
  | "twitter" // X/Twitter added back for basic integration
  | "youtube"
  | "tiktok"
  | "linkedin";

export interface SocialIntegration {
  platform: SocialPlatform;
  connected: boolean;
  username?: string;
  profileUrl?: string;
  accessToken?: string;
  tokenExpiry?: Date;
  scopes?: string[];
}

// Configuration for OAuth providers
const OAUTH_CONFIG = {
  instagram: {
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["public_profile", "instagram_basic", "pages_show_list"],
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/instagram`,
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
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/youtube`,
  },
  tiktok: {
    clientId: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID,
    authUrl: "https://www.tiktok.com/auth/authorize/",
    tokenUrl: "https://open-api.tiktok.com/oauth/access_token/",
    scopes: ["user.info.basic"],
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/tiktok`,
  },
  linkedin: {
    clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["r_liteprofile", "r_emailaddress"],
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/linkedin`,
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
  authUrl.searchParams.append("redirect_uri", config.redirectUri);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("scope", config.scopes.join(" "));

  // Additional platform-specific parameters
  if (platform === "instagram") {
    // Instagram/Facebook needs these parameters
    authUrl.searchParams.append("auth_type", "rerequest");
  }

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

    // Get the profile ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.id) {
      throw new Error("Profile not found");
    }

    // Store the social media integration
    const { error } = await supabase
      .from("profile_social_integrations")
      .upsert({
        profile_id: profile.id,
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
      profile_id: profile.id,
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

    // Get the profile ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.id) {
      throw new Error("Profile not found");
    }

    // Get social integrations
    const { data: integrations } = await supabase
      .from("profile_social_integrations")
      .select("*")
      .eq("profile_id", profile.id);

    if (!integrations) return [];

    return integrations.map((i) => ({
      platform: i.platform as SocialPlatform,
      connected: true,
      username: i.username,
      profileUrl: i.profile_url,
      accessToken: i.access_token,
      tokenExpiry: i.token_expiry ? new Date(i.token_expiry) : undefined,
      scopes: i.scopes,
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

    // Get the profile ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.id) {
      throw new Error("Profile not found");
    }

    // Remove the integration
    const { error } = await supabase
      .from("profile_social_integrations")
      .delete()
      .eq("profile_id", profile.id)
      .eq("platform", platform);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error disconnecting social integration:", error);
    return false;
  }
}

/**
 * Manually store a social media username without OAuth
 * Used for platforms where we don't have full OAuth integration yet
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

    // Get the profile ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.id) {
      throw new Error("Profile not found");
    }

    let profileUrl = "";
    if (platform === "twitter") {
      // Remove @ from username if present
      const cleanUsername = username.startsWith("@")
        ? username.substring(1)
        : username;
      profileUrl = `https://x.com/${cleanUsername}`;

      // Store in profile_social_integrations table
      const { error: integrationError } = await supabase
        .from("profile_social_integrations")
        .upsert({
          profile_id: profile.id,
          platform: platform,
          username: cleanUsername,
          profile_url: profileUrl,
          updated_at: new Date().toISOString(),
        });

      if (integrationError) throw integrationError;

      // Update the social links table
      await supabase.from("profile_social_links").upsert({
        profile_id: profile.id,
        platform: platform,
        handle: cleanUsername,
        updated_at: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    console.error(`Error storing ${platform} account:`, error);
    return false;
  }
}
