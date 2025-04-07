"use client";

import React, { useState, useCallback } from "react";
import type { Link, LinkBlockType } from "@/types";
import { Link2 } from "lucide-react";
import { formatDistance } from "date-fns";
import { useModalStore } from "@/stores/modal-store";
import { BlockActions } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { useLinkStore } from "@/stores/link-store";

interface LinkBlockProps {
  linkBlock?: LinkBlockType;
  onDelete?: () => void;
  onSave?: (block: Partial<LinkBlockType>) => void;
  canEdit?: boolean;
}

export default function LinkBlock({
  linkBlock,
  onDelete,
  onSave,
  canEdit = false,
}: LinkBlockProps) {
  const {
    setIsLinkModalOpen,
    setOnModalSuccess,
    setIsLinkEditMode,
    setLinkToEdit,
  } = useModalStore();
  const { deleteLink } = useLinkStore();
  const [isDeleted, setIsDeleted] = useState(false);
  const [currentLinkBlock] = useState<LinkBlockType | undefined>(linkBlock);
  const [currentLink, setCurrentLink] = useState<Link | undefined>();

  const fetchLink = useCallback(async () => {
    if (!linkBlock?.link_id) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("id", linkBlock.link_id)
      .single();

    if (error) {
      console.error("Error fetching link:", error);
      return;
    }

    if (data) {
      setCurrentLink(data);
    }
  }, [linkBlock?.link_id]);

  // Fetch the link data when the component mounts or linkBlock changes
  React.useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  const handleEdit = () => {
    if (!currentLink) return;

    // Set up success callback
    setOnModalSuccess(() => {
      fetchLink();
      if (onSave && currentLinkBlock) onSave(currentLinkBlock);
    });

    // Set edit mode and data in store
    setIsLinkEditMode(true);
    setLinkToEdit(currentLink);
    setIsLinkModalOpen(true);
  };

  const handleDelete = async () => {
    if (!currentLinkBlock?.id) return;

    try {
      await deleteLink(currentLinkBlock.id);
      setIsDeleted(true);
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  };

  if (isDeleted) return null;

  if (!currentLink || !currentLinkBlock) return null;

  const formatTime = (date: string) => {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
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

  return (
    <div className="p-4 rounded-md shadow-sm border dark:border-gray-800 mb-4 bg-white dark:bg-gray-900">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 w-full">
          <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-gray-400 text-lg">
              <Link2 size={20} />
            </div>
          </div>
          <div className="flex-grow">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {currentLink.title}
            </h3>
            <a
              href={currentLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block"
            >
              {formatUrl(currentLink.url)}
            </a>
            {currentLink.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {currentLink.description}
              </p>
            )}
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {currentLinkBlock.created_at && (
                <span>{formatTime(currentLinkBlock.created_at)}</span>
              )}
            </div>
          </div>
        </div>
        {canEdit && (
          <BlockActions
            isEditMode={false}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
