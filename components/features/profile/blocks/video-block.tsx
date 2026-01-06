"use client";

import React, { useState } from "react";
import { type VideoBlockType } from "@/types";
import { BlockActions, blockStyles } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Props {
  videoBlock: VideoBlockType;
  onDelete?: () => void;
  onSave?: (updatedBlock: Partial<VideoBlockType>) => void;
  noBorder?: boolean;
  hideEdit?: boolean;
}

// Helper function to get embed URL from video URL
const getEmbedUrl = (
  videoUrl: string,
  videoType: string,
  videoId: string
): string => {
  if (videoType === "youtube") {
    return `https://www.youtube.com/embed/${videoId}`;
  } else if (videoType === "vimeo") {
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return videoUrl;
};

export default function VideoBlock({
  videoBlock,
  onDelete,
  onSave,
  noBorder = false,
  hideEdit = false,
}: Props) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [caption, setCaption] = useState(videoBlock.caption || "");
  const supabase = createClient();

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("video_blocks")
        .update({
          caption: caption || null,
        })
        .eq("id", videoBlock.id);

      if (error) throw error;

      onSave?.({
        ...videoBlock,
        caption: caption || null,
      });
      setIsEditMode(false);
      toast.success("Video block updated successfully");
    } catch (error) {
      console.error("Error saving video block:", error);
      toast.error("Failed to update video block");
    }
  };

  if (isEditMode) {
    return (
      <div className={noBorder ? "" : blockStyles.container}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="Optional caption"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Note: To change the video, delete this block and add a new one.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <BlockActions
              isEditMode={true}
              onSave={handleSave}
              onCancel={() => setIsEditMode(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(
    videoBlock.video_url,
    videoBlock.video_type,
    videoBlock.video_id
  );

  return (
    <div className={noBorder ? "" : blockStyles.container}>
      <div className="flex justify-end mb-2 gap-2">
        <BlockActions
          isEditMode={isEditMode}
          onEdit={hideEdit ? undefined : () => setIsEditMode(true)}
          onDelete={onDelete}
          onCancel={() => setIsEditMode(false)}
        />
      </div>

      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={videoBlock.caption || "Video"}
        />
      </div>

      {videoBlock.caption && (
        <figcaption className="mt-2 text-center text-gray-600 dark:text-gray-300">
          {videoBlock.caption}
        </figcaption>
      )}
    </div>
  );
}
