"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RCMD, RCMDBlockType } from "@/types";
import { MapPin, Link, DollarSign } from "lucide-react";
import { useModalStore } from "@/stores/modal-store";
import { BlockActions, blockStyles } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { BlockSkeleton } from "@/components/common";
import { imageLoader } from "@/utils/image";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface RCMDBlockProps {
  rcmdBlock: RCMDBlockType;
  onDelete?: () => void;
  onSave?: (updatedBlock: Partial<RCMDBlockType>) => void;
  noBorder?: boolean;
  hideEdit?: boolean;
}

export default function RCMDBlock({
  rcmdBlock,
  onDelete,
  onSave,
  noBorder = false,
  hideEdit = false,
}: RCMDBlockProps) {
  const supabase = createClient();
  const [rcmd, setRCMD] = useState<RCMD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    setIsRCMDModalOpen,
    setOnModalSuccess,
    setIsRCMDEditMode,
    setRCMDToEdit,
  } = useModalStore();

  const fetchRCMD = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("rcmds")
        .select("*")
        .eq("id", rcmdBlock.rcmd_id)
        .single();

      if (error) throw error;
      setRCMD(data);
    } catch (err) {
      console.error("Error fetching rcmd:", err);
    } finally {
      setIsLoading(false);
    }
  }, [rcmdBlock.rcmd_id, supabase]);

  useEffect(() => {
    fetchRCMD();
  }, [fetchRCMD]);

  const handleEdit = () => {
    if (!rcmd) return;

    // Set up modal success callback
    setOnModalSuccess(() => {
      // Refetch the RCMD to get updated data
      fetchRCMD();
      if (onSave) {
        onSave(rcmdBlock);
      }
    });

    // Set the edit mode and data to edit
    setIsRCMDEditMode(true);
    setRCMDToEdit(rcmd);

    // Open the RCMD modal in edit mode
    setIsRCMDModalOpen(true);
  };

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
    return <BlockSkeleton hasImage={true} lines={3} />;
  }

  if (!rcmd) return null;

  return (
    <div
      className={`${noBorder ? "" : blockStyles.container} ${blockStyles.card} relative pt-12`}
    >
      <div className="absolute top-2 right-2 z-10">
        <BlockActions
          isEditMode={false}
          onEdit={hideEdit ? undefined : handleEdit}
          onDelete={onDelete}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </div>

      {rcmd.featured_image && (
        <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
          <Image
            src={rcmd.featured_image}
            alt={rcmd.title || "Featured image"}
            fill
            className="object-cover"
            loader={imageLoader}
          />
        </div>
      )}

      <h3 className={blockStyles.title}>{rcmd.title}</h3>

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
              href={rcmd.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline"
            >
              {rcmd.url?.replace(/^https?:\/\/(www\.)?/, "")}
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

      {rcmd.visibility === "private" && (
        <div className="mt-2">
          <TooltipProvider delayDuration={100}>
            <Tooltip defaultOpen={false}>
              <TooltipTrigger asChild>
                <span
                  className={blockStyles.tag}
                  title="This block won't be visible on your public page unless visibility is changed to public"
                >
                  private
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-gray-900 text-white text-xs p-2"
              >
                This is only visible to you
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
