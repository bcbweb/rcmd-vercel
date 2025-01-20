"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { createClient } from "@/utils/supabase/client";
import type { RCMD } from "@/types"; // You'll need to create this type
import Link from "next/link";

interface RCMDFeedProps {
  currentId: string;
}

export function RCMDFeed({ currentId }: RCMDFeedProps) {
  const router = useRouter();
  const [rcmd, setRCMD] = useState<RCMD | null>(null);
  const [nextRCMD, setNextRCMD] = useState<RCMD | null>(null);
  const [prevRCMD, setPrevRCMD] = useState<RCMD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRCMDs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get the RCMD with profile using manual join
      const { data: currentRCMDs, error: currentError } = await supabase
        .from("rcmds")
        .select(`
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
        `)
        .eq("id", currentId)
        .limit(1);

      if (currentError) throw currentError;
      if (!currentRCMDs?.length) {
        setError("RCMD not found with profile");
        return;
      }

      const currentRCMD = currentRCMDs[0];
      setRCMD(currentRCMD);

      // Fetch next RCMD
      const { data: nextRCMDs } = await supabase
        .from("rcmds")
        .select(`
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
        `)
        .lt("created_at", currentRCMD.created_at)
        .order("created_at", { ascending: false })
        .limit(1);

      setNextRCMD(nextRCMDs?.[0] || null);

      // Fetch previous RCMD
      const { data: prevRCMDs } = await supabase
        .from("rcmds")
        .select(`
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
        `)
        .gt("created_at", currentRCMD.created_at)
        .order("created_at", { ascending: true })
        .limit(1);

      setPrevRCMD(prevRCMDs?.[0] || null);

    } catch (error) {
      console.error("Error fetching RCMDs:", error);
      setError("Error loading RCMD");
    } finally {
      setIsLoading(false);
    }
  }, [currentId]);

  useEffect(() => {
    fetchRCMDs();
  }, [fetchRCMDs]);

  const navigateToRCMD = (id: string | null) => {
    if (id) {
      router.push(`/explore/rcmds/feed/${id}`);
    }
  };

  const handlers = useSwipeable({
    onSwipedUp: () => nextRCMD?.id && navigateToRCMD(nextRCMD.id),
    onSwipedDown: () => prevRCMD?.id && navigateToRCMD(prevRCMD.id),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

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

  if (!rcmd) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Custom Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/explore/rcmds')}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Explore RCMDs</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Main Content */}
      <div {...handlers} className="h-screen w-full flex items-center justify-center pt-14">
        {/* Navigation Arrows for Desktop */}
        {prevRCMD && (
          <button
            onClick={() => navigateToRCMD(prevRCMD.id)}
            className="hidden md:flex absolute left-4 z-10 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {nextRCMD && (
          <button
            onClick={() => navigateToRCMD(nextRCMD.id)}
            className="hidden md:flex absolute right-4 z-10 p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        {isLoading || !rcmd ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="w-full h-full">
            {/* Image Section */}
            <div className="relative w-full h-full">
              <div className="relative h-full w-fit mx-auto">
                <Link
                  href={`/rcmd/${rcmd.id}`}
                  className="block h-full hover:opacity-90 transition-opacity"
                >
                  <div className="relative h-full aspect-square">
                    <Image
                      src={rcmd.featured_image || "/default-rcmd.png"}
                      alt={rcmd.title || ""}
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
                <h2 className="text-2xl font-bold">{rcmd.title}</h2>
                {rcmd.description && (
                  <p className="text-gray-400">{rcmd.description}</p>
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
              <span className="text-sm">{rcmd.like_count || 0}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}