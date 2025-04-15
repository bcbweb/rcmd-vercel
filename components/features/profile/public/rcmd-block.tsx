"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { RCMD, RCMDBlockType } from "@/types";
import Image from "next/image";
import { blockStyles, BlockStats } from "@/components/common";
import { MapPin, Link, DollarSign } from "lucide-react";
import { imageLoader } from "@/utils/image";

interface RCMDBlockProps {
  blockId: string;
}

export default function RCMDBlock({ blockId }: RCMDBlockProps) {
  const [rcmdBlock, setRcmdBlock] = useState<
    (RCMDBlockType & { rcmds: RCMD }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRcmdBlock() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from("rcmd_blocks")
          .select(`*, rcmds (*)`)
          .eq("profile_block_id", blockId)
          .single();

        if (error) throw error;
        if (!data || !data.rcmds) throw new Error("RCMD block not found");

        setRcmdBlock(data as RCMDBlockType & { rcmds: RCMD });
      } catch (err) {
        console.error("Error fetching RCMD block:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchRcmdBlock();
  }, [blockId]);

  const formatLocation = (location: unknown): string | null => {
    if (!location) return null;

    if (typeof location === "string") {
      try {
        const parsed = JSON.parse(location);
        return formatLocation(parsed);
      } catch {
        return location;
      }
    }

    if (
      typeof location === "object" &&
      location !== null &&
      "address" in location &&
      typeof location.address === "string"
    ) {
      return location.address;
    }

    if (
      typeof location === "object" &&
      location !== null &&
      "city" in location &&
      typeof location.city === "string"
    ) {
      if ("state" in location && typeof location.state === "string") {
        return `${location.city}, ${location.state}`;
      }
      return location.city;
    }

    return typeof location === "object" && location !== null
      ? Object.values(location).filter(Boolean).join(", ")
      : String(location);
  };

  const formatPriceRange = (priceRange: unknown): string | null => {
    if (!priceRange) return null;

    if (typeof priceRange === "string") {
      try {
        const parsed = JSON.parse(priceRange);
        return formatPriceRange(parsed);
      } catch {
        return priceRange;
      }
    }

    if (typeof priceRange === "object" && priceRange !== null) {
      const pr = priceRange as Record<string, unknown>;
      const currency = "currency" in pr ? String(pr.currency || "$") : "$";

      if ("min" in pr && "max" in pr && pr.min && pr.max) {
        return `${currency}${pr.min} - ${currency}${pr.max}`;
      } else if ("min" in pr && pr.min) {
        return `From ${currency}${pr.min}`;
      } else if ("max" in pr && pr.max) {
        return `Up to ${currency}${pr.max}`;
      }
    }

    return null;
  };

  if (isLoading) {
    return (
      <div
        className={`${blockStyles.container} ${blockStyles.card} animate-pulse`}
      >
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/5"></div>
      </div>
    );
  }

  if (error || !rcmdBlock || !rcmdBlock.rcmds) return null;

  const rcmd = rcmdBlock.rcmds;

  const stats = [
    { value: rcmd.view_count || 0, label: "views" },
    { value: rcmd.like_count || 0, label: "likes" },
    { value: rcmd.save_count || 0, label: "saves" },
    { value: rcmd.share_count || 0, label: "shares" },
  ];

  if (rcmd.click_count) {
    stats.push({ value: rcmd.click_count, label: "clicks" });
  }

  return (
    <div className={`${blockStyles.container} ${blockStyles.card}`}>
      {rcmd.featured_image && (
        <div className="aspect-video relative overflow-hidden mb-4 rounded-lg">
          <Image
            src={rcmd.featured_image || ""}
            alt={rcmd.title}
            fill
            className="object-cover"
            loader={imageLoader}
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <h3 className={blockStyles.title}>{rcmd.title}</h3>
      </div>

      {/* Location */}
      {rcmd.location && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {formatLocation(rcmd.location)}
          </span>
        </div>
      )}

      {/* URL */}
      {rcmd.url && (
        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mb-2">
          <span className="flex items-center gap-1.5 truncate">
            <Link className="w-3.5 h-3.5" />
            <a
              href={rcmd.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline"
            >
              {rcmd.url.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          </span>
        </div>
      )}

      {/* Price Range */}
      {rcmd.price_range && (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            {formatPriceRange(rcmd.price_range)}
          </span>
        </div>
      )}

      {rcmd.description && (
        <p className={blockStyles.description}>{rcmd.description}</p>
      )}

      {/* Tags with improved styling */}
      {rcmd.tags && rcmd.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 my-3">
          {rcmd.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 mt-3">
        <div className="flex items-center gap-2">
          <span className={blockStyles.tag}>{rcmd.visibility}</span>
          <span className={blockStyles.metaText}>
            {rcmd.created_at
              ? new Date(rcmd.created_at).toLocaleDateString()
              : "Unknown date"}
          </span>
        </div>
        <BlockStats stats={stats} />
      </div>
    </div>
  );
}
