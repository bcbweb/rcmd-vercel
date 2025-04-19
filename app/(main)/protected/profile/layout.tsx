"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const { profile, socialLinks, pages, isLoading, fetchProfile, fetchPages } =
    useProfileStore();
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Refs to prevent infinite reloads
  const isLoadingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Helper function to fetch profile data
  const loadProfile = useCallback(
    async (force = false) => {
      if (!userId) {
        setIsPageLoading(false);
        return;
      }

      // Prevent multiple simultaneous fetches
      if (isLoadingRef.current && !force) {
        return;
      }

      // Debounce - don't fetch if we just did (within the last 2 seconds)
      const now = Date.now();
      if (!force && now - lastFetchTimeRef.current < 2000) {
        return;
      }

      try {
        isLoadingRef.current = true;
        lastFetchTimeRef.current = now;

        // Fetch both profile and pages data
        const result = await fetchProfile(userId);
        if (result.needsOnboarding) {
          router.push("/protected/onboarding");
        } else {
          // Fetch pages only if user doesn't need onboarding
          await fetchPages(userId);
        }
      } catch (error) {
        console.error("Failed to initialize profile:", error);
      } finally {
        isLoadingRef.current = false;
        setIsPageLoading(false);
      }
    },
    [userId, fetchProfile, fetchPages, router, setIsPageLoading]
  );

  // Initial profile load - only load when userId or isInitialized changes
  // Don't trigger on every render or lastFetchTimestamp change
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    loadProfile(true); // force the initial load
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
          customPages={pages}
          defaultPageId={profile.default_page_id}
          defaultPageType={profile.default_page_type}
          onUpdate={loadProfile}
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
