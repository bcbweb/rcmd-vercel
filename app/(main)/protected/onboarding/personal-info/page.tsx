"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { StepProgress } from "@/components/common";
import {
  personalInfoSchema,
  type PersonalInfoFormData,
} from "@/lib/schemas/onboarding";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import {
  getUserSocialIntegrations,
  getProfileDataFromSocial,
  SocialIntegration,
  SocialPlatform,
} from "@/utils/social-auth";
import { Loader2, RefreshCcw, ChevronDown } from "lucide-react";
import Image from "next/image";

const STORAGE_KEY = "onboarding_personal_info";

const inputClasses = {
  default: `mt-1 block w-full rounded-md shadow-sm px-3 py-2
    bg-white dark:bg-gray-700
    text-gray-900 dark:text-gray-100 
    border border-gray-300 dark:border-gray-600
    placeholder:text-gray-400 dark:placeholder:text-gray-400
    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
    focus:border-blue-500 dark:focus:border-blue-400`,
  error: `mt-1 block w-full rounded-md shadow-sm px-3 py-2
    bg-white dark:bg-gray-700
    text-gray-900 dark:text-gray-100 
    border-2 border-red-500 dark:border-red-400
    placeholder:text-gray-400 dark:placeholder:text-gray-400
    focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 
    focus:border-red-500 dark:focus:border-red-400`,
};

