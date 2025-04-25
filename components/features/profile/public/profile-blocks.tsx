"use client";

import { Suspense, useEffect } from "react";
import TextBlock from "./text-block";
import LinkBlock from "./link-block";
import RCMDBlock from "./rcmd-block";
import ImageBlock from "./image-block";
import CollectionBlock from "./collection-block";
import type { ProfileBlockType } from "@/types";

// Create an interface that matches what we're receiving in blocks which
// includes the entity_id and rcmds properties that might not be in the standard ProfileBlockType
type EnhancedProfileBlock = ProfileBlockType & {
  entity_id?: string;
  rcmds?: Record<string, unknown>;
  rcmd_blocks?: Record<string, unknown>;
  [key: string]: unknown;
};

interface PublicProfileBlocksProps {
  blocks: (ProfileBlockType | EnhancedProfileBlock)[];
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
    console.log("[PublicProfileBlocks] Received blocks:", blocks);

    // Check for RCMD blocks specifically
    const rcmdBlocks = blocks.filter((block) => block.type === "rcmd");
    console.log(`[PublicProfileBlocks] Found ${rcmdBlocks.length} RCMD blocks`);

    // Log each RCMD block's structure (but limit to first 3 to avoid console spam)
    rcmdBlocks.slice(0, 3).forEach((block, index) => {
      const enhancedBlock = block as EnhancedProfileBlock;
      console.log(`[PublicProfileBlocks] RCMD block ${index + 1} structure:`, {
        id: block.id,
        type: block.type,
        hasRcmdBlocks: "rcmd_blocks" in block,
        hasRcmds: "rcmds" in block,
        hasEntityId: "entity_id" in block,
        entityId: enhancedBlock.entity_id || null,
        keys: Object.keys(block),
      });
    });

    if (rcmdBlocks.length > 3) {
      console.log(
        `[PublicProfileBlocks] Plus ${rcmdBlocks.length - 3} more RCMD blocks...`
      );
    }
  }, [blocks]);

  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        // Extract preloaded data if available
        let preloadedData: Record<string, unknown> | undefined = undefined;

        if (block.type === "rcmd") {
          console.log(
            `[PublicProfileBlocks] Processing RCMD block ID ${block.id}`
          );
          const enhancedBlock = block as EnhancedProfileBlock;

          // Always include entity_id if available
          const baseData: Record<string, unknown> = {
            id: block.id,
          };

          if (enhancedBlock.entity_id) {
            baseData.entity_id = enhancedBlock.entity_id;
          }

          // First try with rcmd_blocks property
          if (
            enhancedBlock.rcmd_blocks &&
            typeof enhancedBlock.rcmd_blocks === "object"
          ) {
            preloadedData = {
              ...baseData,
              rcmd_blocks: enhancedBlock.rcmd_blocks,
            };
            console.log(
              `[PublicProfileBlocks] Using rcmd_blocks data for block ${block.id}`
            );
          }
          // Next try with rcmds property - direct RCMD entity
          else if (
            enhancedBlock.rcmds &&
            typeof enhancedBlock.rcmds === "object"
          ) {
            preloadedData = {
              ...baseData,
              rcmds: enhancedBlock.rcmds,
            };
            console.log(
              `[PublicProfileBlocks] Using rcmds data for block ${block.id}`
            );
          }
          // If we have entity_id but no data, pass the entity_id for direct fetch
          else if (enhancedBlock.entity_id) {
            preloadedData = {
              ...baseData,
              // Null but defined to trigger client-side fetching
              rcmds: null,
            };
            console.log(
              `[PublicProfileBlocks] Using entity_id for block ${block.id}: ${enhancedBlock.entity_id}`
            );
          }
          // Finally, if everything is missing, create a minimal preloaded data
          else {
            console.warn(
              `[PublicProfileBlocks] Block ${block.id} does NOT have rcmd_blocks, rcmds, or entity_id properties`
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
