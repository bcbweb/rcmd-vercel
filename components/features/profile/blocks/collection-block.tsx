"use client";

import React, { useState, useCallback, useEffect } from "react";
import { CollectionWithItems } from "@/types";
import { formatDistance } from "date-fns";
import { useModalStore } from "@/stores/modal-store";
import { BlockActions, blockStyles } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { useCollectionStore } from "@/stores/collection-store";
import { GenericCarousel, RCMDCard } from "@/components/common/carousel";

interface CollectionBlockProps {
  collection: CollectionWithItems;
  onDelete?: () => void;
  onSave?: () => void;
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
  const { deleteCollection } = useCollectionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentCollection, setCurrentCollection] =
    useState<CollectionWithItems>(collection);

  const fetchCollection = useCallback(async () => {
    if (!collection?.id) return;

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("collections")
        .select(
          `
          *,
          collection_items(
            *,
            rcmd:rcmd_id(*)
          )
        `
        )
        .eq("id", collection.id)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentCollection(data);
      }
    } catch (err) {
      console.error("Error fetching collection:", err);
    } finally {
      setIsLoading(false);
    }
  }, [collection?.id]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleEdit = () => {
    if (!currentCollection) return;

    // Set up modal success callback
    setOnModalSuccess(() => {
      // Refetch the Collection to get updated data
      fetchCollection();
      if (onSave) onSave();
    });

    // Set the edit mode and data to edit
    setIsCollectionEditMode(true);
    setCollectionToEdit(currentCollection);

    // Open the Collection modal in edit mode
    setIsCollectionModalOpen(true);
  };

  const handleDelete = async () => {
    if (!currentCollection?.id) return;

    try {
      await deleteCollection(currentCollection.id);
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting collection:", error);
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

  if (!currentCollection) return null;

  // Create RCMD cards for the carousel
  const rcmdCards =
    currentCollection.collection_items
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
          onDelete={handleDelete}
          onSave={() => {}}
          onCancel={() => {}}
        />
      </div>

      <h3 className={blockStyles.title}>{currentCollection.name}</h3>

      {currentCollection.description && (
        <p className={blockStyles.description}>
          {currentCollection.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2 mb-4">
        <span className={blockStyles.metaText}>
          {currentCollection.collection_items?.length || 0} item
          {currentCollection.collection_items?.length !== 1 ? "s" : ""}
        </span>
        {currentCollection.created_at && (
          <span className={blockStyles.metaText}>
            {formatDistance(
              new Date(currentCollection.created_at),
              new Date(),
              { addSuffix: true }
            )}
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
