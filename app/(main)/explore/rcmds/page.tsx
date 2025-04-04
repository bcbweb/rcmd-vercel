"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { GridSkeleton } from "@/components/common";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { RCMD } from "@/types";

export default function RCMDsPage() {
  const router = useRouter();
  const [rcmds, setRCMDs] = useState<RCMD[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchRCMDs() {
      setIsLoading(true);
      const query = supabase
        .from("rcmds")
        .select("*")
        .not("featured_image", "is", null)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) console.error("Error fetching RCMDs:", error);
      else setRCMDs(data || []);
      setIsLoading(false);
    }

    fetchRCMDs();
  }, [searchQuery]);

  const handleRCMDClick = (id: string | null) => {
    if (!id) return;
    router.push(`/explore/rcmds/feed/${id}`);
  };

  return (
    <div className="container mx-auto px-4">
      <SearchBar onSearch={setSearchQuery} />

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {rcmds.map((rcmd) => (
            <div
              key={rcmd.id}
              className="relative aspect-square cursor-pointer overflow-hidden"
              onClick={() => handleRCMDClick(rcmd.id)}
            >
              <Image
                src={rcmd.featured_image || ""}
                alt={rcmd.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-90" />

              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <h3 className="font-medium text-sm">{rcmd.title}</h3>
                <div className="flex items-center space-x-2 text-xs mt-1 text-gray-200">
                  <span>{rcmd.view_count} views</span>
                  <span>•</span>
                  <span>{rcmd.like_count} likes</span>
                </div>
                {rcmd.description && (
                  <p className="text-xs mt-1 text-gray-300 line-clamp-2">{rcmd.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}