"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RCMDBlockType, RCMD, RCMDVisibility } from "@/types";
import {
  BlockActions,
  BlockStats,
  BlockSkeleton,
  blockStyles,
} from "@/components/common";
import { ImageEditor, type ImageEditorResult } from "@/components/common/media";
import { MapPin, Link, DollarSign } from "lucide-react";

interface RCMDBlockProps {
  rcmdBlock: RCMDBlockType;
  onDelete?: () => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
}

export default function RCMDBlock({
  rcmdBlock,
  onDelete,
  onSave,
}: RCMDBlockProps) {
  const supabase = createClient();
  const [rcmd, setRCMD] = useState<RCMD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRCMD, setEditedRCMD] = useState<RCMD | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);

  useEffect(() => {
    const fetchRCMD = async () => {
      try {
        const { data, error } = await supabase
          .from("rcmds")
          .select("*")
          .eq("id", rcmdBlock.rcmd_id)
          .single();

        if (error) throw error;
        setRCMD(data);
        setEditedRCMD(data);
      } catch (err) {
        console.error("Error fetching rcmd:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRCMD();
  }, [rcmdBlock.rcmd_id, supabase]);

  const handleSave = async () => {
    if (!editedRCMD) return;

    try {
      const { error } = await supabase
        .from("rcmds")
        .update(editedRCMD)
        .eq("id", rcmdBlock.rcmd_id);

      if (error) throw error;

      setRCMD(editedRCMD);
      setIsEditMode(false);
      onSave?.(rcmdBlock);
    } catch (err) {
      console.error("Error updating rcmd:", err);
    }
  };

  const handleImageSave = async (result: ImageEditorResult) => {
    if (!editedRCMD) return;

    setEditedRCMD({
      ...editedRCMD,
      featured_image: result.image_url,
    });
    setIsEditingImage(false);
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

  if (!rcmd || !editedRCMD) return null;

  return (
    <div
      className={`${blockStyles.container} ${blockStyles.card} relative pt-12`}
    >
      <div className="absolute top-2 right-2 z-10">
        <BlockActions
          isEditMode={isEditMode}
          onEdit={() => setIsEditMode(true)}
          onDelete={onDelete}
          onSave={handleSave}
          onCancel={() => setIsEditMode(false)}
        />
      </div>

      {isEditingImage ? (
        <ImageEditor
          currentImageUrl={editedRCMD.featured_image || ""}
          showCaption={false}
          onSave={handleImageSave}
          onCancel={() => setIsEditingImage(false)}
          subfolder="rcmds"
        />
      ) : (
        <>
          {(editedRCMD.featured_image || isEditMode) && (
            <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
              {editedRCMD.featured_image ? (
                <Image
                  src={editedRCMD.featured_image}
                  alt={editedRCMD.title || "Featured image"}
                  fill
                  className="object-cover"
                />
              ) : null}
              {isEditMode && (
                <button
                  onClick={() => setIsEditingImage(true)}
                  className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-md text-sm hover:bg-black/70"
                >
                  {editedRCMD.featured_image ? "Change Image" : "Add Image"}
                </button>
              )}
            </div>
          )}

          {isEditMode ? (
            <input
              title="Edit title"
              type="text"
              value={editedRCMD.title}
              onChange={(e) =>
                setEditedRCMD({ ...editedRCMD, title: e.target.value })
              }
              className={blockStyles.inputField}
            />
          ) : (
            <h3 className={blockStyles.title}>{rcmd.title}</h3>
          )}

          {/* Location */}
          {(rcmd.location || isEditMode) && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {isEditMode ? (
                  <input
                    title="Edit location"
                    type="text"
                    value={
                      typeof editedRCMD.location === "string"
                        ? editedRCMD.location
                        : JSON.stringify(editedRCMD.location || "")
                    }
                    onChange={(e) =>
                      setEditedRCMD({
                        ...editedRCMD,
                        location: e.target.value,
                      })
                    }
                    className={`${blockStyles.inputField} text-sm`}
                    placeholder="Add location (e.g. 'New York, NY')"
                  />
                ) : (
                  formatLocation(rcmd.location)
                )}
              </span>
            </div>
          )}

          {/* URL */}
          {(rcmd.url || isEditMode) && (
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <Link className="w-3.5 h-3.5" />
                {isEditMode ? (
                  <input
                    title="Edit URL"
                    type="url"
                    value={editedRCMD.url || ""}
                    onChange={(e) =>
                      setEditedRCMD({ ...editedRCMD, url: e.target.value })
                    }
                    className={`${blockStyles.inputField} text-sm`}
                    placeholder="https://example.com"
                  />
                ) : (
                  <a
                    href={rcmd.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                  >
                    {rcmd.url?.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                )}
              </span>
            </div>
          )}

          {/* Price Range */}
          {(rcmd.price_range || isEditMode) && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                {isEditMode ? (
                  <input
                    title="Edit price range"
                    type="text"
                    value={
                      typeof editedRCMD.price_range === "string"
                        ? editedRCMD.price_range
                        : JSON.stringify(editedRCMD.price_range || "")
                    }
                    onChange={(e) =>
                      setEditedRCMD({
                        ...editedRCMD,
                        price_range: e.target.value,
                      })
                    }
                    className={`${blockStyles.inputField} text-sm`}
                    placeholder='{"min":10,"max":100,"currency":"$"}'
                  />
                ) : (
                  formatPriceRange(rcmd.price_range)
                )}
              </span>
            </div>
          )}

          {isEditMode ? (
            <textarea
              title="Edit description"
              value={editedRCMD.description || ""}
              onChange={(e) =>
                setEditedRCMD({ ...editedRCMD, description: e.target.value })
              }
              className={`${blockStyles.inputField} mt-2`}
              rows={3}
            />
          ) : (
            rcmd.description && (
              <p className={blockStyles.description}>{rcmd.description}</p>
            )
          )}

          {/* Tags */}
          {(rcmd.tags || isEditMode) && (
            <div className="mt-2 mb-3">
              {isEditMode ? (
                <input
                  title="Edit tags"
                  type="text"
                  value={editedRCMD.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setEditedRCMD({
                      ...editedRCMD,
                      tags: e.target.value.split(",").map((tag) => tag.trim()),
                    })
                  }
                  className={`${blockStyles.inputField} text-sm`}
                  placeholder="tag1, tag2, tag3"
                />
              ) : rcmd.tags && rcmd.tags.length > 0 ? (
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
              ) : null}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            {isEditMode ? (
              <select
                value={editedRCMD.visibility as RCMDVisibility}
                onChange={(e) =>
                  setEditedRCMD({
                    ...editedRCMD,
                    visibility: e.target.value as RCMDVisibility,
                  })
                }
                className={blockStyles.inputField}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="followers">Followers</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span className={blockStyles.tag}>{rcmd.visibility}</span>
                <span className={blockStyles.metaText}>
                  {new Date(rcmdBlock.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <BlockStats
            stats={[
              { value: rcmd.view_count || 0, label: "views" },
              { value: rcmd.like_count || 0, label: "likes" },
              { value: rcmd.share_count || 0, label: "shares" },
              { value: rcmd.save_count || 0, label: "saves" },
              { value: rcmd.click_count || 0, label: "clicks" },
            ]}
          />
        </>
      )}
    </div>
  );
}
