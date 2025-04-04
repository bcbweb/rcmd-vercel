"use client";

import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import type { LinkBlockType, Link } from "@/types";
import {
  BlockActions,
  blockStyles,
  BlockStats,
  BlockSkeleton,
} from "@/components/common";

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedLink, setEditedLink] = useState<Link | null>(null);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const { data, error } = await supabase
          .from("links")
          .select("*")
          .eq("id", linkBlock.link_id)
          .single();

        if (error) throw error;
        setLink(data);
        setEditedLink(data);
      } catch (err) {
        console.error("Error fetching link:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLink();
  }, [linkBlock.link_id, supabase]);

  const handleLinkClick = async () => {
    if (!link) return;

    try {
      await supabase.rpc("increment_link_click_count", { link_id: link.id });
      setLink((prev) =>
        prev ? { ...prev, click_count: (prev.click_count || 0) + 1 } : null
      );
    } catch (error) {
      console.error("Error incrementing click count:", error);
    }
  };

  const handleSave = async () => {
    if (!editedLink) return;

    try {
      const { error } = await supabase
        .from("links")
        .update(editedLink)
        .eq("id", linkBlock.link_id);

      if (error) throw error;

      setLink(editedLink);
      setIsEditMode(false);
      onSave?.(linkBlock);
    } catch (err) {
      console.error("Error updating link:", err);
    }
  };

  if (isLoading) {
    return <BlockSkeleton lines={1} className="p-2" />;
  }

  if (!link || !editedLink) return null;

  return (
    <div className={blockStyles.container}>
      <div className="flex items-start justify-between gap-2">
        {isEditMode ? (
          <input
            title="Edit title"
            type="text"
            value={editedLink.title}
            onChange={(e) =>
              setEditedLink({ ...editedLink, title: e.target.value })
            }
            className={blockStyles.inputField}
          />
        ) : (
          <h3 className={blockStyles.title}>{link.title}</h3>
        )}

        <div className="flex items-center gap-2">
          {!isEditMode && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
                  dark:hover:text-gray-300"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <BlockActions
            isEditMode={isEditMode}
            onEdit={() => setIsEditMode(true)}
            onDelete={onDelete}
            onSave={handleSave}
            onCancel={() => setIsEditMode(false)}
          />
        </div>
      </div>

      {isEditMode ? (
        <>
          <input
            title="Edit URL"
            type="url"
            value={editedLink.url}
            onChange={(e) =>
              setEditedLink({ ...editedLink, url: e.target.value })
            }
            className={`${blockStyles.inputField} mt-2`}
          />
          <textarea
            title="Edit description"
            value={editedLink.description || ""}
            onChange={(e) =>
              setEditedLink({ ...editedLink, description: e.target.value })
            }
            className={`${blockStyles.inputField} mt-2`}
            rows={2}
          />
        </>
      ) : (
        link.description && (
          <p className={blockStyles.description}>{link.description}</p>
        )
      )}

      <div className="flex items-center gap-2 mt-2">
        {isEditMode ? (
          <select
            value={editedLink.visibility}
            onChange={(e) =>
              setEditedLink({ ...editedLink, visibility: e.target.value })
            }
            className={blockStyles.inputField}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="followers">Followers</option>
          </select>
        ) : (
          <div className="flex items-center gap-2">
            <span className={blockStyles.tag}>{link.type}</span>
            <span className={blockStyles.tag}>{link.visibility}</span>
            <span className={blockStyles.metaText}>
              {formatDistanceToNow(new Date(linkBlock.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}
      </div>

      <BlockStats
        stats={[
          { value: link.view_count, label: "views" },
          { value: link.click_count, label: "clicks" },
          { value: link.share_count, label: "shares" },
          { value: link.save_count, label: "saves" },
        ]}
      />
    </div>
  );
}
