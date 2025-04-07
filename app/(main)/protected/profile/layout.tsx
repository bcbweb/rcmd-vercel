"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/features/profile/header";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const { profile, socialLinks, isLoading, fetchProfile } = useProfileStore();
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Helper function to fetch profile data
  const loadProfile = useCallback(async () => {
    if (!userId) {
      setIsPageLoading(false);
      return;
    }

    try {
      const result = await fetchProfile(userId);
      if (result.needsOnboarding) {
        router.push("/protected/onboarding");
      }
    } catch (error) {
      console.error("Failed to initialize profile:", error);
    } finally {
      setIsPageLoading(false);
    }
  }, [userId, fetchProfile, router, setIsPageLoading]);

  // Initial profile load
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    loadProfile();
  }, [userId, isInitialized, loadProfile]);

  // Keep monitor for stuck loading state but remove the console.log
  useEffect(() => {
    if (!isLoading) return;

    // Set a reasonable timeout (5 seconds) to detect stuck loading state
    const timeoutId = setTimeout(() => {
      // No action needed, this is just a safety measure
      // If we have a profile but loading state is stuck, the UI will still render
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isLoading, profile]);

  // Show loading screen while page is initializing
  if (isPageLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="text-lg">Loading...</div>
          <div className="text-sm text-gray-500 mt-2">
            Initializing your profile
          </div>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!userId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="text-lg">Authentication error</div>
          <div className="text-sm text-gray-500 mt-2">
            User not found or session expired
          </div>
        </div>
      </div>
    );
  }

  // Only show loading if we don't have a profile yet
  // This prevents a stuck loading state when returning to the tab
  if (isLoading && !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="text-lg">Loading profile...</div>
          <div className="text-sm text-gray-500 mt-2">
            Fetching your latest data
          </div>
        </div>
      </div>
    );
  }

  // If we have a profile, render it even if isLoading is true
  // This ensures we don't get stuck on a loading screen
  if (profile) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8 px-4">
        <ProfileHeader
          handle={profile.handle || ""}
          firstName={profile.first_name || ""}
          lastName={profile.last_name || ""}
          profilePictureUrl={profile.profile_picture_url || ""}
          coverImageUrl={profile.cover_image || ""}
          interests={profile.interests}
          tags={profile.tags}
          bio={profile.bio || ""}
          location={profile.location || ""}
          socialLinks={socialLinks}
        />
        <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
        {children}
      </div>
    );
  }

  // Fallback loading state - should rarely hit this
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg">Loading profile data...</div>
    </div>
  );
}
