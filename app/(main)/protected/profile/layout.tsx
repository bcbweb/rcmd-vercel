"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/features/profile/header";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { ProfileInitializing } from "@/components/loading-states/profile-initializing";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { userId, status } = useAuthStore();
  const {
    profile,
    socialLinks,
    pages,
    isLoading,
    fetchProfile,
    fetchPages,
    initialized,
  } = useProfileStore();
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

  // Initial profile load - only load when userId or authentication status changes
  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      return;
    }

    loadProfile(true); // force the initial load
  }, [userId, status, loadProfile]);

  // Log status for debugging
  useEffect(() => {
    console.log(
      "Profile layout - auth status:",
      status,
      "userId:",
      userId,
      "profile init:",
      initialized,
      "isLoading:",
      isLoading,
      "isPageLoading:",
      isPageLoading
    );
  }, [status, userId, initialized, isLoading, isPageLoading]);

  // Keep monitor for stuck loading state but remove the console.log
  useEffect(() => {
    if (!isLoading) return;

    // Set a reasonable timeout (5 seconds) to detect stuck loading state
    const timeoutId = setTimeout(() => {
      // If still loading after timeout, force set page loading to false
      if (isPageLoading) {
        setIsPageLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isLoading, isPageLoading]);

  // If still initializing auth or profile, show the same initializing component as the main layout
  if (status !== "authenticated" || !initialized || isPageLoading) {
    return <ProfileInitializing />;
  }

  // If we have a profile, render it
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

  // If we're authenticated but don't have a profile, use the ProfileInitializing component
  return <ProfileInitializing />;
}
