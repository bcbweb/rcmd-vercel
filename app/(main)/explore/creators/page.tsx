"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { GridSkeleton } from "@/components/common";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";

export default function CreatorsPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCreators() {
      setIsLoading(true);
      const query = supabase
        .from("profiles")
        .select("*")
        .eq("profile_type", "creator")
        .not("profile_picture_url", "is", null)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,handle.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) console.error("Error fetching creators:", error);
      else setCreators(data || []);
      setIsLoading(false);
    }

    fetchCreators();
  }, [searchQuery, supabase]);

  const handleCreatorClick = (handle: string | null) => {
    if (!handle) return;
    router.push(`/explore/creators/feed/${handle}`);
  };

  return (
    <div className="container mx-auto px-4">
      <SearchBar onSearch={setSearchQuery} />

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="relative aspect-square cursor-pointer overflow-hidden"
              onClick={() => handleCreatorClick(creator.handle)}
            >
              <Image
                src={creator.profile_picture_url || "/default-avatar.png"}
                alt={creator.handle || ""}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-90" />

              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <h3 className="font-medium text-sm">
                  {creator.first_name} {creator.last_name}
                </h3>
                <p className="text-xs text-gray-200">@{creator.handle}</p>
                {creator.bio && (
                  <p className="text-xs mt-1 text-gray-300 line-clamp-2">
                    {creator.bio}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
