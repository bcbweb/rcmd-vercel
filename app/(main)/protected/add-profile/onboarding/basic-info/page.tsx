"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepProgress } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { URLHandleInput } from "@/components/common/forms";

// Define profile types and their storage keys
const PROFILE_TYPES = {
  business: "business",
  creator: "creator",
};

const STORAGE_KEY = "add_profile_basic_info";
// Key for storing all profile data until final submission
const PROFILE_DATA_KEY = "add_profile_data";

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

interface BasicInfoFormData {
  name: string;
  handle: string;
  type: string;
  description: string;
}

export default function BasicInfoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [isHandleAvailable, setIsHandleAvailable] = useState(false);
  const [profileType, setProfileType] = useState<string>("");
  const supabase = createClient();

  const [formData, setFormData] = useState<BasicInfoFormData>({
    name: "",
    handle: "",
    type: "",
    description: "",
  });

  const [initialHandle] = useState<string>("");

  // Load profile type from session storage
  useEffect(() => {
    const type = sessionStorage.getItem("new_profile_type");
    if (!type) {
      router.push("/protected/add-profile");
      return;
    }

    setProfileType(type);
    setFormData((prev) => ({ ...prev, type }));

    // Try to load from localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.type === type) {
          setFormData(parsedData);
        }
      } catch (error) {
        console.error("Error parsing saved data:", error);
      }
    }

    setIsLoading(false);
  }, [router]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isLoading]);

  const isFormValid = Boolean(
    formData.name &&
      formData.handle &&
      isHandleAvailable &&
      !isCheckingHandle &&
      formData.description
  );

  const sanitizeHandle = (handle: string) => {
    if (!handle) return "";

    // Save original value for comparison
    const originalHandle = handle.toLowerCase();

    // Apply sanitization steps
    let sanitized = originalHandle;
    sanitized = sanitized.replace(/[^a-z0-9-_]/g, "");
    sanitized = sanitized.replace(/[-_]{2,}/g, "-");
    sanitized = sanitized.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");

    // If sanitized value is the same as the original, just return it to avoid re-renders
    if (sanitized === originalHandle) {
      return originalHandle;
    }

    return sanitized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Additional validation to prevent infinite loops
    if (isCheckingHandle) {
      toast.error("Please wait for handle validation to complete");
      return;
    }

    // Only validate handle if it has changed from the initial value
    if (!isHandleAvailable) {
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

      // One more availability check before submitting
      const { data } = await supabase
        .from("profiles")
        .select("handle")
        .ilike("handle", sanitizedHandle)
        .maybeSingle();

      if (data) {
        toast.error("This handle is already taken. Please choose another one.");
        setIsSubmitting(false);
        return;
      }

      // Instead of creating a profile in the database now,
      // store the data in session storage for later use
      const profileData = {
        basicInfo: {
          auth_user_id: user.id,
          handle: sanitizedHandle,
          first_name: formData.name,
          bio: formData.description,
          email: user.email,
          is_onboarded: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        profileType: formData.type,
      };

      // Store the profile data in sessionStorage for next steps
      sessionStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(profileData));

      // Generate a temporary ID to use throughout the flow
      // This will be replaced with the real ID when we save to the database
      const tempId = `temp_${Date.now()}`;
      sessionStorage.setItem("new_profile_id", tempId);

      toast.success("Basic info saved!");

      // Redirect to the next step based on profile type
      if (profileType === PROFILE_TYPES.business) {
        router.push("/protected/add-profile/onboarding/business-details");
      } else if (profileType === PROFILE_TYPES.creator) {
        router.push("/protected/add-profile/onboarding/creator-details");
      } else {
        router.push("/protected/add-profile/onboarding/profile-photo");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save basic info");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different heading based on profile type
  const getHeading = () => {
    if (profileType === PROFILE_TYPES.business) {
      return "Create Business Profile";
    } else if (profileType === PROFILE_TYPES.creator) {
      return "Create Creator Profile";
    }
    return "Create New Profile";
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
          {getHeading()}
        </h2>
        <StepProgress currentStep={1} totalSteps={3} />
      </div>

      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Profile Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className={inputClasses.default}
              placeholder={
                profileType === PROFILE_TYPES.business
                  ? "Your Business Name"
                  : "Your Creator Name"
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              URL Handle
            </label>
            <div className="mt-1">
              <URLHandleInput
                value={formData.handle}
                onChange={(handle) => {
                  // Only update if handle has changed to prevent unnecessary revalidation
                  if (formData.handle !== handle) {
                    setFormData((prev) => ({
                      ...prev,
                      handle: sanitizeHandle(handle),
                    }));
                  }
                }}
                currentHandle={initialHandle}
                onAvailabilityChange={(status) => {
                  setIsCheckingHandle(status.isChecking);
                  setIsHandleAvailable(status.isAvailable);
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {profileType === PROFILE_TYPES.business
                ? "Business Description"
                : "Bio"}
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className={inputClasses.default}
              placeholder="Tell us about your profile..."
              required
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/protected/add-profile"
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
              {isSubmitting ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
