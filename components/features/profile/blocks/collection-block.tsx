"use client";

import React, { useState } from "react";
import { CollectionWithItems } from "@/types";
import { formatDistance } from "date-fns";
import { useModalStore } from "@/stores/modal-store";
import { BlockActions } from "@/components/common";
import { createClient } from "@/utils/supabase/client";
import { useCollectionStore } from "@/stores/collection-store";
import { GenericCarousel, RCMDCard } from "@/components/common/carousel";

interface CollectionBlockProps {
  collection?: CollectionWithItems;
  onDelete?: () => void;
  onSave?: () => void;
  canEdit?: boolean;
}

export default function CollectionBlock({
  collection,
  onDelete,
  onSave,
  canEdit = false,
}: CollectionBlockProps) {
  const {
    setIsCollectionModalOpen,
    setOnModalSuccess,
    setIsCollectionEditMode,
    setCollectionToEdit,
  } = useModalStore();
  const { deleteCollection } = useCollectionStore();
  const [isDeleted, setIsDeleted] = useState(false);
  const [currentCollection, setCurrentCollection] = useState<
    CollectionWithItems | undefined
  >(collection);

  const fetchCollection = async () => {
    if (!collection?.id) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("collections")
      .select(
        `
        *,
        collection_items(
          rcmds(*)
        )
      `
      )
      .eq("id", collection.id)
      .single();

    if (error) {
      console.error("Error fetching collection:", error);
      return;
    }

    if (data) {
      setCurrentCollection(data);
    }
  };

  const handleEdit = () => {
    if (!currentCollection) return;

    // Set up success callback
    setOnModalSuccess(() => {
      fetchCollection();
      if (onSave) onSave();
    });

    // Set edit mode and data in store
    setIsCollectionEditMode(true);
    setCollectionToEdit(currentCollection);
    setIsCollectionModalOpen(true);
  };

  const handleDelete = async () => {
    if (!currentCollection?.id) return;

    try {
      await deleteCollection(currentCollection.id);
      setIsDeleted(true);
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting collection:", error);
    }
  };

  if (isDeleted) return null;

  if (!currentCollection) return null;

  const formatTime = (date: string) => {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  };

  // Create RCMD cards for the carousel
  const rcmdCards =
    currentCollection.collection_items
      ?.filter((item) => item.rcmds && item.item_type === "rcmd")
      .map((item) => <RCMDCard key={item.rcmds!.id} rcmd={item.rcmds!} />) ||
    [];

  return (
    <div className="rounded-md shadow-sm border dark:border-gray-800 mb-4 bg-white dark:bg-gray-900">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {currentCollection.name}
            </h3>
            {currentCollection.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {currentCollection.description}
              </p>
            )}

            {currentCollection.collection_items &&
              currentCollection.collection_items.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentCollection.collection_items.length} item
                    {currentCollection.collection_items.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {currentCollection.created_at && (
                <span>{formatTime(currentCollection.created_at)}</span>
              )}
            </div>
          </div>

          {canEdit && (
            <BlockActions
              isEditMode={false}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* RCMD Carousel */}
      {rcmdCards.length > 0 && (
        <div className="-mx-4">
          <GenericCarousel items={rcmdCards} cardsPerView={3} />
        </div>
      )}
    </div>
  );
}
