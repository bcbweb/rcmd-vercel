"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { RCMDWithAuthor } from "@/types";

interface RCMDFeedProps {
  currentId: string;
}

export function RCMDFeed({ currentId }: RCMDFeedProps) {
  const router = useRouter();
  const [rcmds, setRcmds] = useState<RCMDWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [viewedRcmds] = useState(new Set<string>());
  const supabase = createClient();

  const fetchRcmdById = async (id: string) => {
    console.log("[DEBUG] Fetching RCMD for id:", id);
    const { data: rcmd, error } = await supabase
      .from("rcmds")
      .select(
        `
        *,
        profiles!rcmds_profile_id_fkey (*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("[DEBUG] Error fetching RCMD:", error);
      return null;
    }

    return rcmd as RCMDWithAuthor;
  };

  const fetchNextRcmd = async () => {
    console.log("[DEBUG] Fetching next RCMD. Already viewed:", viewedRcmds);
    const { data: rcmds, error } = await supabase.rpc("get_random_rcmd", {
      excluded_ids: Array.from(viewedRcmds).map(
        (id) => id as unknown as string
      ),
    });

    if (error) {
      console.error("[DEBUG] Error fetching next RCMD:", error);
      return null;
    }

    if (!rcmds || rcmds.length === 0) {
      console.log("[DEBUG] No more RCMDs to fetch");
      return null;
    }

    return rcmds[0] as RCMDWithAuthor;
  };

  // Initial load of current and next RCMDs
  useEffect(() => {
    async function loadRcmds() {
      if (!currentId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch current RCMD
        const currentRcmd = await fetchRcmdById(currentId);
        if (!currentRcmd) {
          setError("RCMD not found");
          return;
        }

        // Add current RCMD to viewed set
        viewedRcmds.add(currentRcmd.id);
        console.log("[DEBUG] Added current RCMD to viewed:", currentRcmd.id);

        // Initialize RCMDs array with current RCMD
        const initialRcmds = [currentRcmd];
        setRcmds(initialRcmds);

        // Fetch first additional RCMD
        const firstNext = await fetchNextRcmd();
        if (firstNext?.id) {
          viewedRcmds.add(firstNext.id);
          initialRcmds.push(firstNext);
          setRcmds([...initialRcmds]);
          console.log("[DEBUG] Added first next RCMD:", firstNext.id);

          // Only fetch second RCMD if we got the first one
          const secondNext = await fetchNextRcmd();
          if (secondNext?.id) {
            viewedRcmds.add(secondNext.id);
            initialRcmds.push(secondNext);
            setRcmds([...initialRcmds]);
            console.log("[DEBUG] Added second next RCMD:", secondNext.id);
          }
        }
      } catch (error) {
        console.error("[DEBUG] Error loading RCMDs:", error);
        setError("Error loading RCMD");
      } finally {
        setIsLoading(false);
      }
    }

    loadRcmds();
  }, [currentId]);

  // Track when RCMDs enter/leave viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Create observer to track which RCMDs are fully visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.95) {
            const id = entry.target.getAttribute("data-rcmd-id");
            const index = rcmds.findIndex((r) => r.id === id);

            console.log(
              "[DEBUG] RCMD in view:",
              id,
              "ratio:",
              entry.intersectionRatio,
              "index:",
              index
            );

            if (index !== -1 && index !== focusedIndex) {
              const currentRcmd = rcmds[index];
              console.log("[DEBUG] Updating to RCMD:", currentRcmd.id);

              setFocusedIndex(index);

              // Update URL and fetch next RCMD if needed
              if (index > 0) {
                window.history.replaceState(
                  null,
                  "",
                  `/explore/rcmds/feed/${currentRcmd.id}`
                );

                // Fetch another RCMD if we're near the end
                if (index >= rcmds.length - 2) {
                  fetchNextRcmd().then((nextRcmd) => {
                    if (nextRcmd?.id) {
                      viewedRcmds.add(nextRcmd.id);
                      setRcmds((prevRcmds) => [...prevRcmds, nextRcmd]);
                      console.log(
                        "[DEBUG] Added new RCMD to stack:",
                        nextRcmd.id
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
        threshold: [0.95], // Trigger when RCMD is almost fully visible
        rootMargin: "0px",
      }
    );

    // Observe all RCMD elements
    Array.from(container.children).forEach((child) => {
      if (child instanceof HTMLElement && child.hasAttribute("data-rcmd-id")) {
        observer.observe(child);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [rcmds, fetchNextRcmd, viewedRcmds, focusedIndex]);

  // Keep a basic scroll handler for debugging
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

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
            onClick={() => router.push("/explore/rcmds")}
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

  if (rcmds.length === 0) {
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
        onClick={() => router.push("/explore/rcmds")}
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* RCMD Stack */}
      {rcmds.map((rcmd, index) => (
        <div
          key={rcmd.id}
          data-rcmd-id={rcmd.id}
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
                {rcmd.featured_image && (
                  <div className="relative aspect-video w-full mb-6 rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src={rcmd.featured_image}
                      alt={rcmd.title}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">{rcmd.title}</h2>
                  {rcmd.description && (
                    <p className="text-gray-300">{rcmd.description}</p>
                  )}

                  <div className="flex items-center space-x-3 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden">
                        <Image
                          src={
                            rcmd.profiles?.profile_picture_url ||
                            "/default-avatar.png"
                          }
                          alt={rcmd.profiles?.handle || ""}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span>@{rcmd.profiles?.handle}</span>
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-3">
                    <button
                      className="inline-block bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full transition-colors"
                      onClick={() => router.push(`/rcmd/${rcmd.id}`)}
                    >
                      View RCMD
                    </button>
                    {rcmd.url && (
                      <a
                        href={rcmd.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-white text-black px-5 py-2 rounded-full hover:bg-white/90 transition-colors"
                      >
                        Visit Link
                      </a>
                    )}
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