export default function PersonalInfoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  const [hasSocialAccounts, setHasSocialAccounts] = useState(false);
  const [isCheckingSocial, setIsCheckingSocial] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState<SocialIntegration[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SocialPlatform | null>(
    null
  );
  const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
  });

  // Check if the user has any connected social accounts
  useEffect(() => {
    const checkSocialAccounts = async () => {
      setIsCheckingSocial(true);
      try {
        console.log("[DEBUG] Checking social accounts...");
        const integrations = await getUserSocialIntegrations();
        console.log("[DEBUG] Found integrations:", integrations);
        setSocialAccounts(integrations);
        setHasSocialAccounts(integrations.length > 0);
        // Set the first account as selected by default if available
        if (integrations.length > 0) {
          setSelectedAccount(integrations[0].platform);
        }
        console.log(
          "[DEBUG] hasSocialAccounts set to:",
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

  // Load existing data if available
  useEffect(() => {
    const loadExistingData = async () => {
      // First try to load from localStorage
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setValue("first_name", parsedData.first_name);
        setValue("last_name", parsedData.last_name);
        setValue("bio", parsedData.bio);
        return; // Exit early if we found localStorage data
      }

      // If no localStorage data, try to load from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, bio")
        .eq("auth_user_id", user.id)
        .single();

      if (profile) {
        setValue("first_name", profile.first_name);
        setValue("last_name", profile.last_name);
        setValue("bio", profile.bio);
      }
    };

    loadExistingData();
  }, [setValue, supabase]);

  // Function to get profile data from selected social account
  const populateFromSocial = async (specificPlatform?: SocialPlatform) => {
    const platformToUse = specificPlatform || selectedAccount;
    if (!platformToUse) {
      toast.error("Please select a social account to import from");
      return;
    }

    setIsLoadingSocial(true);
    try {
      // If a specific platform is provided, use only that one
      const socialData = await getProfileDataFromSocial(
        platformToUse ? [platformToUse] : undefined
      );

      if (!socialData || Object.keys(socialData).length === 0) {
        toast.error("No profile data found from your connected account");
        return;
      }

      // Populate form with social data
      if (socialData.first_name) setValue("first_name", socialData.first_name);
      if (socialData.last_name) setValue("last_name", socialData.last_name);
      if (socialData.bio) setValue("bio", socialData.bio);

      toast.success(
        `Profile information imported from ${getPlatformName(platformToUse)}`
      );
      setIsAccountSelectorOpen(false);
    } catch (error) {
      console.error("Error importing social data:", error);
      toast.error("Failed to import data from social account");
    } finally {
      setIsLoadingSocial(false);
    }
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

  const onSubmit = async (data: PersonalInfoFormData) => {
    try {
      setIsSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Save to profiles table
      const { error } = await supabase.from("profiles").upsert(
        {
          auth_user_id: user.id,
          email: user.email,
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "auth_user_id",
        }
      );

      if (error) throw error;

      // Store complete form data in localStorage
      const formData = {
        first_name: data.first_name,
        last_name: data.last_name,
        bio: data.bio,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));

      router.push("/protected/onboarding/profile-photo");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save personal information");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h2>
        <StepProgress currentStep={2} totalSteps={4} />
      </div>

      <div className="p-6 space-y-6">
        {isCheckingSocial ? (
          <div className="flex items-center space-x-2 mb-6 text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking social accounts...</span>
          </div>
        ) : hasSocialAccounts ? (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Import from Social Accounts
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                  Auto-fill your profile with information from your connected
                  social accounts.
                </p>
              </div>

              <div className="relative">
                {socialAccounts.length > 1 ? (
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsAccountSelectorOpen(!isAccountSelectorOpen)
                        }
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        {selectedAccount && (
                          <>
                            <div className="w-4 h-4 mr-2 relative">
                              <Image
                                src={getPlatformIcon(selectedAccount)}
                                alt={selectedAccount}
                                width={16}
                                height={16}
                                className="object-contain"
                              />
                            </div>
                            <span className="truncate max-w-[80px]">
                              {getPlatformName(selectedAccount)}
                            </span>
                          </>
                        )}
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </button>

                      {isAccountSelectorOpen && (
                        <div className="absolute z-10 mt-1 right-0 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            {socialAccounts.map((account) => (
                              <button
                                key={account.platform}
                                type="button"
                                onClick={() => {
                                  setSelectedAccount(account.platform);
                                  setIsAccountSelectorOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                                  selectedAccount === account.platform
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                              >
                                <div className="w-4 h-4 mr-2 relative">
                                  <Image
                                    src={getPlatformIcon(account.platform)}
                                    alt={account.platform}
                                    width={16}
                                    height={16}
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
                      onClick={() => populateFromSocial()}
                      disabled={isLoadingSocial || !selectedAccount}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      {isLoadingSocial ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Import
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      populateFromSocial(socialAccounts[0]?.platform)
                    }
                    disabled={isLoadingSocial}
                    className="inline-flex items-center px-3 py-1.5 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    {isLoadingSocial ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {socialAccounts.length > 0 && (
                          <div className="w-4 h-4 mr-2 relative">
                            <Image
                              src={getPlatformIcon(socialAccounts[0].platform)}
                              alt={socialAccounts[0].platform}
                              width={16}
                              height={16}
                              className="object-contain"
                            />
                          </div>
                        )}
                        <RefreshCcw className="w-4 h-4 mr-2" />
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
          <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connect your social accounts in the previous step to automatically
              import profile information.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="first_name"
              className={`block text-sm font-medium ${
                errors.first_name
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              First Name
              {errors.first_name && (
                <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                  *
                </span>
              )}
            </label>
            <input
              id="first_name"
              type="text"
              {...register("first_name")}
              className={
                errors.first_name ? inputClasses.error : inputClasses.default
              }
              aria-invalid={errors.first_name ? "true" : "false"}
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="last_name"
              className={`block text-sm font-medium ${
                errors.last_name
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              Last Name
              {errors.last_name && (
                <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                  *
                </span>
              )}
            </label>
            <input
              id="last_name"
              type="text"
              {...register("last_name")}
              className={
                errors.last_name ? inputClasses.error : inputClasses.default
              }
              aria-invalid={errors.last_name ? "true" : "false"}
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.last_name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="bio"
              className={`block text-sm font-medium ${
                errors.bio
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              Bio
              {errors.bio && (
                <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                  *
                </span>
              )}
            </label>
            <textarea
              id="bio"
              rows={4}
              {...register("bio")}
              className={errors.bio ? inputClasses.error : inputClasses.default}
              aria-invalid={errors.bio ? "true" : "false"}
              placeholder="Tell us a bit about yourself..."
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.bio.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/protected/onboarding/social-media"
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white 
                bg-blue-600 dark:bg-blue-500 
                rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-blue-500 dark:focus:ring-blue-400
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-500"
            >
              {isSubmitting ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
