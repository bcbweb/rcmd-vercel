"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { GridSkeleton } from "@/components/common";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Creator } from "@/types";

export default function CreatorsPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCreators() {
      setIsLoading(true);
      const query = supabase
        .from("creators")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query.or(
          `name.ilike.%${searchQuery}%,handle.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`
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
                <h3 className="font-medium text-sm">{creator.name}</h3>
                <p className="text-xs text-gray-200">@{creator.handle}</p>
                <p className="text-xs text-gray-300">{creator.category}</p>
                <div className="flex items-center mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      creator.status === "approved"
                        ? "bg-green-500"
                        : creator.status === "pending"
                          ? "bg-yellow-500"
                          : creator.status === "rejected"
                            ? "bg-red-500"
                            : "bg-gray-500"
                    } bg-opacity-50`}
                  >
                    {creator.status}
                  </span>
                  {creator.verified && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-500 bg-opacity-50">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
