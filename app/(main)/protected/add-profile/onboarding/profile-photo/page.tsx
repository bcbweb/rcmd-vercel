"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepProgress } from "@/components/common";
import { ProfilePhotoUpload } from "@/components/common/media";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

// Key for storing all profile data until final submission
const PROFILE_DATA_KEY = "add_profile_data";

export default function ProfilePhotoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const supabase = createClient();

  // Load from session storage
  useEffect(() => {
    // Get profile ID from session storage
    const newProfileId = sessionStorage.getItem("new_profile_id");
    if (!newProfileId) {
      router.push("/protected/add-profile");
      return;
    }

    setProfileId(newProfileId);

    // Get profile type
    const type = sessionStorage.getItem("new_profile_type");
    if (type) {
      setProfileType(type);
    }

    setIsLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileId) {
      toast.error("Profile ID not found. Please restart the process.");
      return;
    }

    try {
      setIsSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Get all collected profile data from session storage
      const profileDataStr = sessionStorage.getItem(PROFILE_DATA_KEY);
      if (!profileDataStr) {
        throw new Error("Profile data not found. Please restart the process.");
      }

      const profileData = JSON.parse(profileDataStr);
      const { basicInfo } = profileData;

      // Get profile type from session storage
      const profileType = sessionStorage.getItem("new_profile_type") || profileData.profileType || "creator";

      // Create the profile in the database
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          ...basicInfo,
          profile_picture_url: avatarUrl,
          profile_type: profileType,
          is_onboarded: true,
        })
        .select("id")
        .single();

      if (profileError) throw profileError;

      if (!newProfile) {
        throw new Error("Failed to create profile");
      }

      const realProfileId = newProfile.id;

      // Set this profile as the active profile
      await supabase.rpc("set_active_profile", {
        p_profile_id: realProfileId,
      });

      // Save additional data based on profile type
      if (profileType === "business" && profileData.businessDetails) {
        // Handle business-specific details
        // You could store additional business details in a separate table if needed
        await supabase
          .from("profiles")
          .update({
            location: profileData.businessDetails.location,
            tags: profileData.businessDetails.tags,
          })
          .eq("id", realProfileId);
      } else if (profileType === "creator" && profileData.creatorDetails) {
        // Handle creator-specific details
        await supabase
          .from("profiles")
          .update({
            location: profileData.creatorDetails.location,
            tags: profileData.creatorDetails.tags,
          })
          .eq("id", realProfileId);

        // Save social links in the profile_social_links table
        if (
          profileData.creatorDetails.socialLinks &&
          profileData.creatorDetails.socialLinks.length > 0
        ) {
          for (const link of profileData.creatorDetails.socialLinks) {
            await supabase.from("profile_social_links").insert({
              profile_id: realProfileId,
              platform: link.platform,
              handle: link.url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      // Clear all session and local storage related to the onboarding
      sessionStorage.removeItem("new_profile_id");
      sessionStorage.removeItem("new_profile_type");
      sessionStorage.removeItem(PROFILE_DATA_KEY);
      localStorage.removeItem("add_profile_basic_info");
      localStorage.removeItem("add_profile_business_details");
      localStorage.removeItem("add_profile_creator_details");

      toast.success("Profile created successfully!");
      router.push("/protected/profile");
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete profile creation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPhotoUploaded = (path: string) => {
    // Store the avatar URL for later use when creating the profile
    setAvatarUrl(path);
    toast.success("Profile photo uploaded successfully");
  };

  const getHeading = () => {
    return profileType === "business"
      ? "Add Business Logo"
      : profileType === "creator"
        ? "Add Profile Photo"
        : "Add Profile Photo";
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const previousStep =
    profileType === "business"
      ? "/protected/add-profile/onboarding/business-details"
      : profileType === "creator"
        ? "/protected/add-profile/onboarding/creator-details"
        : "/protected/add-profile/onboarding/basic-info";

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getHeading()}
        </h2>
        <StepProgress currentStep={3} totalSteps={3} />
      </div>

      <div className="p-6 space-y-6">
        <div className="text-center">
          <ProfilePhotoUpload onUploadComplete={onPhotoUploaded} />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {profileType === "business"
              ? "Upload your business logo (recommended size: 400x400 pixels)"
              : "Upload your profile photo (recommended size: 400x400 pixels)"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="pt-6">
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={previousStep}
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
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Completing..." : "Complete Setup"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
