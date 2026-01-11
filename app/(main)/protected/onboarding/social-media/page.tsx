"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { StepProgress } from "@/components/common";
import { toast } from "sonner";
import Image from "next/image";
import {
  Trash2,
  Check,
  Info,
  ExternalLink,
  Link2,
  Loader2,
} from "lucide-react";
import {
  SocialPlatform,
  initiateOAuthFlow,
  getUserSocialIntegrations,
  disconnectSocialIntegration,
  SocialIntegration,
  storeManualSocialAccount,
} from "@/utils/social-auth";
import { useSearchParams } from "next/navigation";
import TikTokUsernameModal from "@/components/features/profile/tiktok-username-modal";

// Add type for platform with manual connect option
type SocialPlatformWithConfig = {
  value: SocialPlatform;
  label: string;
  icon: string;
  manualConnect?: boolean;
};

// Update social platforms type
const SOCIAL_PLATFORMS: SocialPlatformWithConfig[] = [
  {
    value: "instagram",
    label: "Instagram",
    icon: "/icons/instagram.svg",
  },
  {
    value: "facebook",
    label: "Facebook",
    icon: "/icons/facebook.svg",
  },
  /*
  {
    value: "youtube",
    label: "YouTube",
    icon: "/icons/youtube.svg",
  },
  */
  {
    value: "tiktok",
    label: "TikTok",
    icon: "/icons/tiktok.svg",
    manualConnect: true, // Add manual connect flag for TikTok
  },
  /*
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: "/icons/linkedin.svg",
  },
  {
    value: "twitter",
    label: "X (Twitter)",
    icon: "/icons/x-twitter.svg",
    manualConnect: true, // Flag to indicate manual connection instead of OAuth
  },
  */
] as const;

