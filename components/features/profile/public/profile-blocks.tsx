"use client";

import { Suspense, useEffect } from "react";
import TextBlock from "./text-block";
import LinkBlock from "./link-block";
import RCMDBlock from "./rcmd-block";
import ImageBlock from "./image-block";
import CollectionBlock from "./collection-block";
import type { ProfileBlockType } from "@/types";

// Define a generic extended block type for type safe operations
interface ExtendedProfileBlock extends ProfileBlockType {
  rcmd_blocks?: Record<string, unknown>;
  rcmds?: Record<string, unknown>;
  [key: string]: unknown;
}

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
  // Add debugging for the blocks
  useEffect(() => {
    console.log("PublicProfileBlocks received blocks:", blocks);

    // Check for RCMD blocks specifically
    const rcmdBlocks = blocks.filter((block) => block.type === "rcmd");
    console.log(`Found ${rcmdBlocks.length} RCMD blocks:`, rcmdBlocks);

    // Log each RCMD block's structure
    rcmdBlocks.forEach((block, index) => {
      console.log(`RCMD block ${index + 1} structure:`, {
        id: block.id,
        type: block.type,
        hasRcmdBlocks: "rcmd_blocks" in block,
        hasRcmds: "rcmds" in block,
        keys: Object.keys(block),
      });
    });
  }, [blocks]);

  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        // Extract preloaded data if available
        let preloadedData: Record<string, unknown> | undefined = undefined;

        if (block.type === "rcmd") {
          console.log(`Processing RCMD block ID ${block.id}:`, block);
          const typedBlock = block as ExtendedProfileBlock;

          // First try with rcmd_blocks property
          if (
            typedBlock.rcmd_blocks &&
            typeof typedBlock.rcmd_blocks === "object"
          ) {
            preloadedData = {
              id: block.id,
              rcmd_blocks: typedBlock.rcmd_blocks,
            };
            console.log(`Using rcmd_blocks data:`, preloadedData);
          }
          // Next try with rcmds property - direct RCMD entity
          else if (typedBlock.rcmds && typeof typedBlock.rcmds === "object") {
            preloadedData = {
              id: block.id,
              rcmds: typedBlock.rcmds,
            };
            console.log(`Using rcmds data:`, preloadedData);
          }
          // Finally, if both are missing, create a minimal preloaded data
          else {
            console.log(
              `Block does NOT have rcmd_blocks or rcmds property, using minimal data`
            );
            preloadedData = {
              id: block.id,
              // Empty but defined to trigger client-side fetching
              rcmds: null,
            };
          }
        }

        return (
          <div key={block.id}>
            <BlockWithSuspense>
              {block.type === "text" && <TextBlock blockId={block.id} />}
              {block.type === "link" && <LinkBlock blockId={block.id} />}
              {block.type === "rcmd" && (
                <RCMDBlock blockId={block.id} preloadedData={preloadedData} />
              )}
              {block.type === "image" && <ImageBlock blockId={block.id} />}
              {block.type === "collection" && (
                <CollectionBlock blockId={block.id} />
              )}
            </BlockWithSuspense>
          </div>
        );
      })}
    </div>
  );
}
