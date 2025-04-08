"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { Link, LinkBlockType } from "@/types";
import { Link2 } from "lucide-react";
import { formatDistance } from "date-fns";
import { useModalStore } from "@/stores/modal-store";
import { BlockActions, blockStyles } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { useLinkStore } from "@/stores/link-store";

interface LinkBlockProps {
  linkBlock: LinkBlockType;
  onDelete?: () => void;
  onSave?: (block: Partial<LinkBlockType>) => void;
}

export default function LinkBlock({
  linkBlock,
  onDelete,
  onSave,
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

  const handleDelete = async () => {
    if (!linkBlock?.id) return;

    try {
      await deleteLink(linkBlock.id);
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting link:", error);
    }
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
      className={`${blockStyles.container} ${blockStyles.card} relative pt-12`}
    >
      <div className="absolute top-2 right-2 z-10">
        <BlockActions
          isEditMode={false}
          onEdit={handleEdit}
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
          <span className={blockStyles.tag}>{link.visibility}</span>
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
