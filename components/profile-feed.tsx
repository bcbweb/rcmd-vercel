"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "@/types";
import Link from "next/link";

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
          .lt("created_at", currentProfile.created_at)
          .order("created_at", { ascending: false })
          .limit(1);

        setNextProfile(nextProfiles?.[0] || null);

        // Fetch previous profile with full profile data
        const { data: prevProfiles } = await supabase
          .from("profiles")
          .select("*")
          .gt("created_at", currentProfile.created_at)
          .order("created_at", { ascending: true })
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
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  if (isLoading || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Custom Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/explore/people')}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Explore people</h1>
          <button className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
            {/* <Camera className="w-6 h-6" /> */}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div {...handlers} className="h-screen w-full flex items-center justify-center pt-14">
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

        {isLoading || !profile ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="w-full h-full">
            {/* Image Section */}
            <div className="relative w-full h-full">
              <div className="relative h-full w-fit mx-auto">
                <Link
                  href={`/${profile.handle}`}
                  className="block h-full hover:opacity-90 transition-opacity"
                >
                  <div className="relative h-full aspect-square">
                    <Image
                      src={profile.profile_picture_url || "/default-avatar.png"}
                      alt={profile.handle || ""}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </Link>
              </div>
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              <div className="space-y-2 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-lg text-gray-300">
                  @{profile.handle}
                </p>
                {profile.bio && (
                  <p className="text-gray-400">{profile.bio}</p>
                )}
              </div>

              {/* Mobile Navigation Indicator */}
              <div className="md:hidden text-center text-sm text-gray-500 mt-6">
                <p>Swipe up or down to see more</p>
              </div>
            </div>

            {/* Like Count */}
            <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2">
              <button className="p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <span className="text-sm">23.3K</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}