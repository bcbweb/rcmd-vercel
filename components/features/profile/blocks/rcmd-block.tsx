"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { RCMD, RCMDBlockType } from "@/types";
import { Image as ImageIcon, EyeOff, Globe } from "lucide-react";
import Image from "next/image";
import { formatDistance } from "date-fns";
import { useModalStore } from "@/stores/modal-store";
import { BlockActions, blockStyles } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { useRCMDStore } from "@/stores/rcmd-store";
import { confirmDelete } from "@/utils/confirm";
import { RCMDLink } from "@/components/features/rcmd/rcmd-link";

export interface RCMDBlockProps {
  rcmdBlock: RCMDBlockType;
  onDelete?: () => void;
  onSave?: (updatedBlock: Partial<RCMDBlockType>) => void;
  noBorder?: boolean;
  hideEdit?: boolean;
}

// Simple version for public display that takes a direct RCMD object
export interface SimpleRCMDBlockProps {
  rcmd: RCMD;
  mode: "public";
  className?: string;
}

export function SimpleRCMDBlock({
  rcmd,
  mode,
  className = "",
}: SimpleRCMDBlockProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Use mode to conditionally apply different styles
  const isPublic = mode === "public";

  // Set image URL based on featured_image
  useEffect(() => {
    if (!rcmd.featured_image) return;

    // Check if it's already a full URL
    if (rcmd.featured_image.startsWith("http")) {
      setImageUrl(rcmd.featured_image);
    } else {
      // For simplicity, we'll use the path directly with the storage URL
      const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/content/${rcmd.featured_image}`;
      setImageUrl(storageUrl);
    }
  }, [rcmd.featured_image]);

  // Format location
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatLocation = (location: any) => {
    if (!location) return "";

    // Handle string location
    if (typeof location === "string")
      return location.split(", ").slice(0, 2).join(", ");

    // Handle JSON location object
    if (typeof location === "object") {
      // Extract city and state if available
      if (location.city) {
        return location.state
          ? `${location.city}, ${location.state}`
          : location.city;
      }

      // Otherwise join all non-empty values
      return Object.values(location)
        .filter(Boolean)
        .join(", ")
        .split(", ")
        .slice(0, 2)
        .join(", ");
    }

    return String(location);
  };

  // Format price range
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatPriceRange = (priceRange: any) => {
    if (!priceRange) return "";

    // Handle string price range
    if (typeof priceRange === "string") return priceRange;

    // Handle JSON price range object
    if (typeof priceRange === "object") {
      const currency = priceRange.currency || "$";

      if (priceRange.min && priceRange.max) {
        return `${currency}${priceRange.min} - ${currency}${priceRange.max}`;
      } else if (priceRange.min) {
        return `From ${currency}${priceRange.min}`;
      } else if (priceRange.max) {
        return `Up to ${currency}${priceRange.max}`;
      }
    }

    return String(priceRange);
  };

  return (
    <div
      className={`${blockStyles.container} ${blockStyles.card} ${
        isPublic ? "public-mode" : ""
      } ${className}`}
    >
      {/* Featured Image */}
      {imageUrl ? (
        <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden">
          <div style={{ height: "100%", width: "100%" }}>
            <RCMDLink rcmd={rcmd}>
              <Image
                src={imageUrl}
                alt={rcmd.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </RCMDLink>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-40 bg-gray-200 dark:bg-gray-800 mb-4 rounded-lg">
          <ImageIcon className="h-10 w-10 text-gray-400" />
        </div>
      )}

      <h3 className={blockStyles.title}>
        <RCMDLink rcmd={rcmd} className="hover:underline">
          {rcmd.title}
        </RCMDLink>
      </h3>

      {rcmd.description && (
        <p className={blockStyles.description}>{rcmd.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {rcmd.tags && rcmd.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {rcmd.tags.map((tag: string, idx: number) => (
              <span key={idx} className={blockStyles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2">
        {(rcmd.location || rcmd.price_range) && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            {rcmd.location && (
              <span className={blockStyles.metaText}>
                {formatLocation(rcmd.location)}
              </span>
            )}
            {rcmd.location && rcmd.price_range && (
              <span className="text-gray-300 dark:text-gray-700">•</span>
            )}
            {rcmd.price_range && (
              <span className={blockStyles.metaText}>
                {formatPriceRange(rcmd.price_range)}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {rcmd.created_at && (
            <span className={blockStyles.metaText}>
              {formatDistance(
                new Date(rcmd.created_at || Date.now()),
                new Date(),
                {
                  addSuffix: true,
                }
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const {
    setIsRCMDModalOpen,
    setOnModalSuccess,
    setIsRCMDEditMode,
    setRCMDToEdit,
  } = useModalStore();
  const { deleteRCMD } = useRCMDStore();

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

      // If we have a featured image, get the URL
      if (data.featured_image) {
        console.log("RCMD featured_image path:", data.featured_image);

        // Check if the featured_image is already a full URL
        if (data.featured_image.startsWith("http")) {
          // If it's already a URL, use it directly
          console.log("Using direct URL:", data.featured_image);
          setImageUrl(data.featured_image);
        } else {
          // Otherwise, create a signed URL from the path
          try {
            const { data: imageData } = await supabase.storage
              .from("content")
              .createSignedUrl(data.featured_image, 600);

            if (imageData) {
              console.log("RCMD image signed URL:", imageData.signedUrl);
              setImageUrl(imageData.signedUrl);
            } else {
              console.error(
                "No signed URL returned for image:",
                data.featured_image
              );
            }
          } catch (error) {
            console.error("Error creating signed URL:", error);
            // Fallback to try using the path directly with the storage URL
            const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/content/${data.featured_image}`;
            console.log("Using fallback storage URL:", storageUrl);
            setImageUrl(storageUrl);
          }
        }
      }
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

  const handleDelete = () => {
    if (!rcmdBlock?.id || !rcmd) return;

    confirmDelete({
      title: "Delete RCMD",
      description: `Are you sure you want to delete "${rcmd.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteRCMD(rcmdBlock.id);
          if (onDelete) onDelete();
        } catch (error) {
          console.error("Error deleting rcmd:", error);
        }
      },
    });
  };

  // Format location
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatLocation = (location: any) => {
    if (!location) return "";

    // Handle string location
    if (typeof location === "string")
      return location.split(", ").slice(0, 2).join(", ");

    // Handle JSON location object
    if (typeof location === "object") {
      // Extract city and state if available
      if (location.city) {
        return location.state
          ? `${location.city}, ${location.state}`
          : location.city;
      }

      // Otherwise join all non-empty values
      return Object.values(location)
        .filter(Boolean)
        .join(", ")
        .split(", ")
        .slice(0, 2)
        .join(", ");
    }

    return String(location);
  };

  // Format price range
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatPriceRange = (priceRange: any) => {
    if (!priceRange) return "";

    // Handle string price range
    if (typeof priceRange === "string") return priceRange;

    // Handle JSON price range object
    if (typeof priceRange === "object") {
      const currency = priceRange.currency || "$";

      if (priceRange.min && priceRange.max) {
        return `${currency}${priceRange.min} - ${currency}${priceRange.max}`;
      } else if (priceRange.min) {
        return `From ${currency}${priceRange.min}`;
      } else if (priceRange.max) {
        return `Up to ${currency}${priceRange.max}`;
      }
    }

    return String(priceRange);
  };

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

  if (isLoading) {
    return (
      <div
        className={`${blockStyles.container} ${blockStyles.card} animate-pulse`}
      >
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!rcmd) return null;

  return (
    <div
      className={`${noBorder ? "" : blockStyles.container} ${
        blockStyles.card
      } relative pt-12`}
    >
      <div className="absolute top-2 right-2 z-10">
        <BlockActions
          isEditMode={false}
          onEdit={hideEdit ? undefined : handleEdit}
          onDelete={handleDelete}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </div>

      {/* Featured Image */}
      {imageUrl ? (
        <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden">
          <div style={{ height: "100%", width: "100%" }}>
            <RCMDLink rcmd={rcmd}>
              <Image
                src={imageUrl}
                alt={rcmd.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </RCMDLink>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-40 bg-gray-200 dark:bg-gray-800 mb-4 rounded-lg">
          <ImageIcon className="h-10 w-10 text-gray-400" />
        </div>
      )}

      <h3 className={blockStyles.title}>
        <RCMDLink rcmd={rcmd} className="hover:underline">
          {rcmd.title}
        </RCMDLink>
      </h3>

      {rcmd.description && (
        <p className={blockStyles.description}>{rcmd.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {rcmd.tags && rcmd.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {rcmd.tags.map((tag: string, idx: number) => (
              <span key={idx} className={blockStyles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2">
        {(rcmd.location || rcmd.price_range) && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            {rcmd.location && (
              <span className={blockStyles.metaText}>
                {formatLocation(rcmd.location)}
              </span>
            )}
            {rcmd.location && rcmd.price_range && (
              <span className="text-gray-300 dark:text-gray-700">•</span>
            )}
            {rcmd.price_range && (
              <span className={blockStyles.metaText}>
                {formatPriceRange(rcmd.price_range)}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {renderVisibilityBadge()}
          <span className={blockStyles.metaText}>
            {formatDistance(
              new Date(rcmd.created_at || Date.now()),
              new Date(),
              {
                addSuffix: true,
              }
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
