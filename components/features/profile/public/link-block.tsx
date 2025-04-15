"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Link, LinkBlockType } from "@/types";
import { blockStyles, BlockStats } from "@/components/common";

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

  if (isLoading) {
    return (
      <div className={`${blockStyles.container} animate-pulse`}>
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
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block ${blockStyles.container}`}
    >
      <h3 className="font-medium text-lg text-blue-600 dark:text-blue-400 mb-2">
        {link.title}
      </h3>

      {link.description && (
        <p className={blockStyles.description}>{link.description}</p>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between">
        <span className={`${blockStyles.metaText} mt-4 truncate`}>
          {link.url}
        </span>
        <BlockStats stats={stats} />
      </div>
    </a>
  );
}
