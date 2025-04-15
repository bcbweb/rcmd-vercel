"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ImageBlockType } from "@/types";
import { blockStyles } from "@/components/common";
import Image from "next/image";
import { imageLoader } from "@/utils/image";

interface ImageBlockProps {
  blockId: string;
}

export default function ImageBlock({ blockId }: ImageBlockProps) {
  const [imageBlock, setImageBlock] = useState<ImageBlockType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchImageBlock() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from("image_blocks")
          .select("*")
          .eq("profile_block_id", blockId)
          .single();

        if (error) throw error;
        if (!data || !data.image_url) throw new Error("Image block not found");

        setImageBlock(data);
      } catch (err) {
        console.error("Error fetching image block:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchImageBlock();
  }, [blockId]);

  if (isLoading) {
    return (
      <div className={`${blockStyles.container} animate-pulse`}>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-md mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
      </div>
    );
  }

  if (error || !imageBlock) return null;

  return (
    <div className={blockStyles.container}>
      <figure>
        <div
          className="relative w-full rounded-md overflow-hidden"
          style={{ height: imageBlock.height || "auto" }}
        >
          <Image
            src={imageBlock.image_url}
            alt={imageBlock.caption || "Image"}
            className="object-contain"
            fill={imageBlock.height ? true : false}
            width={
              !imageBlock.height && imageBlock.width
                ? imageBlock.width
                : undefined
            }
            height={imageBlock.height ? imageBlock.height : undefined}
            loader={imageLoader}
          />
        </div>
        {imageBlock.caption && (
          <figcaption className="mt-2 text-center text-gray-600 dark:text-gray-300">
            {imageBlock.caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
