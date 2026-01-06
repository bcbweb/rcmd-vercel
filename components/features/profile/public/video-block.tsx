"use client";

import { useState, useEffect } from "react";
import { type VideoBlockType } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { blockStyles } from "@/components/common";

interface VideoBlockProps {
  blockId: string;
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

export default function VideoBlock({ blockId }: VideoBlockProps) {
  const [videoBlock, setVideoBlock] = useState<VideoBlockType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchVideoBlock() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from("video_blocks")
          .select("*")
          .eq("profile_block_id", blockId)
          .single();

        if (error) throw error;
        if (!data || !data.video_url) throw new Error("Video block not found");

        setVideoBlock(data);
      } catch (err) {
        console.error("Error fetching video block:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchVideoBlock();
  }, [blockId]);

  if (isLoading) {
    return (
      <div className={`${blockStyles.container} animate-pulse`}>
        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>
    );
  }

  if (error || !videoBlock) return null;

  const embedUrl = getEmbedUrl(
    videoBlock.video_url,
    videoBlock.video_type,
    videoBlock.video_id
  );

  return (
    <div className={blockStyles.container}>
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
