"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { RCMD } from "@/types";
import Link from "next/link";

// Number of items to load at once
const ITEMS_PER_PAGE = 5;

// Extended RCMD type that includes profiles
interface RCMDWithProfile extends RCMD {
  profiles?: {
    id: string;
    handle: string;
    first_name?: string | null;
    last_name?: string | null;
    profile_picture_url?: string | null;
    auth_user_id?: string | null;
    bio?: string | null;
  };
}

interface RCMDFeedProps {
  currentId: string;
}

export function RCMDFeed({ currentId }: RCMDFeedProps) {
  const router = useRouter();
  const [rcmds, setRCMDs] = useState<RCMDWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const rcmdRefs = useRef<(HTMLDivElement | null)[]>([]);
  const supabase = createClient();

  // Fetch RCMDs from Supabase
  const fetchRCMDs = useCallback(
    async (isInitial: boolean = false) => {
      if (isLoading) return;

      setIsLoading(true);

      const baseSelect = `
      *,
      profiles(
        id,
        auth_user_id,
        handle,
        first_name,
        last_name,
        profile_picture_url,
        bio
      )
    `;

      const createBaseQuery = () =>
        supabase
          .from("rcmds")
          .select(baseSelect)
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .limit(ITEMS_PER_PAGE);

      try {
        let query = createBaseQuery();

        if (isInitial && currentId) {
          // Get the current RCMD first
          const { data: currentRCMD, error: rcmdError } =
            await createBaseQuery().eq("id", currentId).limit(1).single();

          if (rcmdError && rcmdError.code !== "PGRST116") {
            // PGRST116 is the "not found" error, which we can handle
            throw rcmdError;
          }

          // If found, create new query with timestamp condition
          if (currentRCMD) {
            query = createBaseQuery().lte("created_at", currentRCMD.created_at);
          }
        } else if (rcmds.length > 0) {
          // Pagination query
          query = createBaseQuery().lt(
            "created_at",
            rcmds[rcmds.length - 1].created_at
          );
        }

        const { data: newRCMDs, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (newRCMDs && newRCMDs.length > 0) {
          const rcmdsArray = Array.isArray(newRCMDs) ? newRCMDs : [newRCMDs];

          // Filter duplicates
          const existingIds = new Set(rcmds.map((r) => r.id));
          const filteredNewRCMDs = rcmdsArray.filter(
            (r) => !existingIds.has(r.id)
          );

          setRCMDs((prev) => {
            const newState = isInitial
              ? rcmdsArray
              : [...prev, ...filteredNewRCMDs];
            // Update refs array size
            rcmdRefs.current = Array(newState.length).fill(null);
            return newState;
          });
          setHasMore(rcmdsArray.length === ITEMS_PER_PAGE);
        } else {
          if (isInitial) setRCMDs([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching RCMDs:", error);
        setError("Error loading RCMDs");
      } finally {
        setIsLoading(false);
      }
    },
    [currentId, isLoading, rcmds, supabase]
  );

  // Reset and fetch when ID changes
  useEffect(() => {
    setRCMDs([]); // Reset rcmds when currentId changes
    setHasMore(true); // Reset hasMore
    setCurrentFocusIndex(0); // Reset focus index
    fetchRCMDs(true);
  }, [currentId, fetchRCMDs]);

  // Setup intersection observer for loading more RCMDs
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchRCMDs(false);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, fetchRCMDs]);

  // Setup scroll tracking to update the URL
  useEffect(() => {
    const handleScroll = () => {
      if (rcmds.length === 0) return;

      const viewportHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      const viewportCenter = scrollPosition + viewportHeight / 2;

      // Find the RCMD currently in the middle of the viewport
      let closestIndex = 0;
      let closestDistance = Infinity;

      rcmdRefs.current.forEach((ref, index) => {
        if (!ref) return;

        const { top, height } = ref.getBoundingClientRect();
        const elementCenter = top + height / 2 + scrollPosition;
        const distance = Math.abs(elementCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      // Only update if the focus changed
      if (closestIndex !== currentFocusIndex) {
        setCurrentFocusIndex(closestIndex);

        // Update the URL without causing a page reload
        const newId = rcmds[closestIndex]?.id;
        if (newId) {
          window.history.replaceState(null, "", `/explore/rcmds/feed/${newId}`);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [rcmds, currentFocusIndex]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center">
          <p className="text-xl">{error}</p>
          <button
            onClick={() => router.push("/explore/rcmds")}
            className="mt-4 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/explore/rcmds")}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Explore RCMDs</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Feed Content */}
      <div className="pt-14 pb-20 px-4 max-w-2xl mx-auto">
        {rcmds.map((rcmd, index) => (
          <div
            key={rcmd.id}
            ref={(el) => {
              rcmdRefs.current[index] = el;
            }}
            className={`min-h-[90vh] flex flex-col justify-center py-12 transition-opacity duration-300 ${
              rcmds.length > 1 && index === currentFocusIndex
                ? "opacity-100"
                : "opacity-60"
            }`}
          >
            <Link
              href={`/rcmd/${rcmd.id}`}
              className="block"
              onClick={(e) => e.preventDefault()} // Prevent navigation, as we're already in the feed
            >
              <div className="relative aspect-square w-full mb-6 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={rcmd.featured_image || "/default-rcmd.png"}
                  alt={rcmd.title || ""}
                  fill
                  className="object-cover"
                  priority={index < 3}
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold">{rcmd.title}</h2>
                {rcmd.description && (
                  <p className="text-gray-300 mt-2">{rcmd.description}</p>
                )}

                {rcmd.profiles && (
                  <div className="flex items-center gap-2 text-gray-400 mt-2">
                    <span className="text-sm">By </span>
                    <Link
                      href={`/${rcmd.profiles.handle}`}
                      className="text-blue-400 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation(); // Allow this link to navigate
                      }}
                    >
                      {rcmd.profiles.first_name && rcmd.profiles.last_name
                        ? `${rcmd.profiles.first_name} ${rcmd.profiles.last_name}`
                        : rcmd.profiles.handle}
                    </Link>
                  </div>
                )}

                <div className="pt-4">
                  <Link
                    href={`/rcmd/${rcmd.id}`}
                    className="inline-block bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </Link>
          </div>
        ))}

        {/* Observer target element */}
        <div ref={observerTarget} className="h-20" aria-hidden="true" />

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Scroll hint - only show when there's more than one rcmd and more to load */}
        {hasMore &&
          rcmds.length > 0 &&
          currentFocusIndex < rcmds.length - 1 && (
            <div className="fixed bottom-10 left-0 right-0 flex justify-center animate-bounce">
              <div className="bg-white/10 rounded-full p-3">
                <ArrowDown className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

        {/* End of feed message */}
        {!hasMore && rcmds.length > 0 && (
          <div className="text-center text-gray-500 py-8">
            You've reached the end of the feed
          </div>
        )}
      </div>
    </div>
  );
}
