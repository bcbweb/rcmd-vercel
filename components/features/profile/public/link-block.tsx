"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Link, LinkBlockType } from "@/types";
import { blockStyles, BlockStats } from "@/components/common";
import { Globe, EyeOff, Link2 } from "lucide-react";

interface LinkBlockProps {
  blockId: string;
}

export default function LinkBlock({ blockId }: LinkBlockProps) {
  const [linkBlock, setLinkBlock] = useState<
    (LinkBlockType & { links: Link }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLinkBlock() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from("link_blocks")
          .select(`*, links (*)`)
          .eq("profile_block_id", blockId)
          .single();

        if (error) throw error;
        if (!data || !data.links) throw new Error("Link block not found");

        setLinkBlock(data as LinkBlockType & { links: Link });
      } catch (err) {
        console.error("Error fetching link block:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchLinkBlock();
  }, [blockId]);

  // Format the URL for display
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  // Render visibility badge
  const renderVisibilityBadge = () => {
    if (!linkBlock?.links) return null;
    const link = linkBlock.links;

    if (link.visibility === "public") {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
          <Globe className="h-3 w-3" />
          <span>Public</span>
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
          <EyeOff className="h-3 w-3" />
          <span>Private</span>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div
        className={`${blockStyles.container} ${blockStyles.card} animate-pulse`}
      >
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
      </div>
    );
  }

  if (error || !linkBlock || !linkBlock.links) return null;
  const link = linkBlock.links;

  const stats = [
    { value: link.view_count || 0, label: "views" },
    { value: link.like_count || 0, label: "likes" },
    { value: link.save_count || 0, label: "saves" },
  ];

  return (
    <div className={`${blockStyles.container} ${blockStyles.card}`}>
      <h3 className={blockStyles.title}>{link.title}</h3>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-sm text-blue-600 dark:text-blue-400 mb-2 hover:underline"
      >
        <span className="flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          {formatUrl(link.url)}
        </span>
      </a>

      {link.description && (
        <p className={blockStyles.description}>{link.description}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {renderVisibilityBadge()}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <BlockStats stats={stats} />
      </div>
    </div>
  );
}
