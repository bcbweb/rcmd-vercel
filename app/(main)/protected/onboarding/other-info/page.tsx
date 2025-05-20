"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepProgress } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { TagInput } from "@/components/common/forms";
import { URLHandleInput } from "@/components/common/forms";
import countries from "@/data/countries.json";
import { ensureUserProfile } from "@/utils/profile-utils";
import {
  getUserSocialIntegrations,
  getProfileDataFromSocial,
} from "@/utils/social-auth";
import { Loader2, Import } from "lucide-react";

interface OtherInfoFormData {
  handle: string;
  location: string;
  interests: string[];
  tags: string[];
}

const STORAGE_KEY = "onboarding_other_info";

export default function OtherInfoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportingSocial, setIsImportingSocial] = useState(false);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [isHandleAvailable, setIsHandleAvailable] = useState(false);
  const [hasSocialAccounts, setHasSocialAccounts] = useState(false);
  const [isCheckingSocial, setIsCheckingSocial] = useState(true);
  const supabase = createClient();

  const [formData, setFormData] = useState<OtherInfoFormData>({
    handle: "",
    location: "",
    interests: [],
    tags: [],
  });

  const [initialHandle, setInitialHandle] = useState<string>("");

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isLoading]);

  // Check if the user has any connected social accounts
  useEffect(() => {
    const checkSocialAccounts = async () => {
      setIsCheckingSocial(true);
      try {
        console.log("[DEBUG] Other-info: Checking social accounts...");
        const integrations = await getUserSocialIntegrations();
        console.log("[DEBUG] Other-info: Found integrations:", integrations);
        setHasSocialAccounts(integrations.length > 0);
        console.log(
          "[DEBUG] Other-info: hasSocialAccounts set to:",
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

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Ensure profile exists
      const profileId = await ensureUserProfile(user.id);
      if (!profileId) {
        throw new Error("Failed to ensure profile exists");
      }

      // Try to load from localStorage first
      const savedData = localStorage.getItem(STORAGE_KEY);
      let localData: OtherInfoFormData | null = null;

      if (savedData) {
        localData = JSON.parse(savedData);
      }

      // Now fetch profile data
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("handle, location, interests, tags, bio, is_onboarded")
        .eq("auth_user_id", user.id)
        .single();

      if (error) {
        throw error;
      }

      if (profile) {
        // If the profile is already onboarded, redirect to profile page
        if (profile.is_onboarded) {
          router.push("/protected/profile");
          return;
        }

        // Merge localStorage data with profile data, preferring localStorage
        setFormData({
          handle: localData?.handle || profile.handle || "",
          location: localData?.location || profile.location || "",
          interests: localData?.interests || profile.interests || [],
          tags: localData?.tags || profile.tags || [],
        });

        setInitialHandle(profile.handle || "");

        // Check if handle is available
        if (profile.handle) {
          setIsHandleAvailable(true);
        }
      } else if (localData) {
        // If no profile but localStorage data exists, use it
        setFormData(localData);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [supabase, router]);

  const isFormValid = Boolean(
    formData.handle &&
      (isHandleAvailable || formData.handle === initialHandle) &&
      !isCheckingHandle &&
      formData.location
  );

  const sanitizeHandle = (handle: string) => {
    if (!handle) return "";
    let sanitized = handle.toLowerCase();
    sanitized = sanitized.replace(/[^a-z0-9-_]/g, "");
    sanitized = sanitized.replace(/[-_]{2,}/g, "-");
    sanitized = sanitized.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
    return sanitized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isHandleAvailable && formData.handle !== initialHandle) {
      toast.error("Please choose an available handle");
      return;
    }

    try {
      setIsSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const sanitizedHandle = sanitizeHandle(formData.handle);

      const { error } = await supabase
        .from("profiles")
        .update({
          handle: sanitizedHandle,
          location: formData.location,
          interests: formData.interests,
          tags: formData.tags,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_user_id", user.id);

      if (error) throw error;

      // Clear localStorage after successful submission
      localStorage.removeItem(STORAGE_KEY);

      toast.success("Profile updated successfully!");
      router.push("/protected/profile");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save other info");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Import interests and other data from social accounts
  const importFromSocial = async () => {
    setIsImportingSocial(true);
    try {
      // Pass undefined to use default prioritization
      const socialData = await getProfileDataFromSocial();

      if (!socialData || Object.keys(socialData).length === 0) {
        toast.error("No profile data found from your connected accounts");
        return;
      }

      // Create a new formData object with imported interests
      const newFormData = { ...formData };

      // Import interests if available
      if (socialData.interests && socialData.interests.length > 0) {
        // Add new interests without duplicates
        const existingInterests = new Set(formData.interests);
        const newInterests = socialData.interests.filter(
          (interest) => !existingInterests.has(interest)
        );

        newFormData.interests = [...formData.interests, ...newInterests];
        toast.success(
          `Added ${newInterests.length} interests from your social accounts`
        );
      }

      // Update form data
      setFormData(newFormData);
    } catch (error) {
      console.error("Error importing social data:", error);
      toast.error("Failed to import data from social accounts");
    } finally {
      setIsImportingSocial(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Tell us more about you
        </h2>
        <StepProgress currentStep={4} totalSteps={4} />
      </div>

      <div className="p-6 space-y-6">
        {isCheckingSocial ? (
          <div className="flex items-center space-x-2 mb-6 text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking social accounts...</span>
          </div>
        ) : hasSocialAccounts ? (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Import Interests from Social Media
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                  We can suggest interests based on your connected social
                  accounts to help others discover your profile.
                </p>
              </div>
              <button
                type="button"
                onClick={importFromSocial}
                disabled={isImportingSocial}
                className="inline-flex items-center justify-center px-3 py-1.5 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors sm:w-auto w-full"
              >
                {isImportingSocial ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Import className="w-4 h-4 mr-2" />
                    Import Interests
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connect social accounts in the earlier steps to automatically
              generate interest suggestions.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              URL Handle
            </label>
            <div className="mt-1">
              <URLHandleInput
                value={formData.handle}
                onChange={(handle) =>
                  setFormData((prev) => ({
                    ...prev,
                    handle: sanitizeHandle(handle),
                  }))
                }
                currentHandle={initialHandle}
                onAvailabilityChange={(status) => {
                  setIsCheckingHandle(status.isChecking);
                  setIsHandleAvailable(status.isAvailable);
                }}
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Location
            </label>
            <div className="relative mt-1">
              <select
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                className="mt-1 block w-full px-4 py-2 
        bg-white dark:bg-gray-700
        text-gray-900 dark:text-white 
        rounded-md 
        border border-gray-300 dark:border-gray-600
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
        dark:focus:ring-blue-500 dark:focus:border-blue-500 
        focus:outline-none appearance-none 
        cursor-pointer text-base pr-10"
              >
                <option value="" className="bg-white dark:bg-gray-800">
                  Select a country
                </option>
                {countries.map((country) => (
                  <option
                    key={country.code}
                    value={country.code}
                    className="bg-white dark:bg-gray-800"
                  >
                    {country.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Interests
            </label>
            <TagInput
              tags={formData.interests}
              onChange={(interests) =>
                setFormData((prev) => ({ ...prev, interests }))
              }
              placeholder="Add interests..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tags
            </label>
            <TagInput
              tags={formData.tags}
              onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
              placeholder="Add tags..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/protected/onboarding/profile-photo"
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
              disabled={!isFormValid || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white 
              bg-blue-600 dark:bg-blue-500 
              rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 
              focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-blue-500 dark:focus:ring-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Complete"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
