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
 * Translates a social media profile image URL to one that can be safely displayed in our app
 * Some platforms like Facebook require additional parameters or proxy handling
 */
export function getSafeProfileImageUrl(
  url: string,
  platform?: SocialPlatform
): string {
  if (!url) return "";

  console.log(
    `[DEBUG] getSafeProfileImageUrl for ${platform || "unknown"}: ${url}`
  );

  // Facebook/Instagram profile pictures sometimes need specific parameters
  if (platform === "facebook" || platform === "instagram") {
    // If it's a Facebook graph API URL, make sure it has the right parameters
    if (url.includes("graph.facebook.com") && !url.includes("type=")) {
      // Facebook Graph API URLs need the type=large parameter to get full-size images
      return `${url}${url.includes("?") ? "&" : "?"}type=large`;
    }
  }

  // TikTok image URLs may need special handling
  if (platform === "tiktok") {
    // For TikTok placeholder avatars, we can use them directly
    if (url.includes("ui-avatars.com")) {
      return url;
    }

    // Some TikTok images need to be proxied through a CORS-friendly service
    if (url.includes("tiktokcdn") || url.includes("tiktok.com")) {
      // For now, we'll just use the URL directly, but we could implement a proxy if needed
      return url;
    }
  }

  // For fallback images or platforms without special handling, use the URL directly
  return url;
}

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

  // Get the current location (only available client-side)
  let baseUrl: string;

  if (typeof window !== "undefined") {
    // Client-side: Use window.location
    const location = window.location;
    const host = location.host;
    const protocol = location.protocol.replace(/:$/, ""); // Remove trailing colon

    // Use env var if available, otherwise construct from window.location
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    console.log(`[DEBUG] Current host: ${host}`);
  } else {
    // Server-side: Use fallback (should not normally happen in this function)
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://rcmd.bcbrown.com";
  }

  console.log(`[DEBUG] Using base URL: ${baseUrl}`);

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
    console.log("[DEBUG] getUserSocialIntegrations: Starting...");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log(
        "[DEBUG] getUserSocialIntegrations: No authenticated user found"
      );
      throw new Error("No authenticated user found");
    }

    // Ensure a profile exists before proceeding
    console.log(
      "[DEBUG] getUserSocialIntegrations: Ensuring profile exists for user",
      user.id
    );
    const profileId = await ensureUserProfile(user.id);
    if (!profileId) {
      console.log("[DEBUG] getUserSocialIntegrations: No profile found");
      return []; // Return empty array if no profile found
    }

    // Get social integrations
    console.log(
      "[DEBUG] getUserSocialIntegrations: Fetching integrations for profile",
      profileId
    );
    const { data: integrations } = await supabase
      .from("profile_social_integrations")
      .select("*")
      .eq("profile_id", profileId);

    if (!integrations) {
      console.log("[DEBUG] getUserSocialIntegrations: No integrations found");
      return [];
    }

    console.log(
      "[DEBUG] getUserSocialIntegrations: Found integrations:",
      integrations.length
    );
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
    avatar_url?: string;
  };
  error?: string;
}> {
  try {
    console.log(
      "[DEBUG] fetchTikTokUserInfo: Starting for username:",
      username
    );
    // For TikTok, we can just store the username without verification
    // The Display API can be used later to fetch content using this username
    const profileUrl = `https://www.tiktok.com/@${username}`;

    // Generate a better avatar for the user by using a more recognizable placeholder
    // In a production app, you could try to fetch the actual profile picture using TikTok's API
    // with proper OAuth credentials, but for now we'll use a placeholder.
    const avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=000000&color=ffffff&bold=true&size=256`;

    console.log(
      "[DEBUG] fetchTikTokUserInfo: Generated avatar URL:",
      avatar_url
    );

    return {
      success: true,
      data: {
        username,
        profileUrl,
        avatar_url,
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
      console.log(
        "[DEBUG] TikTok Manual Connect: Starting process for username:",
        username
      );
      const tikTokResult = await fetchTikTokUserInfo(username);
      if (!tikTokResult.success) {
        throw new Error(
          tikTokResult.error || "Failed to verify TikTok account"
        );
      }

      profileUrl =
        tikTokResult.data?.profileUrl || `https://www.tiktok.com/@${username}`;

      console.log(
        "[DEBUG] TikTok Manual Connect: Got avatar URL:",
        tikTokResult.data?.avatar_url
      );

      metadata = {
        display_name: username,
        profile_deep_link: profileUrl,
        avatar_url:
          tikTokResult.data?.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
      };

      console.log(
        "[DEBUG] TikTok Manual Connect: Final metadata:",
        JSON.stringify(metadata, null, 2)
      );
    } else if (platform === "instagram") {
      profileUrl = `https://instagram.com/${username}`;
      // For Instagram, provide a fallback avatar using UI Avatars
      metadata = {
        profile_picture_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=E1306C&color=fff`,
      };
    }

    // Define platform-specific scopes
    let scopes: string[] | undefined;
    if (platform === "tiktok") {
      scopes = ["user.info.basic"];
    } else if (platform === "instagram" || platform === "facebook") {
      scopes = ["public_profile", "email"];
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
        scopes,
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

/**
 * Retrieves profile information from connected social accounts
 * that can be used to populate user profile forms
 */
export async function getProfileDataFromSocial(
  preferredPlatforms?: SocialPlatform[]
) {
  try {
    // Get all social integrations
    const integrations = await getUserSocialIntegrations();

    if (!integrations.length) {
      return {};
    }

    // Initialize empty profile data object
    const profileData: {
      first_name?: string;
      last_name?: string;
      bio?: string;
      profile_image?: string;
      location?: string;
      interests?: string[];
    } = {};

    // Filter integrations based on preferred platforms if specified
    let prioritizedIntegrations = [...integrations];

    if (preferredPlatforms && preferredPlatforms.length > 0) {
      const filteredIntegrations = integrations.filter((integration) =>
        preferredPlatforms.includes(integration.platform)
      );

      // Only use filtered list if we found matches
      if (filteredIntegrations.length > 0) {
        prioritizedIntegrations = filteredIntegrations;
      }
    }

    // Then apply standard prioritization
    prioritizedIntegrations.sort((a, b) => {
      const platformOrder = {
        facebook: 1,
        instagram: 2,
        linkedin: 3,
        youtube: 4,
        twitter: 5,
        tiktok: 6,
      };

      return (
        (platformOrder[a.platform] || 99) - (platformOrder[b.platform] || 99)
      );
    });

    // Get profile image from the highest priority connected account based on platform order
    for (const integration of prioritizedIntegrations) {
      // Handle each platform specifically for profile images

      // Facebook - use Graph API with userId
      if (integration.platform === "facebook" && integration.userId) {
        profileData.profile_image = `https://graph.facebook.com/${integration.userId}/picture?type=large`;
        break; // Exit loop once we have an image
      }

      // Instagram - check both userId-based method and metadata
      else if (integration.platform === "instagram") {
        if (integration.userId) {
          // If we have a userId (through Facebook Instagram business account)
          profileData.profile_image = `https://graph.facebook.com/${integration.userId}/picture?type=large`;
          break;
        }

        // Check if there is a profile picture in metadata
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            // First get the profile ID
            const profileId = await ensureUserProfile(user.id);

            if (profileId) {
              // Query for Instagram metadata
              const { data } = await supabase
                .from("profile_social_integrations")
                .select("metadata")
                .eq("platform", "instagram")
                .eq("profile_id", profileId)
                .single();

              if (data?.metadata?.profile_picture_url) {
                profileData.profile_image = data.metadata.profile_picture_url;
                console.log(
                  "[DEBUG] Found Instagram profile picture URL:",
                  profileData.profile_image
                );
                break;
              }
            }
          }
        } catch (error) {
          console.error("Error checking Instagram metadata:", error);
        }
      }

      // TikTok - check metadata for avatar_url
      else if (integration.platform === "tiktok") {
        // Get the TikTok metadata if it exists
        try {
          console.log(
            "[DEBUG] TikTok: Starting metadata lookup for profile photo"
          );
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            console.log("[DEBUG] TikTok: User found, getting profile ID");
            // First get the profile ID
            const profileId = await ensureUserProfile(user.id);

            if (profileId) {
              console.log("[DEBUG] TikTok: Profile ID found:", profileId);
              // Then query for the integration with the correct profile ID
              const { data, error } = await supabase
                .from("profile_social_integrations")
                .select("metadata, username")
                .eq("platform", "tiktok")
                .eq("profile_id", profileId)
                .single();

              if (error) {
                console.log(
                  "[DEBUG] TikTok: Error fetching metadata:",
                  error.message
                );
              }

              console.log(
                "[DEBUG] TikTok: Integration data:",
                JSON.stringify(data, null, 2)
              );

              if (data?.metadata?.avatar_url) {
                profileData.profile_image = data.metadata.avatar_url;
                console.log(
                  "[DEBUG] TikTok: Found avatar URL:",
                  profileData.profile_image
                );
                break;
              } else {
                console.log("[DEBUG] TikTok: No avatar_url found in metadata");
              }
            } else {
              console.log("[DEBUG] TikTok: No profile ID found");
            }
          } else {
            console.log("[DEBUG] TikTok: No authenticated user found");
          }
        } catch (error) {
          console.error("Error checking TikTok metadata:", error);
        }
      }
    }

    // If we still don't have a profile image, try the Facebook/Instagram fallback
    if (!profileData.profile_image) {
      const facebookOrInstagram = prioritizedIntegrations.find(
        (i) => i.platform === "facebook" || i.platform === "instagram"
      );

      if (facebookOrInstagram?.userId) {
        profileData.profile_image = `https://graph.facebook.com/${facebookOrInstagram.userId}/picture?type=large`;
      }
    }

    // Try to determine interests based on connected social platforms
    const interestsMap: { [key: string]: string[] } = {
      instagram: ["photography", "visual arts", "social media"],
      facebook: ["social media", "connecting"],
      youtube: ["video", "content creation"],
      twitter: ["news", "social media", "current events"],
      tiktok: ["short-form video", "entertainment", "trends"],
      linkedin: ["professional networking", "business", "career development"],
    };

    // Collect possible interests from connected platforms
    const possibleInterests = new Set<string>();
    integrations.forEach((integration) => {
      const platformInterests = interestsMap[integration.platform] || [];
      platformInterests.forEach((interest) => possibleInterests.add(interest));
    });

    if (possibleInterests.size > 0) {
      profileData.interests = Array.from(possibleInterests);
    }

    for (const integration of prioritizedIntegrations) {
      if (integration.username) {
        // Special handling for platforms with first/last name
        if (
          integration.platform === "facebook" ||
          integration.platform === "instagram"
        ) {
          // Try to extract name components if we have a name with space
          if (integration.username.includes(" ")) {
            const nameParts = integration.username.split(" ");
            // Only set if we don't already have these fields
            if (!profileData.first_name) {
              profileData.first_name = nameParts[0];
            }
            if (!profileData.last_name && nameParts.length > 1) {
              profileData.last_name = nameParts.slice(1).join(" ");
            }
          } else if (integration.username.includes(".")) {
            // Facebook sometimes replaces spaces with dots in usernames
            const nameParts = integration.username.split(".");
            if (!profileData.first_name) {
              profileData.first_name = nameParts[0];
            }
            if (!profileData.last_name && nameParts.length > 1) {
              profileData.last_name = nameParts.slice(1).join(" ");
            }
          } else if (!profileData.first_name) {
            // If we can't split it, just use as first name
            profileData.first_name = integration.username;
          }
        }

        // For other platforms, just use username as first name if nothing better
        else if (!profileData.first_name) {
          profileData.first_name = integration.username;
        }
      }
    }

    // Create a default bio if we have some information
    if (profileData.first_name && !profileData.bio) {
      const name = [profileData.first_name, profileData.last_name]
        .filter(Boolean)
        .join(" ");
      const platforms = integrations.map((i) => i.platform);

      if (platforms.length) {
        profileData.bio = `${name} is active on ${platforms.join(", ")}.`;
      }
    }

    return profileData;
  } catch (error) {
    console.error(
      "Error getting profile data from social integrations:",
      error
    );
    return {};
  }
}
