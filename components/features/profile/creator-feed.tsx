"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { Creator } from "@/types";
import Link from "next/link";

const ITEMS_PER_PAGE = 3;

interface CreatorFeedProps {
  currentHandle: string;
}

export function CreatorFeed({ currentHandle }: CreatorFeedProps) {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const supabase = createClient();

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
          const { data: currentCreator } = await createBaseQuery()
            .eq("handle", currentHandle)
            .limit(1)
            .single();

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

        if (newProfiles) {
          const creatorsArray = Array.isArray(newProfiles)
            ? newProfiles
            : [newProfiles];
          setCreators((prev) =>
            isInitial ? creatorsArray : [...prev, ...creatorsArray]
          );
          setHasMore(creatorsArray.length === ITEMS_PER_PAGE);
        } else {
          if (isInitial) setCreators([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching creators:", error);
        setError("Error loading creators");
        setCreators([]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentHandle, isLoading, creators, supabase]
  );

  useEffect(() => {
    setCreators([]); // Reset creators when currentHandle changes
    setHasMore(true); // Reset hasMore
    fetchCreators(true);
  }, [currentHandle, fetchCreators]);

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchCreators(false);
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, fetchCreators]);

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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/explore/people")}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Explore Creators</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Feed Content */}
      <div className="pt-14 pb-4 px-4 max-w-2xl mx-auto">
        {creators.map((creator, index) => (
          <div key={creator.id} className="mb-8">
            <Link href={`/${creator.handle}`} className="block">
              <div className="relative aspect-square w-full mb-4">
                <Image
                  src={creator.profile_picture_url || "/default-avatar.png"}
                  alt={creator.handle || ""}
                  fill
                  className="object-cover rounded-lg"
                  priority={index < 2}
                />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold">{creator.name}</h2>
                <p className="text-gray-400">@{creator.handle}</p>
                {creator.bio && <p className="text-gray-400">{creator.bio}</p>}
              </div>
            </Link>
          </div>
        ))}

        {/* Observer target element */}
        <div ref={observerTarget} className="h-10 -mt-10" aria-hidden="true" />

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {!hasMore && creators.length > 0 && (
          <div className="text-center text-gray-500 py-4">
            No more creators to load
          </div>
        )}
      </div>
    </div>
  );
}
