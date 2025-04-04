"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { RCMD } from "@/types";
import Link from "next/link";

const ITEMS_PER_PAGE = 3;

interface RCMDFeedProps {
  currentId: string;
}

export function RCMDFeed({ currentId }: RCMDFeedProps) {
  const router = useRouter();
  const [rcmds, setRCMDs] = useState<RCMD[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Changed to false
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchRCMDs = useCallback(async (isInitial: boolean = false) => {
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
        .order("created_at", { ascending: false })
        .limit(ITEMS_PER_PAGE);

    try {
      let query = createBaseQuery();

      if (isInitial && currentId) {
        // Get the current RCMD first
        const { data: currentRCMD } = await createBaseQuery()
          .eq("id", currentId)
          .limit(1)
          .single();

        // If found, create new query with timestamp condition
        if (currentRCMD) {
          query = createBaseQuery().lte("created_at", currentRCMD.created_at);
        }
      } else if (rcmds.length > 0) {
        // Pagination query
        query = createBaseQuery().lt("created_at", rcmds[rcmds.length - 1].created_at);
      }

      const { data: newRCMDs, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (newRCMDs) {
        const rcmdsArray = Array.isArray(newRCMDs) ? newRCMDs : [newRCMDs];
        setRCMDs(prev => isInitial ? rcmdsArray : [...prev, ...rcmdsArray]);
        setHasMore(rcmdsArray.length === ITEMS_PER_PAGE);
      } else {
        if (isInitial) setRCMDs([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching RCMDs:", error);
      setError("Error loading RCMDs");
      setRCMDs([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentId, isLoading, rcmds]);

  useEffect(() => {
    setRCMDs([]); // Reset rcmds when currentId changes
    setHasMore(true); // Reset hasMore
    fetchRCMDs(true);
  }, [currentId]);

  // Initial load
  useEffect(() => {
    fetchRCMDs(true);
  }, [currentId]);

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // If the target is visible and we have more items to load
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchRCMDs(false);
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: '100px', // Start loading before the element is visible
        threshold: 0.1, // Trigger when even 10% of the target is visible
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, fetchRCMDs]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center">
          <p className="text-xl">{error}</p>
          <button
            onClick={() => router.push('/explore/rcmds')}
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
            onClick={() => router.push('/explore/rcmds')}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Explore RCMDs</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Feed Content */}
      <div className="pt-14 pb-4 px-4 max-w-2xl mx-auto">
        {rcmds.map((rcmd, index) => (
          <div
            key={rcmd.id}
            className="mb-8"
          >
            <Link href={`/rcmd/${rcmd.id}`} className="block">
              <div className="relative aspect-square w-full mb-4">
                <Image
                  src={rcmd.featured_image || "/default-rcmd.png"}
                  alt={rcmd.title || ""}
                  fill
                  className="object-cover rounded-lg"
                  priority={index < 2}
                />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold">{rcmd.title}</h2>
                {rcmd.description && (
                  <p className="text-gray-400">{rcmd.description}</p>
                )}

                {/* <div className="flex items-center gap-2 text-sm text-gray-400">
                  <img
                    src={rcmd.profiles?.[0]?.profile_picture_url || "/default-avatar.png"}
                    alt={`${rcmd.profiles?.[0]?.first_name}'s profile`}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>
                    {rcmd.profiles?.[0]?.first_name} {rcmd.profiles?.[0]?.last_name}
                  </span>
                  <span>•</span>
                  <span>{rcmd.like_count || 0} likes</span>
                </div> */}
              </div>
            </Link>
          </div>
        ))}

        {/* Observer target element */}
        <div
          ref={observerTarget}
          className="h-10 -mt-10"
          aria-hidden="true"
        />

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {!hasMore && rcmds.length > 0 && (
          <div className="text-center text-gray-500 py-4">
            No more RCMDs to load
          </div>
        )}
      </div>
    </div>
  );
}