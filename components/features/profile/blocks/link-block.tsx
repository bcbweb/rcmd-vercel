"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { Link, LinkBlockType } from "@/types";
import { Link2, EyeOff, Globe } from "lucide-react";
import { formatDistance } from "date-fns";
import { useModalStore } from "@/stores/modal-store";
import { BlockActions, blockStyles } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { useLinkStore } from "@/stores/link-store";
import { confirmDelete } from "@/utils/confirm";

export interface LinkBlockProps {
  linkBlock: LinkBlockType;
  onDelete?: () => void;
  onSave?: (updatedBlock: Partial<LinkBlockType>) => void;
  noBorder?: boolean;
  hideEdit?: boolean;
}

// Simple version for public display that takes a direct Link object
export interface SimpleLinkBlockProps {
  link: Link;
  mode: "public";
  className?: string;
}

export function SimpleLinkBlock({
  link,
  mode,
  className = "",
}: SimpleLinkBlockProps) {
  // Use mode to conditionally apply different styles
  const isPublic = mode === "public";

  // Format the URL for display
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  return (
    <div
      className={`${blockStyles.container} ${blockStyles.card} ${
        isPublic ? "public-mode" : ""
      } ${className}`}
    >
      <h3 className={blockStyles.title}>{link.title}</h3>

      {/* URL */}
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

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {link.created_at && (
            <span className={blockStyles.metaText}>
              {formatDistance(new Date(link.created_at), new Date(), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LinkBlock({
  linkBlock,
  onDelete,
  onSave,
  noBorder = false,
  hideEdit = false,
}: LinkBlockProps) {
  const supabase = createClient();
  const [link, setLink] = useState<Link | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    setIsLinkModalOpen,
    setOnModalSuccess,
    setIsLinkEditMode,
    setLinkToEdit,
  } = useModalStore();
  const { deleteLink } = useLinkStore();

  const fetchLink = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("id", linkBlock.link_id)
        .single();

      if (error) throw error;
      setLink(data);
    } catch (err) {
      console.error("Error fetching link:", err);
    } finally {
      setIsLoading(false);
    }
  }, [linkBlock.link_id, supabase]);

  useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  const handleEdit = () => {
    if (!link) return;

    // Set up modal success callback
    setOnModalSuccess(() => {
      // Refetch the Link to get updated data
      fetchLink();
      if (onSave) {
        onSave(linkBlock);
      }
    });

    // Set the edit mode and data to edit
    setIsLinkEditMode(true);
    setLinkToEdit(link);

    // Open the Link modal in edit mode
    setIsLinkModalOpen(true);
  };

  const handleDelete = () => {
    if (!linkBlock?.id || !link) return;

    confirmDelete({
      title: "Delete Link",
      description: `Are you sure you want to delete "${link.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteLink(linkBlock.id);
          if (onDelete) onDelete();
        } catch (error) {
          console.error("Error deleting link:", error);
        }
      },
    });
  };

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
    if (!link) return null;

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
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!link) return null;

  return (
    <div
      className={`${noBorder ? "" : blockStyles.container} ${blockStyles.card} relative pt-12`}
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

      <h3 className={blockStyles.title}>{link.title}</h3>

      {/* URL */}
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

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {renderVisibilityBadge()}
          <span className={blockStyles.metaText}>
            {formatDistance(new Date(linkBlock.created_at), new Date(), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
