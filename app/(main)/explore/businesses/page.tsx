"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { GridSkeleton } from "@/components/common";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Business } from "@/types";

export default function BusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true);
      const query = supabase
        .from("businesses")
        .select("*")
        .not("cover_photo_url", "is", null)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) console.error("Error fetching businesses:", error);
      else setBusinesses(data || []);
      setIsLoading(false);
    }

    fetchBusinesses();
  }, [searchQuery]);

  const handleBusinessClick = (id: string | null) => {
    if (!id) return;
    router.push(`/explore/businesses/${id}`);
  };

  return (
    <div className="container mx-auto px-4">
      <SearchBar onSearch={setSearchQuery} />

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="relative aspect-square cursor-pointer overflow-hidden"
              onClick={() => handleBusinessClick(business.id)}
            >
              <Image
                src={business.cover_photo_url || ""}
                alt={business.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-90" />

              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <h3 className="font-medium text-sm">{business.name}</h3>
                <div className="flex items-center space-x-2 text-xs mt-1 text-gray-200">
                  <span>{business.view_count} views</span>
                  <span>•</span>
                  <span>{business?.rating_avg?.toFixed(1)} ★</span>
                  <span>•</span>
                  <span>{business.rating_count} reviews</span>
                </div>
                {business.description && (
                  <p className="text-xs mt-1 text-gray-300 line-clamp-2">
                    {business.description}
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