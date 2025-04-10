// page.tsx
"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";
import { useCollectionStore } from "@/stores/collection-store";
import {
  AddCollectionButton,
  CollectionBlocks,
} from "@/components/features/collections";
import type {
  Collection,
  CollectionBlockType,
  CollectionItem,
  CollectionWithItems,
} from "@/types";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

// Create an extended type for the collection block that includes the _collection property
interface ExtendedCollectionBlock extends Partial<CollectionBlockType> {
  _collection?: {
    rcmdIds: string[];
    linkIds: string[];
    collection_items?: any[];
    [key: string]: any;
  };
}

export default function CollectionsPage() {
  const [collectionBlocks, setCollectionBlocks] = useState<
    CollectionBlockType[]
  >([]);
  const [isCollectionSaving, setIsCollectionSaving] = useState(false);
  const userId = useAuthStore((state) => state.userId);
  const { collections, fetchCollections, deleteCollection, updateCollection } =
    useCollectionStore();

  // Use a ref to track if a fetch is in progress to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  // Use a ref to track the last fetch time to prevent excessive fetches
  const lastFetchTimeRef = useRef(0);

  const transformCollectionsToBlocks = useCallback(
    (collections: Collection[]) => {
      return collections.map((collection) => ({
        id: crypto.randomUUID(),
        collection_id: collection.id,
        profile_block_id: `profile-block-${collection.id}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    },
    []
  );

  // Debounced fetch function to prevent multiple rapid fetches
  const debouncedFetchCollections = useCallback(
    (userId: string) => {
      const now = Date.now();
      // Don't fetch if we've fetched in the last 1 second or if a fetch is in progress
      if (isFetchingRef.current || now - lastFetchTimeRef.current < 1000) {
        console.log(
          "Page: Skipping fetch - already fetching or fetched recently"
        );
        return;
      }

      console.log("Page: Fetching collections");
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;

      fetchCollections(userId).finally(() => {
        isFetchingRef.current = false;
      });
    },
    [fetchCollections]
  );

  useEffect(() => {
    if (userId) {
      debouncedFetchCollections(userId);
    }
  }, [userId, debouncedFetchCollections]);

  useEffect(() => {
    setCollectionBlocks(transformCollectionsToBlocks(collections));
  }, [collections, transformCollectionsToBlocks]);

  useEffect(() => {
    useModalStore.setState({
      // Set a simple callback that does nothing - we'll handle updates through the onSave prop
      onModalSuccess: () => {
        console.log("Modal success callback - handled through onSave");
        // No need to refetch, as the store updates are already handled by the onSave function
      },
    });
  }, []);

  const handleDeleteCollection = useCallback(
    async (id: string) => {
      toast("Are you sure you want to delete this collection?", {
        duration: Infinity,
        action: {
          label: "Delete",
          onClick: async () => {
            try {
              setIsCollectionSaving(true);
              await deleteCollection(id);
              toast.success("Collection deleted successfully");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Failed to delete collection"
              );
            } finally {
              setIsCollectionSaving(false);
            }
          },
        },
        cancel: {
          label: "Cancel",
          onClick: () => {
            toast.dismiss();
          },
        },
      });
    },
    [deleteCollection]
  );

  // Track updates to prevent duplicate operations on the same collection
  const updatingCollectionRef = useRef<string | null>(null);

  const handleSaveCollection = async (block: ExtendedCollectionBlock) => {
    if (!userId || !block.collection_id) return;

    // Prevent duplicate saves on the same collection
    if (updatingCollectionRef.current === block.collection_id) {
      console.log(
        `Page: Already updating collection ${block.collection_id}, skipping`
      );
      return;
    }

    updatingCollectionRef.current = block.collection_id;

    try {
      console.log("Page: Starting to save collection", block.collection_id);
      setIsCollectionSaving(true);

      // Ensure we have the collection data
      if (!block._collection) {
        console.error("Missing _collection data in the block");
        return;
      }

      // Get the collection store instance
      const storeInstance = useCollectionStore.getState();

      // Prepare the batch update payload
      const batchUpdatePayload = {
        details: {} as Partial<Collection>,
        rcmdIds: undefined as string[] | undefined,
        linkIds: undefined as string[] | undefined,
      };

      // Add collection details if present
      if (block._collection.name !== undefined) {
        batchUpdatePayload.details.name = block._collection.name;
      }

      if (block._collection.description !== undefined) {
        batchUpdatePayload.details.description = block._collection.description;
      }

      if (block._collection.visibility !== undefined) {
        batchUpdatePayload.details.visibility = block._collection.visibility;
      }

      // Add collection items if present
      if (Array.isArray(block._collection.rcmdIds)) {
        batchUpdatePayload.rcmdIds = block._collection.rcmdIds;
      }

      if (Array.isArray(block._collection.linkIds)) {
        batchUpdatePayload.linkIds = block._collection.linkIds;
      }

      console.log("Batch updating collection with:", batchUpdatePayload);

      // Use a single batched update call instead of separate calls
      const result = await storeInstance.batchUpdateCollection(
        block.collection_id,
        batchUpdatePayload
      );

      if (result.error) {
        throw new Error(`Failed to update collection: ${result.error}`);
      }

      // Show a single success message
      toast.success("Collection updated successfully");
    } catch (error) {
      console.error("Page: Error saving collection:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save collection"
      );
    } finally {
      // Reset the updating ref and remove the saving indicator
      updatingCollectionRef.current = null;
      setIsCollectionSaving(false);
    }
  };

  // Helper functions for extracting IDs
  const extractRcmdIds = (collectionData: any) => {
    return (collectionData?.collection_items || [])
      .filter(
        (item: CollectionItem) =>
          item && item.item_type === "rcmd" && item.rcmd_id !== null
      )
      .map((item: CollectionItem) => {
        const isRcmdObject = (val: unknown): val is { id: string } =>
          typeof val === "object" && val !== null && "id" in val;
        return isRcmdObject(item.rcmd_id)
          ? item.rcmd_id.id
          : (item.rcmd_id as string);
      })
      .filter(Boolean);
  };

  const extractLinkIds = (collectionData: any) => {
    return (collectionData?.collection_items || [])
      .filter(
        (item: CollectionItem) =>
          item && item.item_type === "link" && item.link_id !== null
      )
      .map((item: CollectionItem) => {
        const isLinkObject = (val: unknown): val is { id: string } =>
          typeof val === "object" && val !== null && "id" in val;
        return isLinkObject(item.link_id)
          ? item.link_id.id
          : (item.link_id as string);
      })
      .filter(Boolean);
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <AddCollectionButton />
      </div>

      <CollectionBlocks
        initialCollectionBlocks={collectionBlocks}
        onDelete={handleDeleteCollection}
        onSave={handleSaveCollection}
      />

      {isCollectionSaving && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
          Saving changes...
        </div>
      )}
    </div>
  );
}
