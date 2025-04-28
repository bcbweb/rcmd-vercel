"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { Creator } from "@/types";
import Link from "next/link";

// Number of items to load at once
const ITEMS_PER_PAGE = 5;

interface CreatorFeedProps {
  currentHandle: string;
}

export function CreatorFeed({ currentHandle }: CreatorFeedProps) {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const creatorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const supabase = createClient();

  // Fetch creators from Supabase
  const fetchCreators = useCallback(
    async (isInitial: boolean = false) => {
      if (isLoading) return;

      setIsLoading(true);

      const baseSelect = `*`;

      const createBaseQuery = () =>
        supabase
          .from("creators")
          .select(baseSelect)
          .order("created_at", { ascending: false })
          .limit(ITEMS_PER_PAGE);

      try {
        let query = createBaseQuery();

        if (isInitial && currentHandle) {
          // Get the current creator first
          const { data: currentCreator, error: creatorError } =
            await createBaseQuery()
              .eq("handle", currentHandle)
              .limit(1)
              .single();

          if (creatorError && creatorError.code !== "PGRST116") {
            // PGRST116 is the "not found" error, which we can handle
            throw creatorError;
          }

          // If found, create new query with timestamp condition
          if (currentCreator) {
            query = createBaseQuery().lte(
              "created_at",
              currentCreator.created_at
            );
          }
        } else if (creators.length > 0) {
          // Pagination query
          query = createBaseQuery().lt(
            "created_at",
            creators[creators.length - 1].created_at
          );
        }

        const { data: newProfiles, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (newProfiles && newProfiles.length > 0) {
          const creatorsArray = Array.isArray(newProfiles)
            ? newProfiles
            : [newProfiles];

          // Filter duplicates
          const existingIds = new Set(creators.map((c) => c.id));
          const filteredNewCreators = creatorsArray.filter(
            (c) => !existingIds.has(c.id)
          );

          setCreators((prev) => {
            const newState = isInitial
              ? creatorsArray
              : [...prev, ...filteredNewCreators];
            // Update refs array size
            creatorRefs.current = Array(newState.length).fill(null);
            return newState;
          });
          setHasMore(creatorsArray.length === ITEMS_PER_PAGE);
        } else {
          if (isInitial) setCreators([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching creators:", error);
        setError("Error loading creators");
      } finally {
        setIsLoading(false);
      }
    },
    [currentHandle, isLoading, creators, supabase]
  );

  // Reset and fetch when handle changes
  useEffect(() => {
    setCreators([]);
    setHasMore(true);
    setCurrentFocusIndex(0);
    fetchCreators(true);
  }, [currentHandle, fetchCreators]);

  // Setup intersection observer for loading more creators
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchCreators(false);
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
  }, [hasMore, isLoading, fetchCreators]);

  // Setup scroll tracking to update the URL
  useEffect(() => {
    const handleScroll = () => {
      if (creators.length === 0) return;

      const viewportHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      const viewportCenter = scrollPosition + viewportHeight / 2;

      // Find the creator currently in the middle of the viewport
      let closestIndex = 0;
      let closestDistance = Infinity;

      creatorRefs.current.forEach((ref, index) => {
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
        const newHandle = creators[closestIndex]?.handle;
        if (newHandle) {
          window.history.replaceState(
            null,
            "",
            `/explore/creators/feed/${newHandle}`
          );
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [creators, currentFocusIndex]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center">
          <p className="text-xl">{error}</p>
          <button
            onClick={() => router.push("/explore/creators")}
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
            onClick={() => router.push("/explore/creators")}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Explore Creators</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Feed Content */}
      <div className="pt-14 pb-20 px-4 max-w-2xl mx-auto">
        {creators.map((creator, index) => (
          <div
            key={creator.id}
            ref={(el) => {
              creatorRefs.current[index] = el;
            }}
            className={`min-h-[90vh] flex flex-col justify-center py-12 transition-opacity duration-300 ${
              creators.length > 1 && index === currentFocusIndex
                ? "opacity-100"
                : "opacity-60"
            }`}
          >
            <Link
              href={`/${creator.handle}`}
              className="block"
              onClick={(e) => e.preventDefault()} // Prevent navigation, as we're already in the feed
            >
              <div className="relative aspect-square w-full mb-6 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={creator.profile_picture_url || "/default-avatar.png"}
                  alt={creator.handle || ""}
                  fill
                  className="object-cover"
                  priority={index < 3}
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold">{creator.name}</h2>
                <p className="text-gray-400 text-lg">@{creator.handle}</p>
                {creator.bio && (
                  <p className="text-gray-300 mt-2">{creator.bio}</p>
                )}

                <div className="pt-4">
                  <Link
                    href={`/${creator.handle}`}
                    className="inline-block bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full transition-colors"
                  >
                    View Profile
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

        {/* Scroll hint - only show when there's more than one creator and more to load */}
        {hasMore &&
          creators.length > 0 &&
          currentFocusIndex < creators.length - 1 && (
            <div className="fixed bottom-10 left-0 right-0 flex justify-center animate-bounce">
              <div className="bg-white/10 rounded-full p-3">
                <ArrowDown className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

        {/* End of feed message */}
        {!hasMore && creators.length > 0 && (
          <div className="text-center text-gray-500 py-8">
            You've reached the end of the feed
          </div>
        )}
      </div>
    </div>
  );
}
