"use client";

import { useEffect } from "react";
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
  const { profile, socialLinks, isLoading, fetchProfile } = useProfileStore();

  useEffect(() => {
    const initializeProfile = async () => {
      if (!userId) return;

      try {
        const result = await fetchProfile(userId);
        if (result.needsOnboarding) {
          router.push("/protected/onboarding");
        }
      } catch (error) {
        console.error("Failed to initialize profile:", error);
      }
    };

    initializeProfile();
  }, [userId, fetchProfile, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!userId || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        No user
      </div>
    );
  }

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
