"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { CollectionWithItems, RCMDVisibility } from "@/types";
import { formatDistance } from "date-fns";
import { useModalStore } from "@/stores/modal-store";
import { BlockActions, blockStyles } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { useCollectionStore } from "@/stores/collection-store";
import { GenericCarousel, RCMDCard } from "@/components/common/carousel";
import { toast } from "sonner";

// Extended block type to include _collection property
interface ExtendedCollectionBlock {
  collection_id?: string;
  id?: string;
  _collection?: {
    rcmdIds: string[];
    linkIds: string[];
    collection_items?: any[];
    [key: string]: any;
  };
  [key: string]: any;
}

interface CollectionBlockProps {
  collection: CollectionWithItems;
  onDelete?: () => void;
  onSave?: (block: ExtendedCollectionBlock) => void;
}

interface CollectionModalProps {
  collection: CollectionWithItems;
  onSuccess: (updatedCollection: {
    name: string;
    description: string;
    visibility: RCMDVisibility;
    collection_items?: CollectionWithItems["collection_items"];
  }) => void;
  onClose: () => void;
}

export default function CollectionBlock({
  collection,
  onDelete,
  onSave,
}: CollectionBlockProps) {
  const {
    setIsCollectionModalOpen,
    setOnModalSuccess,
    setIsCollectionEditMode,
    setCollectionToEdit,
  } = useModalStore();
  const { updateCollection, updateCollectionItems } = useCollectionStore();
  const [isLoading, setIsLoading] = useState(false);

  const openCollectionModal = useCallback(
    ({ collection, onSuccess }: Omit<CollectionModalProps, "onClose">) => {
      if (!collection) {
        console.error("Cannot open modal: collection is undefined");
        return;
      }

      console.log(
        "🔍 openCollectionModal called with collection:",
        collection.id || "unknown id"
      );
      setCollectionToEdit(collection);
      setIsCollectionEditMode(true);

      // Pass the onSuccess callback directly
      setOnModalSuccess(onSuccess);
      setIsCollectionModalOpen(true);
    },
    [
      setCollectionToEdit,
      setIsCollectionEditMode,
      setOnModalSuccess,
      setIsCollectionModalOpen,
    ]
  );

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
                (item: any) => item && item.item_type === "rcmd" && item.rcmd_id
              )
              .map((item: any) => {
                if (typeof item.rcmd_id === "object" && item.rcmd_id?.id) {
                  return item.rcmd_id.id;
                }
                return item.rcmd_id;
              })
              .filter(Boolean),
            linkIds: (updatedCollection.collection_items || [])
              .filter(
                (item: any) => item && item.item_type === "link" && item.link_id
              )
              .map((item: any) => {
                if (typeof item.link_id === "object" && item.link_id?.id) {
                  return item.link_id.id;
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
  const handleDeleteCollection = onDelete;

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
      className={`${blockStyles.container} ${blockStyles.card} relative pt-12`}
    >
      <div className="absolute top-2 right-2 z-10">
        <BlockActions
          isEditMode={false}
          onEdit={handleEdit}
          onDelete={handleDeleteCollection}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </div>

      <h3 className={blockStyles.title}>{collection.name}</h3>

      {collection.description && (
        <p className={blockStyles.description}>{collection.description}</p>
      )}

      <div className="flex items-center gap-2 mt-2 mb-4">
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
        <div className="-mx-4 mt-4">
          <GenericCarousel items={rcmdCards} cardsPerView={3} />
        </div>
      )}
    </div>
  );
}
