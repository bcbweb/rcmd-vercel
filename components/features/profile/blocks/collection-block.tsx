"use client";

import React, { useState, useCallback } from "react";
import { CollectionWithItems } from "@/types";
import { formatDistance } from "date-fns";
import { useModalStore } from "@/stores/modal-store";
import { BlockActions, blockStyles } from "@/components/common";
import { GenericCarousel, RCMDCard } from "@/components/common/carousel";
import { EyeOff, Globe } from "lucide-react";
import { confirmDelete } from "@/utils/confirm";

// Extended block type to include _collection property
interface ExtendedCollectionBlock {
  collection_id?: string;
  id?: string;
  _collection?: {
    rcmdIds: string[];
    linkIds: string[];
    collection_items?: Record<string, unknown>[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CollectionBlockProps {
  collection: CollectionWithItems;
  onDelete?: () => void;
  onSave?: (block: ExtendedCollectionBlock) => void;
  noBorder?: boolean;
  hideEdit?: boolean;
}

export default function CollectionBlock({
  collection,
  onDelete,
  onSave,
  noBorder = false,
  hideEdit = false,
}: CollectionBlockProps) {
  const {
    setIsCollectionModalOpen,
    setOnModalSuccess,
    setIsCollectionEditMode,
    setCollectionToEdit,
  } = useModalStore();
  const [isLoading] = useState(false);

  const handleEdit = useCallback(() => {
    if (!collection || !collection.id) {
      console.error("Cannot edit: collection is undefined or missing id");
      return;
    }

    console.log("🔍 handleEdit triggered for collection:", collection.id);

    // First, reset any previous modal state
    useModalStore.getState().resetCollectionModal();

    // Then set up for editing this collection
    setCollectionToEdit(collection);
    setIsCollectionEditMode(true);

    // Set up a simpler success callback that just passes the updated data to the parent
    setOnModalSuccess((updatedCollection) => {
      console.log("Modal success callback received data:", updatedCollection);

      if (!collection.id || !updatedCollection) return;

      // Let the parent handle the actual update logic
      if (onSave) {
        const updatedBlock = {
          collection_id: collection.id,
          updated_at: new Date().toISOString(),
          _collection: {
            // Include all the essential collection data
            name: updatedCollection.name,
            description: updatedCollection.description,
            visibility: updatedCollection.visibility,
            // Extract IDs from the collection items if present
            rcmdIds: (updatedCollection.collection_items || [])
              .filter(
                (item: Record<string, unknown>) =>
                  item && item.item_type === "rcmd" && item.rcmd_id
              )
              .map((item: Record<string, unknown>) => {
                if (
                  typeof item.rcmd_id === "object" &&
                  item.rcmd_id &&
                  "id" in item.rcmd_id
                ) {
                  return (item.rcmd_id as { id: string }).id;
                }
                return item.rcmd_id;
              })
              .filter(Boolean),
            linkIds: (updatedCollection.collection_items || [])
              .filter(
                (item: Record<string, unknown>) =>
                  item && item.item_type === "link" && item.link_id
              )
              .map((item: Record<string, unknown>) => {
                if (
                  typeof item.link_id === "object" &&
                  item.link_id &&
                  "id" in item.link_id
                ) {
                  return (item.link_id as { id: string }).id;
                }
                return item.link_id;
              })
              .filter(Boolean),
          },
        };

        // Let the parent component handle the actual update - no toast here
        onSave(updatedBlock);
      }
    });

    // Open the modal
    setIsCollectionModalOpen(true);
  }, [
    collection,
    setCollectionToEdit,
    setIsCollectionEditMode,
    setOnModalSuccess,
    setIsCollectionModalOpen,
    onSave,
  ]);

  // We use this function in the BlockActions component
  const handleDeleteCollection = () => {
    if (!onDelete) return;

    confirmDelete({
      title: "Delete Collection",
      description: `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        if (onDelete) {
          await onDelete();
        }
      },
    });
  };

  // Prepare visibility badge
  const renderVisibilityBadge = () => {
    if (collection.visibility === "public") {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
          <Globe className="h-3 w-3" />
          <span>Public</span>
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
          <EyeOff className="h-3 w-3" />
          <span>Private</span>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div
        className={`${blockStyles.container} ${blockStyles.card} animate-pulse`}
      >
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!collection) return null;

  // Create RCMD cards for the carousel
  const rcmdCards =
    collection.collection_items
      ?.filter((item) => item.rcmd && item.item_type === "rcmd")
      .map((item) => <RCMDCard key={item.rcmd!.id} rcmd={item.rcmd!} />) || [];

  return (
    <div
      className={`${noBorder ? "" : blockStyles.container} ${blockStyles.card} relative h-full flex flex-col pt-10`}
    >
      <div className="absolute top-2 right-2 z-10">
        <BlockActions
          isEditMode={false}
          onEdit={hideEdit ? undefined : handleEdit}
          onDelete={handleDeleteCollection}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </div>

      <h3 className={`${blockStyles.title} line-clamp-1`}>{collection.name}</h3>

      {collection.description && (
        <p className={`${blockStyles.description} line-clamp-2 mb-2`}>
          {collection.description}
        </p>
      )}

      <div className="flex items-center flex-wrap gap-2 mt-1 mb-3">
        {renderVisibilityBadge()}

        <span className={blockStyles.metaText}>
          {collection.collection_items?.length || 0} item
          {collection.collection_items?.length !== 1 ? "s" : ""}
        </span>
        {collection.created_at && (
          <span className={blockStyles.metaText}>
            {formatDistance(new Date(collection.created_at), new Date(), {
              addSuffix: true,
            })}
          </span>
        )}
      </div>

      {/* RCMD Carousel */}
      {rcmdCards.length > 0 && (
        <div className="-mx-1 mt-1 mb-1">
          <GenericCarousel items={rcmdCards} cardsPerView={2} />
        </div>
      )}
    </div>
  );
}