export default function SocialMediaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState<
    SocialIntegration[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTwitterModal, setShowTwitterModal] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState("");
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [isManualConnecting, setIsManualConnecting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle success/error messages from OAuth redirects
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const errorMessage = searchParams.get("message");
    const verified = searchParams.get("verified");

    // Show email verification success message
    if (verified === "true") {
      toast.success("Your email has been verified! Welcome to RCMD.");
    }

    if (success?.startsWith("connected_")) {
      const platform = success.replace("connected_", "");
      toast.success(`Successfully connected ${platform}!`);
    }

    if (error?.startsWith("oauth_")) {
      const platform = error.replace("oauth_", "").split("_")[0];
      toast.error(
        `Failed to connect ${platform}${errorMessage ? `: ${errorMessage}` : ""}`
      );
    }
  }, [searchParams]);

  // Load connected accounts
  useEffect(() => {
    async function loadConnectedAccounts() {
      setIsLoading(true);
      try {
        const integrations = await getUserSocialIntegrations();
        setConnectedAccounts(integrations);
      } catch (error) {
        console.error("Error loading social integrations:", error);
        toast.error("Failed to load connected accounts");
      } finally {
        setIsLoading(false);
      }
    }

    loadConnectedAccounts();
  }, []);

  // Handle clicks outside the modal to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowTwitterModal(false);
        setShowTikTokModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Connect a social media account
  const handleConnect = (platform: SocialPlatform, isManual?: boolean) => {
    // For Twitter or TikTok, show the username input modal instead of OAuth
    const platformConfig = SOCIAL_PLATFORMS.find((p) => p.value === platform);

    if (platformConfig?.manualConnect || isManual) {
      if (platform === "twitter") {
        setShowTwitterModal(true);
      } else if (platform === "tiktok") {
        setShowTikTokModal(true);
      }
      return;
    }

    try {
      initiateOAuthFlow(platform);
    } catch (error) {
      console.error(`Error initiating ${platform} OAuth:`, error);
      toast.error(`Failed to connect to ${platform}`);
    }
  };

  // Store manual social account
  const handleManualSubmit = async (
    platform: SocialPlatform,
    username: string
  ) => {
    if (!username.trim()) {
      toast.error(
        `Please enter your ${platform === "twitter" ? "X" : "TikTok"} username`
      );
      return;
    }

    setIsManualConnecting(true);

    try {
      // Remove @ if present
      const cleanUsername = username.startsWith("@")
        ? username.substring(1)
        : username;
      const success = await storeManualSocialAccount(platform, cleanUsername);

      if (success) {
        // Reload connected accounts to show the new connection
        const integrations = await getUserSocialIntegrations();
        setConnectedAccounts(integrations);

        if (platform === "twitter") {
          setShowTwitterModal(false);
          setTwitterUsername("");
        } else if (platform === "tiktok") {
          setShowTikTokModal(false);
        }

        toast.success(
          `Successfully connected ${platform === "twitter" ? "X" : "TikTok"} account`
        );
      } else {
        throw new Error(
          `Failed to connect ${platform === "twitter" ? "X" : "TikTok"} account`
        );
      }
    } catch (error) {
      console.error(`Error connecting ${platform} account:`, error);
      toast.error(
        `Failed to connect ${platform === "twitter" ? "X" : "TikTok"} account`
      );
    } finally {
      setIsManualConnecting(false);
    }
  };

  // Disconnect a social media account
  const handleDisconnect = async (platform: SocialPlatform) => {
    try {
      const success = await disconnectSocialIntegration(platform);
      if (success) {
        setConnectedAccounts((prev) =>
          prev.filter((acc) => acc.platform !== platform)
        );
        toast.success(`Disconnected ${platform}`);
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      toast.error(`Failed to disconnect ${platform}`);
    }
  };

  // Continue to next step
  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      // Move to the next onboarding step
      router.push("/protected/onboarding/personal-info");
    } catch (error) {
      console.error("Error proceeding to next step:", error);
      toast.error("Failed to proceed to next step");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find if a platform is connected
  const isPlatformConnected = (platform: SocialPlatform) => {
    return connectedAccounts.some((acc) => acc.platform === platform);
  };

  // Get connected account details for a platform
  const getConnectedAccount = (platform: SocialPlatform) => {
    return connectedAccounts.find((acc) => acc.platform === platform);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] min-h-[500px] relative">
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Connect Social Media Accounts
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Connect your social media accounts to enhance your profile and unlock
          premium features. You can always add or modify these connections
          later.
        </p>
        <StepProgress currentStep={1} totalSteps={4} />
      </div>

      {/* Main scrollable content area with padding to prevent content from being hidden behind the fixed footer */}
      <div className="flex-1 overflow-y-auto min-h-[200px] pb-20">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsInfoOpen(!isInfoOpen)}
            className="w-full p-4 flex items-center justify-between text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-300">
                Why connect social media accounts?
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isInfoOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isInfoOpen && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-200">
                By connecting your social media accounts, you'll gain access to
                premium features like:
              </p>
              <ul className="list-disc pl-5 mt-2 text-sm text-blue-700 dark:text-blue-200">
                <li>Automatic content discovery from your accounts</li>
                <li>Enhanced visibility in relevant searches</li>
                <li>Integration with our content recommendation engine</li>
                <li>Cross-platform analytics and insights</li>
              </ul>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                We prioritize your privacy and only access the data you
                explicitly authorize. You can disconnect these integrations at
                any time.
              </p>
            </div>
          )}
        </div>
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-500">
                Loading your connected accounts...
              </span>
            </div>
          ) : (
            <>
              {/* Social Media Platforms */}
              <div className="space-y-3">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const isConnected = isPlatformConnected(platform.value);
                  const connectedAccount = getConnectedAccount(platform.value);

                  return (
                    <div
                      className="flex flex-col mb-4 border rounded-lg dark:border-gray-700 overflow-hidden"
                      key={platform.value}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center p-4">
                        <div className="flex items-center grow mb-3 sm:mb-0">
                          <div className="flex-shrink-0 mr-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
                              <Image
                                src={platform.icon}
                                alt={platform.label}
                                width={24}
                                height={24}
                                className="w-6 h-6"
                              />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {platform.label}
                              </h3>
                              {isConnected && (
                                <div className="ml-2 inline-flex items-center">
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center">
                                    <Check className="w-3 h-3 mr-1" />
                                    Connected
                                  </span>
                                  <div className="ml-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDisconnect(platform.value);
                                      }}
                                      className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                      aria-label={`Disconnect ${platform.label}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {isConnected && connectedAccount?.username && (
                              <div className="mt-1 flex items-center">
                                <Link2 className="w-3 h-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[10ch] sm:max-w-[25ch]">
                                  {connectedAccount.username}
                                </span>
                                {connectedAccount.profileUrl && (
                                  <a
                                    href={connectedAccount.profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center whitespace-nowrap"
                                  >
                                    View{" "}
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 sm:ml-4 mt-2 sm:mt-0 w-full sm:w-auto">
                          {isConnected ? (
                            <></>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleConnect(platform.value)}
                              className="inline-flex items-center justify-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-white dark:bg-gray-700 dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap w-full sm:w-[120px]"
                            >
                              {platform.value === "twitter" ||
                              platform.value === "tiktok"
                                ? "Add username"
                                : "Connect"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer with Continue and Skip buttons - fixed at the bottom */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 sticky bottom-0 left-0 right-0 z-10">
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>

      {/* Twitter Username Modal - z-index above the footer */}
      {showTwitterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">
              Connect X (Twitter) Account
            </h3>
            <div className="mb-4">
              <label
                htmlFor="twitterUsername"
                className="block text-sm font-medium mb-1"
              >
                Your X Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">@</span>
                <input
                  type="text"
                  id="twitterUsername"
                  className="w-full rounded-md border border-gray-300 pl-6 py-2 px-3"
                  placeholder="username"
                  value={twitterUsername}
                  onChange={(e) => setTwitterUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTwitterModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-md"
                disabled={isManualConnecting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleManualSubmit("twitter", twitterUsername)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center"
                disabled={isManualConnecting}
              >
                {isManualConnecting ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Connect"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TikTok Username Modal - z-index above the footer */}
      {showTikTokModal && (
        <TikTokUsernameModal
          isOpen={showTikTokModal}
          onClose={() => setShowTikTokModal(false)}
          onSuccess={async () => {
            // Reload connected accounts to show the new connection
            const integrations = await getUserSocialIntegrations();
            setConnectedAccounts(integrations);
            toast.success("Successfully connected TikTok account");
          }}
        />
      )}
    </div>
  );
}
