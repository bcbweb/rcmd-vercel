"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "@/types";

interface ProfileFeedProps {
  currentHandle: string;
}

export function ProfileFeed({ currentHandle }: ProfileFeedProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [viewedProfiles] = useState(new Set<string>());
  const supabase = createClient();

  const fetchProfileByHandle = useCallback(async (handle: string) => {
    console.log("[DEBUG] Fetching profile for handle:", handle);
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("handle", handle)
      .single();

    if (error) {
      console.error("[DEBUG] Error fetching profile:", error);
      return null;
    }

    return profile;
  }, []);

  const fetchNextProfile = useCallback(async () => {
    console.log(
      "[DEBUG] Fetching next profile. Already viewed:",
      viewedProfiles
    );
    const { data: profiles, error } = await supabase.rpc("get_random_profile", {
      excluded_handles: Array.from(viewedProfiles),
    });

    if (error) {
      console.error("[DEBUG] Error fetching next profile:", error);
      return null;
    }

    if (!profiles || profiles.length === 0) {
      console.log("[DEBUG] No more profiles to fetch");
      return null;
    }

    return profiles[0];
  }, [viewedProfiles]);

  // Initial load of current and next profiles
  useEffect(() => {
    async function loadProfiles() {
      if (!currentHandle) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch current profile
        const currentProfile = await fetchProfileByHandle(currentHandle);
        if (!currentProfile) {
          setError("Profile not found");
          return;
        }

        // Add current profile to viewed set
        viewedProfiles.add(currentProfile.handle);
        console.log(
          "[DEBUG] Added current profile to viewed:",
          currentProfile.handle
        );

        // Initialize profiles array with current profile
        const initialProfiles = [currentProfile];
        setProfiles(initialProfiles);

        // Fetch first additional profile
        const firstNext = await fetchNextProfile();
        if (firstNext?.handle) {
          viewedProfiles.add(firstNext.handle);
          initialProfiles.push(firstNext);
          setProfiles([...initialProfiles]);
          console.log("[DEBUG] Added first next profile:", firstNext.handle);

          // Only fetch second profile if we got the first one
          const secondNext = await fetchNextProfile();
          if (secondNext?.handle) {
            viewedProfiles.add(secondNext.handle);
            initialProfiles.push(secondNext);
            setProfiles([...initialProfiles]);
            console.log(
              "[DEBUG] Added second next profile:",
              secondNext.handle
            );
          }
        }
      } catch (error) {
        console.error("[DEBUG] Error loading profiles:", error);
        setError("Error loading profile");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfiles();
  }, [currentHandle, fetchProfileByHandle, fetchNextProfile, viewedProfiles]);

  // Track when scroll snap completes
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    function handleScrollEnd() {
      // Get the scroll position and container height
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      // Calculate which profile should be in view based on scroll position
      const snapIndex = Math.round(scrollTop / containerHeight);
      console.log(
        "[DEBUG] Scroll ended. Position:",
        scrollTop,
        "Container height:",
        containerHeight,
        "Calculated index:",
        snapIndex
      );

      if (
        snapIndex >= 0 &&
        snapIndex < profiles.length &&
        snapIndex !== focusedIndex
      ) {
        const currentProfile = profiles[snapIndex];
        console.log("[DEBUG] Snapped to profile:", currentProfile.handle);

        setFocusedIndex(snapIndex);

        // If we've scrolled to a new profile
        if (snapIndex > 0) {
          // Update URL to reflect current profile
          window.history.replaceState(
            null,
            "",
            `/explore/people/feed/${currentProfile.handle}`
          );

          // Fetch another profile to maintain the stack
          fetchNextProfile().then((nextProfile) => {
            if (nextProfile?.handle) {
              viewedProfiles.add(nextProfile.handle);
              setProfiles((prevProfiles) => [...prevProfiles, nextProfile]);
              console.log(
                "[DEBUG] Added new profile to stack:",
                nextProfile.handle
              );
            }
          });
        }
      }
    }

    // Use scrollend event
    container.addEventListener("scrollend", handleScrollEnd);

    // Also listen for regular scroll end as fallback for older browsers
    let scrollTimeout: NodeJS.Timeout;
    function handleScroll() {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150); // Wait for scroll to settle
    }
    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scrollend", handleScrollEnd);
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [profiles, fetchNextProfile, viewedProfiles, focusedIndex]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center">
          <p className="text-xl">{error}</p>
          <button
            onClick={() => router.push("/explore/people")}
            className="mt-4 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto bg-black text-white [scroll-behavior:smooth] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] [transition-duration:150ms]"
      style={{
        scrollSnapType: "y mandatory",
        scrollPaddingTop: "16px",
        overscrollBehavior: "contain",
      }}
    >
      {/* Floating Back Button */}
      <button
        onClick={() => router.push("/explore/people")}
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Profile Stack */}
      {profiles.map((profile, index) => (
        <div
          key={profile.handle}
          className="min-h-[50vh] max-h-[90vh] py-12"
          style={{
            scrollSnapAlign: "start",
            scrollSnapStop: "always",
          }}
        >
          <div className="px-4 max-w-2xl mx-auto h-full">
            <div className="flex flex-col min-h-0">
              <div
                className="transition-opacity duration-300"
                style={{ opacity: focusedIndex === index ? 1 : 0.3 }}
              >
                <div className="relative aspect-square w-full mb-6 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={profile.profile_picture_url || "/default-avatar.png"}
                    alt={profile.handle || ""}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className="text-gray-400 text-lg">@{profile.handle}</p>
                  {profile.bio && (
                    <p className="text-gray-300 mt-2">{profile.bio}</p>
                  )}

                  <div className="pt-4">
                    <button
                      className="inline-block bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full transition-colors"
                      onClick={() => router.push(`/${profile.handle}`)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
