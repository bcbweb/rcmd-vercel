"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Link } from "@/types";
import PublicLinkBlocks from "@/components/features/links/public-link-blocks";

interface LinkBlocksProps {
  profileId: string;
}

export default function LinkBlocks({ profileId }: LinkBlocksProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLinks() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from("links")
          .select("*")
          .eq("profile_id", profileId)
          .eq("visibility", "public")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setLinks(data as Link[]);
      } catch (err) {
        console.error("Error fetching profile links:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchLinks();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">Failed to load links</div>
    );
  }

  return <PublicLinkBlocks links={links} />;
}
