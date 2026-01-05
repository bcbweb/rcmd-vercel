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

  const fetchProfileByHandle = useCallback(
    async (handle: string) => {
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
    },
    [supabase]
  );

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
  }, [viewedProfiles, supabase]);

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

  // Track when profiles enter/leave viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Create observer to track which profiles are fully visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.95) {
            const handle = entry.target.getAttribute("data-profile-handle");
            const index = profiles.findIndex((p) => p.handle === handle);

            console.log(
              "[DEBUG] Profile in view:",
              handle,
              "ratio:",
              entry.intersectionRatio,
              "index:",
              index
            );

            if (index !== -1 && index !== focusedIndex) {
              const currentProfile = profiles[index];
              console.log(
                "[DEBUG] Updating to profile:",
                currentProfile.handle
              );

              setFocusedIndex(index);

              // Update URL and fetch next profile if needed
              if (index > 0) {
                window.history.replaceState(
                  null,
                  "",
                  `/explore/people/feed/${currentProfile.handle}`
                );

                // Fetch another profile if we're near the end
                if (index >= profiles.length - 2) {
                  fetchNextProfile().then((nextProfile) => {
                    if (nextProfile?.handle) {
                      viewedProfiles.add(nextProfile.handle);
                      setProfiles((prevProfiles) => [
                        ...prevProfiles,
                        nextProfile,
                      ]);
                      console.log(
                        "[DEBUG] Added new profile to stack:",
                        nextProfile.handle
                      );
                    }
                  });
                }
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: [0.95], // Trigger when profile is almost fully visible
        rootMargin: "0px",
      }
    );

    // Observe all profile elements
    Array.from(container.children).forEach((child) => {
      if (
        child instanceof HTMLElement &&
        child.hasAttribute("data-profile-handle")
      ) {
        observer.observe(child);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [profiles, fetchNextProfile, viewedProfiles, focusedIndex]);

  // Remove the previous scroll event listeners
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Keep a basic scroll handler just for debugging
    function handleScroll() {
      console.log("[DEBUG] Scroll position:", container.scrollTop);
    }

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
          data-profile-handle={profile.handle}
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
