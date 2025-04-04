"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { ProfileEditor } from "@/components/features/profile";
import {
  SocialMediaEditor,
  type SocialMediaFormData,
  type Platform,
} from "@/components/features/profile";
import { Spinner } from "@/components/ui/spinner";
import { useProfileStore } from "@/stores/profile-store";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { userId } = useAuthStore();
  const {
    profile,
    socialLinks,
    pages,
    fetchProfile,
    updateSocialLinks,
    fetchPages,
  } = useProfileStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [formData, setFormData] = useState({
    handle: "",
    location: "",
  });
  const [isHandleValid, setIsHandleValid] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      if (!userId) return;

      try {
        // Fetch profile pages if needed
        if (pages.length === 0) {
          await fetchPages(userId);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to load profile data");
      } finally {
        setPageLoading(false);
      }
    };

    initializeData();
  }, [userId, pages.length, fetchPages, supabase.auth]);

  useEffect(() => {
    if (profile) {
      setFormData({
        handle: profile.handle || "",
        location: profile.location || "",
      });
    }
  }, [profile]);

  const handleProfileChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !profile) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Update profile store
      await fetchProfile(userId);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSocialMedia = async (data: SocialMediaFormData) => {
    if (!userId || !profile) return;

    try {
      setIsUpdating(true);

      // Update database
      await updateSocialLinks(profile.id, data.socialLinks);

      toast.success("Social links updated successfully");
    } catch (error) {
      console.error("Social links error:", error);
      toast.error("Failed to update social links");
    } finally {
      setIsUpdating(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center h-full py-10">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!userId) {
    router.push("/sign-in");
    return null;
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">No profile found</p>
      </div>
    );
  }

  // Convert socialLinks to the expected format for SocialMediaEditor with explicit typing
  const formattedSocialLinks = socialLinks
    .filter((link) =>
      [
        "instagram",
        "twitter",
        "youtube",
        "tiktok",
        "linkedin",
        "facebook",
      ].includes(link.platform)
    )
    .map((link) => ({
      platform: link.platform as Platform,
      handle: link.handle,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Edit profile
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update your profile information and manage your social media
          connections.
        </p>
      </div>

      {/* Basic Information */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Basic Information
        </h2>
        <div className="space-y-6">
          <ProfileEditor
            handle={formData.handle}
            location={formData.location}
            currentHandle={profile.handle || ""}
            pages={pages}
            isLoading={isUpdating}
            isHandleValid={isHandleValid}
            onHandleChange={(value) => handleProfileChange("handle", value)}
            onLocationChange={(value) => handleProfileChange("location", value)}
            onHandleValidityChange={(status) =>
              setIsHandleValid(status.isAvailable)
            }
            onSubmit={handleUpdateProfile}
          />
        </div>
      </div>

      {/* Social Media Profiles */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Social Media Profiles
        </h2>
        <SocialMediaEditor
          initialData={{ socialLinks: formattedSocialLinks }}
          onSubmit={handleUpdateSocialMedia}
          isLoading={isUpdating}
        />
      </div>
    </div>
  );
}
