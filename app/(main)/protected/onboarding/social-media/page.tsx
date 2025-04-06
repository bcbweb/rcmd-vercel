"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { StepProgress } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Trash2,
  Check,
  Info,
  ExternalLink,
  Link2,
  Loader2,
  X,
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

// Add type for platform with manual connect option
type SocialPlatformWithConfig = {
  value: SocialPlatform;
  label: string;
  icon: string;
  description: string;
  manualConnect?: boolean;
};

// Update social platforms type
const SOCIAL_PLATFORMS: SocialPlatformWithConfig[] = [
  {
    value: "instagram",
    label: "Instagram (+ Facebook)",
    icon: "/icons/instagram.svg",
    description:
      "Connect to share your photos and visual content from Instagram and Facebook",
  },
  {
    value: "youtube",
    label: "YouTube",
    icon: "/icons/youtube.svg",
    description: "Share your videos and grow your channel",
  },
  {
    value: "tiktok",
    label: "TikTok",
    icon: "/icons/tiktok.svg",
    description: "Showcase your short-form video content",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: "/icons/linkedin.svg",
    description: "Connect your professional profile and network",
  },
  {
    value: "twitter",
    label: "X (Twitter)",
    icon: "/icons/x-twitter.svg",
    description: "Add your X username (full integration coming soon)",
    manualConnect: true, // Flag to indicate manual connection instead of OAuth
  },
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
  const supabase = createClient();
  const [showTwitterModal, setShowTwitterModal] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState("");
  const [isManualConnecting, setIsManualConnecting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle success/error messages from OAuth redirects
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const errorMessage = searchParams.get("message");

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
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Connect a social media account
  const handleConnect = (platform: SocialPlatform, isManual?: boolean) => {
    // For Twitter, show the username input modal instead of OAuth
    const platformConfig = SOCIAL_PLATFORMS.find((p) => p.value === platform);

    if (platformConfig?.manualConnect || isManual) {
      if (platform === "twitter") {
        setShowTwitterModal(true);
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

  // Store manual Twitter account
  const handleTwitterSubmit = async () => {
    if (!twitterUsername.trim()) {
      toast.error("Please enter your X username");
      return;
    }

    setIsManualConnecting(true);

    try {
      const success = await storeManualSocialAccount(
        "twitter",
        twitterUsername
      );
      if (success) {
        // Reload connected accounts to show the new connection
        const integrations = await getUserSocialIntegrations();
        setConnectedAccounts(integrations);

        setShowTwitterModal(false);
        setTwitterUsername("");
        toast.success("Successfully connected X account");
      } else {
        throw new Error("Failed to connect X account");
      }
    } catch (error) {
      console.error("Error connecting X account:", error);
      toast.error("Failed to connect X account");
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
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
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
              We prioritize your privacy and only access the data you explicitly
              authorize. You can disconnect these integrations at any time.
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
                    key={platform.value}
                    className="bg-white dark:bg-gray-800 border rounded-md overflow-hidden"
                  >
                    <div className="flex items-center p-4">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
                          <img
                            src={platform.icon}
                            alt={platform.label}
                            width={24}
                            height={24}
                            className="w-6 h-6"
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {platform.label}
                          </h3>
                          {isConnected && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              Connected
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {platform.description}
                        </p>

                        {isConnected && connectedAccount?.username && (
                          <div className="mt-1 flex items-center">
                            <Link2 className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {connectedAccount.username}
                            </span>
                            {connectedAccount.profileUrl && (
                              <a
                                href={connectedAccount.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-xs text-blue-600 hover:text-blue-800 inline-flex items-center"
                              >
                                View <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        {isConnected ? (
                          <button
                            type="button"
                            onClick={() => handleDisconnect(platform.value)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Disconnect
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConnect(platform.value)}
                            className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            {platform.value === "twitter"
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

        {/* Continue Button */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
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

      {/* Twitter Username Modal */}
      {showTwitterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Connect X (Twitter)</h3>
              <button
                onClick={() => setShowTwitterModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Enter your X username to connect your account.{" "}
                <span className="text-blue-600 font-medium">
                  Full integration with X API coming soon!
                </span>
              </p>
              <label
                htmlFor="twitterUsername"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                X Username
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-l-md">
                  @
                </span>
                <input
                  id="twitterUsername"
                  type="text"
                  value={twitterUsername}
                  onChange={(e) => setTwitterUsername(e.target.value)}
                  placeholder="username"
                  className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowTwitterModal(false)}
                className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTwitterSubmit}
                disabled={isManualConnecting || !twitterUsername.trim()}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isManualConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
