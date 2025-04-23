"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { RCMD } from "@/types";
import Image from "next/image";
import { blockStyles, BlockStats } from "@/components/common";
import { MapPin, Link, DollarSign, Globe, EyeOff } from "lucide-react";
import { imageLoader } from "@/utils/image";

// Type for our state - what we save in the component
interface RCMDBlockData {
  id: string;
  rcmds: RCMD;
  [key: string]: unknown;
}

interface RCMDBlockProps {
  blockId: string;
  preloadedData?: Record<string, unknown>;
}

export default function RCMDBlock({ blockId, preloadedData }: RCMDBlockProps) {
  const [rcmdBlock, setRcmdBlock] = useState<RCMDBlockData | null>(null);
  const [isLoading, setIsLoading] = useState(
    !preloadedData || !preloadedData.rcmds
  );
  const [error, setError] = useState<Error | null>(null);

  // Add debug log to check if preloaded data is received
  useEffect(() => {
    console.log(`RCMDBlock (${blockId}) - Preloaded data structure:`, {
      hasPreloadedData: !!preloadedData,
      preloadedDataKeys: preloadedData ? Object.keys(preloadedData) : [],
      hasRcmdBlocksProp: preloadedData?.rcmd_blocks !== undefined,
      hasRcmdsProp: preloadedData?.rcmds !== undefined,
      rcmdBlocksType: preloadedData?.rcmd_blocks
        ? typeof preloadedData.rcmd_blocks
        : "undefined",
      rcmdsType: preloadedData?.rcmds
        ? typeof preloadedData.rcmds
        : "undefined",
    });
  }, [blockId, preloadedData]);

  useEffect(() => {
    // Define the fetch function inside the effect to avoid dependency issues
    async function fetchRcmdBlock() {
      try {
        setIsLoading(true);
        setError(null);
        const supabase = createClient();

        console.log(`Fetching RCMD block data for blockId: ${blockId}`);
        // First try to get the rcmd_blocks entry
        const { data, error } = await supabase
          .from("rcmd_blocks")
          .select(`*, rcmds (*)`)
          .eq("profile_block_id", blockId)
          .single();

        // If that fails, try to get the profile_block directly
        if (error || !data) {
          console.log(`No rcmd_blocks found, getting profile_block directly`);
          const { data: profileBlock, error: profileBlockError } =
            await supabase
              .from("profile_blocks")
              .select(`*`)
              .eq("id", blockId)
              .single();

          if (profileBlockError) throw profileBlockError;
          if (!profileBlock) throw new Error("Profile block not found");

          // If we have an entity_id, try to get the RCMD directly
          if (profileBlock.entity_id) {
            const { data: rcmdData, error: rcmdError } = await supabase
              .from("rcmds")
              .select(`*`)
              .eq("id", profileBlock.entity_id)
              .single();

            if (rcmdError) throw rcmdError;
            if (!rcmdData) throw new Error("RCMD not found");

            console.log(`Found RCMD directly:`, rcmdData);
            setRcmdBlock({
              id: blockId,
              rcmds: rcmdData as RCMD,
            });
            setIsLoading(false);
            return;
          } else {
            throw new Error("Profile block has no entity_id");
          }
        }

        console.log(`Received RCMD block data:`, data);
        if (!data.rcmds) {
          throw new Error("RCMD data missing from RCMD block");
        }

        setRcmdBlock({
          id: data.id,
          rcmds: data.rcmds as RCMD,
        });
      } catch (err) {
        console.error("Error fetching RCMD block:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    // Handler for processing preloaded data
    function processPreloadedData() {
      try {
        // Direct rcmds property - most straightforward
        if (
          preloadedData?.rcmds &&
          typeof preloadedData.rcmds === "object" &&
          preloadedData.rcmds !== null
        ) {
          console.log(`Using preloaded data with direct rcmds property`);
          setRcmdBlock({
            id:
              typeof preloadedData.id === "string" ? preloadedData.id : blockId,
            rcmds: preloadedData.rcmds as RCMD,
          });
          setIsLoading(false);
          return true;
        }

        // Nested rcmd_blocks structure
        if (
          preloadedData?.rcmd_blocks &&
          typeof preloadedData.rcmd_blocks === "object"
        ) {
          const rcmdBlocksObj = preloadedData.rcmd_blocks as Record<
            string,
            unknown
          >;
          if (rcmdBlocksObj.rcmds && typeof rcmdBlocksObj.rcmds === "object") {
            console.log(`Using rcmds from nested rcmd_blocks property`);
            setRcmdBlock({
              id:
                typeof preloadedData.id === "string"
                  ? preloadedData.id
                  : blockId,
              rcmds: rcmdBlocksObj.rcmds as RCMD,
            });
            setIsLoading(false);
            return true;
          }
        }

        // If we get here, we couldn't process the preloaded data
        console.log(
          `Unable to extract RCMD data from preloaded data, will fetch`
        );
        return false;
      } catch (err) {
        console.error("Error processing preloaded data:", err);
        return false;
      }
    }

    // Main logic flow
    if (preloadedData) {
      const success = processPreloadedData();
      if (!success) {
        // Fall back to fetching if preloaded data doesn't work
        fetchRcmdBlock();
      }
    } else {
      // If no preloaded data, fetch from API
      fetchRcmdBlock();
    }
  }, [blockId, preloadedData]);

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

  if (error || !rcmdBlock || !rcmdBlock.rcmds) {
    console.error(`RCMDBlock (${blockId}) - Error or missing data:`, {
      error,
      rcmdBlock,
    });

    // Instead of returning null, show an error state
    return (
      <div
        className={`${blockStyles.container} ${blockStyles.card} border-red-300 bg-red-50 dark:bg-red-900/20`}
      >
        <div className="p-4 text-center text-red-600 dark:text-red-400">
          <p className="font-medium">Unable to load RCMD</p>
          <p className="text-sm mt-1 text-red-500 dark:text-red-300">
            {error ? error.message : "RCMD data is missing or invalid"}
          </p>
        </div>
      </div>
    );
  }

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

  // Render visibility badge
  const renderVisibilityBadge = () => {
    if (!rcmd) return null;

    if (rcmd.visibility === "public") {
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

      {/* Tags */}
      {rcmd.tags && rcmd.tags.length > 0 && (
        <div className="mt-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {rcmd.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Display visibility badge */}
      <div className="mt-2 mb-3 flex items-center gap-2">
        {renderVisibilityBadge()}
      </div>

      {/* Stats */}
      <div className="mt-4">
        <BlockStats stats={stats} />
      </div>
    </div>
  );
}
