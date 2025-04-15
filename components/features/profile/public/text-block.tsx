"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { TextBlockType } from "@/types";
import { blockStyles } from "@/components/common";
import parse from "html-react-parser";

interface TextBlockProps {
  blockId: string;
}

export default function TextBlock({ blockId }: TextBlockProps) {
  const [textBlock, setTextBlock] = useState<TextBlockType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTextBlock() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from("text_blocks")
          .select("*")
          .eq("profile_block_id", blockId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Text block not found");

        setTextBlock(data);
      } catch (err) {
        console.error("Error fetching text block:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchTextBlock();
  }, [blockId]);

  if (isLoading) {
    return (
      <div className={`${blockStyles.container} animate-pulse`}>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-4/5"></div>
      </div>
    );
  }

  if (error || !textBlock) return null;

  return (
    <div className={blockStyles.container}>
      <div className="prose dark:prose-invert max-w-none">
        {parse(textBlock.text)}
      </div>
    </div>
  );
}
