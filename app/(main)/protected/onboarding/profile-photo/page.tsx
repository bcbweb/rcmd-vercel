"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StepProgress } from "@/components/common";
import { ProfilePhotoUpload } from "@/components/common/media";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ensureUserProfile } from "@/utils/profile-utils";
import { uploadImageFromUrl } from "@/utils/storage";
import {
  getUserSocialIntegrations,
  getProfileDataFromSocial,
  SocialIntegration,
  SocialPlatform,
  getSafeProfileImageUrl,
} from "@/utils/social-auth";
import { Loader2, CloudDownload, ChevronDown } from "lucide-react";
import Image from "next/image";

export default function ProfilePhotoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isImportingPhoto, setIsImportingPhoto] = useState(false);
  const [hasSocialAccounts, setHasSocialAccounts] = useState(false);
  const [isCheckingSocial, setIsCheckingSocial] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState<SocialIntegration[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SocialPlatform | null>(
    null
  );
  const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
  const supabase = createClient();

  // Check if user has connected social accounts
  useEffect(() => {
    const checkSocialAccounts = async () => {
      setIsCheckingSocial(true);
      try {
        console.log("[DEBUG] Profile-photo: Checking social accounts...");
        const integrations = await getUserSocialIntegrations();
        console.log("[DEBUG] Profile-photo: Found integrations:", integrations);
        setSocialAccounts(integrations);
        setHasSocialAccounts(integrations.length > 0);
        // Set the first account as selected by default if available
        if (integrations.length > 0) {
          setSelectedAccount(integrations[0].platform);
        }
        console.log(
          "[DEBUG] Profile-photo: hasSocialAccounts set to:",
          integrations.length > 0
        );
      } catch (error) {
        console.error("Failed to check social integrations:", error);
      } finally {
        setIsCheckingSocial(false);
      }
    };

    checkSocialAccounts();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const profileId = await ensureUserProfile(user.id);
        if (!profileId) {
          throw new Error("Failed to ensure profile exists");
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, profile_picture_url")
          .eq("auth_user_id", user.id)
          .single();

        if (error) throw error;

        if (profile?.profile_picture_url) {
          setPhotoUrl(profile.profile_picture_url);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  const handleUploadComplete = (url: string) => {
    setPhotoUrl(url);
  };

  // Get platform display name
  const getPlatformName = (platform: SocialPlatform): string => {
    const platformMap: Record<SocialPlatform, string> = {
      facebook: "Facebook",
      instagram: "Instagram",
      twitter: "Twitter",
      tiktok: "TikTok",
      youtube: "YouTube",
      linkedin: "LinkedIn",
    };
    return platformMap[platform] || platform;
  };

  // Get platform icon
  const getPlatformIcon = (platform: SocialPlatform): string => {
    const iconMap: Record<SocialPlatform, string> = {
      facebook: "/icons/facebook.svg",
      instagram: "/icons/instagram.svg",
      twitter: "/icons/x-twitter.svg",
      tiktok: "/icons/tiktok.svg",
      youtube: "/icons/youtube.svg",
      linkedin: "/icons/linkedin.svg",
    };
    return iconMap[platform] || "";
  };

  // Verify image URL is valid and accessible
  const verifyImageUrl = async (url: string): Promise<boolean> => {
    // Basic URL validation
    if (!url || !url.startsWith("http")) {
      console.log(`[DEBUG] Profile-photo: Invalid URL format: ${url}`);
      return false;
    }

    console.log(`[DEBUG] Profile-photo: Verifying image URL: ${url}`);

    // For most social media profile images, we can't actually check if they load
    // because of CORS restrictions, so we'll just validate the format
    return true;
  };

  const importSocialProfilePhoto = async (
    specificPlatform?: SocialPlatform
  ) => {
    const platformToUse = specificPlatform || selectedAccount;
    if (!platformToUse) {
      toast.error("Please select a social account to import from");
      return;
    }

    setIsImportingPhoto(true);
    try {
      console.log(`[DEBUG] Profile-photo: Importing from ${platformToUse}...`);

      // Pass the specific platform to prioritize for photo import
      const socialData = await getProfileDataFromSocial(
        platformToUse ? [platformToUse] : undefined
      );

      console.log(
        `[DEBUG] Profile-photo: Got social data:`,
        JSON.stringify(socialData, null, 2)
      );

      if (!socialData?.profile_image) {
        console.log(
          `[DEBUG] Profile-photo: No profile image found from ${platformToUse}`
        );
        toast.error("No profile image found from your connected account");
        return;
      }

      // Get a sanitized version of the image URL
      const rawImageUrl = socialData.profile_image;
      const safeImageUrl = getSafeProfileImageUrl(rawImageUrl, platformToUse);

      console.log(
        `[DEBUG] Profile-photo: Raw URL: ${rawImageUrl}, Safe URL: ${safeImageUrl}`
      );

      // Note for Facebook profile image URLs
      if (
        platformToUse === "facebook" &&
        safeImageUrl.includes("graph.facebook.com")
      ) {
        console.log(
          `[DEBUG] Profile-photo: Facebook Graph API URLs (like ${safeImageUrl}) are direct API endpoints to profile pictures and should render correctly when used in <img> tags, even though they don't end with file extensions.`
        );
      }

      // Verify image URL is valid and accessible
      const isValid = await verifyImageUrl(safeImageUrl);
      if (!isValid) {
        console.log(
          `[DEBUG] Profile-photo: Invalid image URL: ${safeImageUrl}`
        );
        toast.error("Invalid image URL from social media account");
        return;
      }

      try {
        // Download and re-upload the image to our storage
        console.log(
          `[DEBUG] Profile-photo: Downloading and re-uploading image...`
        );

        // This will download the image and store it in our storage
        const storedImageUrl = await uploadImageFromUrl(safeImageUrl);

        console.log(
          `[DEBUG] Profile-photo: Successfully stored image at ${storedImageUrl}`
        );

        // Set the stored image URL as the profile photo
        setPhotoUrl(storedImageUrl);
      } catch (downloadError) {
        console.error("Error downloading image:", downloadError);

        // Fall back to the direct URL if download/upload fails
        console.log(
          `[DEBUG] Profile-photo: Falling back to direct URL: ${safeImageUrl}`
        );
        setPhotoUrl(safeImageUrl);
      }

      toast.success(
        `Profile photo imported from ${getPlatformName(platformToUse)}`
      );
      setIsAccountSelectorOpen(false);
    } catch (error) {
      console.error("Error importing social profile photo:", error);
      toast.error("Failed to import photo from social accounts");
    } finally {
      setIsImportingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("profiles")
        .update({
          profile_picture_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_user_id", user.id);

      if (error) throw error;
      router.push("/protected/onboarding/other-info");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile photo");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-48 w-48 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Profile Photo
        </h2>
        <StepProgress currentStep={3} totalSteps={4} />
      </div>

      <div className="p-6 space-y-6">
        {isCheckingSocial ? (
          <div className="flex items-center space-x-2 mb-6 text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking social accounts...</span>
          </div>
        ) : hasSocialAccounts ? (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-base font-medium text-blue-800 dark:text-blue-300">
                  Use Profile Photo from Social Media
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Import your profile photo from connected social accounts like
                  Facebook and Instagram.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {socialAccounts.length > 1 ? (
                  <>
                    <div className="relative flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          setIsAccountSelectorOpen(!isAccountSelectorOpen)
                        }
                        className="inline-flex w-full items-center justify-between px-4 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <div className="flex items-center">
                          {selectedAccount && (
                            <>
                              <div className="w-5 h-5 mr-2 relative">
                                <Image
                                  src={getPlatformIcon(selectedAccount)}
                                  alt={selectedAccount}
                                  width={20}
                                  height={20}
                                  className="object-contain"
                                />
                              </div>
                              <span className="truncate">
                                {getPlatformName(selectedAccount)}
                              </span>
                            </>
                          )}
                        </div>
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </button>

                      {isAccountSelectorOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            {socialAccounts.map((account) => (
                              <button
                                key={account.platform}
                                type="button"
                                onClick={() => {
                                  setSelectedAccount(account.platform);
                                  setIsAccountSelectorOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center ${
                                  selectedAccount === account.platform
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                              >
                                <div className="w-5 h-5 mr-2 relative">
                                  <Image
                                    src={getPlatformIcon(account.platform)}
                                    alt={account.platform}
                                    width={20}
                                    height={20}
                                    className="object-contain"
                                  />
                                </div>
                                <span className="truncate">
                                  {getPlatformName(account.platform)}
                                  {account.username && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                      ({account.username})
                                    </span>
                                  )}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => importSocialProfilePhoto()}
                      disabled={isImportingPhoto || !selectedAccount}
                      className="flex-none inline-flex items-center justify-center px-4 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors min-w-[100px]"
                    >
                      {isImportingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <CloudDownload className="w-4 h-4 mr-2" />
                          Import
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      importSocialProfilePhoto(socialAccounts[0]?.platform)
                    }
                    disabled={isImportingPhoto}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    {isImportingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {socialAccounts.length > 0 && (
                          <div className="w-5 h-5 mr-2 relative">
                            <Image
                              src={getPlatformIcon(socialAccounts[0].platform)}
                              alt={socialAccounts[0].platform}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                          </div>
                        )}
                        <CloudDownload className="w-4 h-4 mr-2" />
                        Import from{" "}
                        {socialAccounts.length > 0
                          ? getPlatformName(socialAccounts[0].platform)
                          : "Social"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connect social accounts like Facebook or Instagram for automatic
              profile photo import.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center justify-center">
            <ProfilePhotoUpload
              onUploadComplete={handleUploadComplete}
              currentPhotoUrl={photoUrl}
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/protected/onboarding/personal-info"
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </Link>
            <Link
              href="/protected/onboarding/other-info"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 
                bg-white dark:bg-gray-800 
                border border-gray-300 dark:border-gray-600 
                rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Skip
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white 
                bg-blue-600 dark:bg-blue-500 
                rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-blue-500 dark:focus:ring-blue-400
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
