"use client";

import { Suspense } from "react";
import TextBlock from "./text-block";
import LinkBlock from "./link-block";
import RCMDBlock from "./rcmd-block";
import ImageBlock from "./image-block";
import CollectionBlock from "./collection-block";
import type { ProfileBlockType } from "@/types";

interface PublicProfileBlocksProps {
  blocks: ProfileBlockType[];
}

// Loading placeholder
function BlockSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse p-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/5"></div>
    </div>
  );
}

// Block wrapper with suspense boundary for individual blocks
function BlockWithSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<BlockSkeleton />}>{children}</Suspense>;
}

export default function PublicProfileBlocks({
  blocks,
}: PublicProfileBlocksProps) {
  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <div key={block.id}>
          <BlockWithSuspense>
            {block.type === "text" && <TextBlock blockId={block.id} />}
            {block.type === "link" && <LinkBlock blockId={block.id} />}
            {block.type === "rcmd" && <RCMDBlock blockId={block.id} />}
            {block.type === "image" && <ImageBlock blockId={block.id} />}
            {block.type === "collection" && (
              <CollectionBlock blockId={block.id} />
            )}
          </BlockWithSuspense>
        </div>
      ))}
    </div>
  );
}
