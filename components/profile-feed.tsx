"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "@/types";

interface ProfileFeedProps {
  currentHandle: string;
}

export function ProfileFeed({ currentHandle }: ProfileFeedProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nextProfile, setNextProfile] = useState<Profile | null>(null);
  const [prevProfile, setPrevProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch current profile
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", currentHandle)
        .single();

      if (currentProfile) {
        setProfile(currentProfile);

        // Fetch next profile with full profile data
        const { data: nextProfiles } = await supabase
          .from("profiles")
          .select("*")
          .gt("created_at", currentProfile.created_at)
          .order("created_at", { ascending: true })
          .limit(1);

        setNextProfile(nextProfiles?.[0] || null);

        // Fetch previous profile with full profile data
        const { data: prevProfiles } = await supabase
          .from("profiles")
          .select("*")
          .lt("created_at", currentProfile.created_at)
          .order("created_at", { ascending: false })
          .limit(1);

        setPrevProfile(prevProfiles?.[0] || null);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentHandle]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const navigateToProfile = (handle: string | null) => {
    if (handle) {
      router.push(`/explore/people/feed/${handle}`);
    }
  };

  const handlers = useSwipeable({
    onSwipedUp: () => nextProfile?.handle && navigateToProfile(nextProfile.handle),
    onSwipedDown: () => prevProfile?.handle && navigateToProfile(prevProfile.handle),
    trackMouse: true
  });

  if (isLoading || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div {...handlers} className="relative h-screen w-full flex items-center justify-center">
      {/* Navigation Arrows for Desktop */}
      {prevProfile && (
        <button
          onClick={() => navigateToProfile(prevProfile.handle)}
          className="hidden md:flex absolute left-4 z-10 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {nextProfile && (
        <button
          onClick={() => navigateToProfile(nextProfile.handle)}
          className="hidden md:flex absolute right-4 z-10 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Profile Content */}
      <div className="relative w-full max-w-2xl mx-auto p-6">
        <div className="aspect-square relative mb-6">
          <Image
            src={profile.profile_picture_url || "/default-avatar.png"}
            alt={profile.handle || ""}
            fill
            className="object-cover rounded-lg"
          />
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">
              {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              @{profile.handle}
            </p>
          </div>

          {profile.bio && (
            <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
          )}

          {/* Add more profile information here */}
        </div>

        {/* Mobile navigation hints */}
        <div className="md:hidden text-center text-sm text-gray-500 mt-8">
          <p>Swipe up or down to navigate between profiles</p>
        </div>
      </div>
    </div>
  );
}