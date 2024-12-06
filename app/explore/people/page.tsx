"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { GridLayout } from "@/components/shared/grid-layout";
import { GridSkeleton } from "@/components/shared/grid-skeleton";
import Image from "next/image";
import type { Profile } from "@/types";

export default function PeoplePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfiles() {
      setIsLoading(true);
      const query = supabase
        .from("profiles")
        .select("*")
        .not("profile_picture_url", "is", null)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,handle.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) console.error("Error fetching profiles:", error);
      else setProfiles(data || []);
      setIsLoading(false);
    }

    fetchProfiles();
  }, [searchQuery]);

  return (
    <div>
      <SearchBar onSearch={setSearchQuery} />

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <GridLayout>
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="relative aspect-square cursor-pointer"
            >
              <Image
                src={profile.profile_picture_url || "/default-avatar.png"}
                alt={profile.handle || ""}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-90" />

              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <h3 className="font-medium text-sm">
                  {profile.first_name} {profile.last_name}
                </h3>
                <p className="text-xs text-gray-200">@{profile.handle}</p>
                {profile.bio && (
                  <p className="text-xs mt-1 text-gray-300 line-clamp-2">{profile.bio}</p>
                )}
              </div>
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}