"use client";

import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import type {
  Collection,
  CollectionBlockType,
  CollectionWithItems,
} from "@/types";
import { BlockActions, blockStyles } from "@/components/common";
import useEmblaCarousel from "embla-carousel-react";
import { RcmdBlock } from "@/components/features/profile/blocks";
import { useCollectionStore } from "@/stores/collection-store";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CollectionBlockProps {
  collection: CollectionBlockType;
  onDelete?: () => void;
  onSave?: (block: Partial<CollectionBlockType>) => void;
}

export default function CollectionBlock({
  collection,
  onDelete,
  onSave,
}: CollectionBlockProps) {
  const collections = useCollectionStore(
    (state) => state.collections as CollectionWithItems[]
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const collectionData = collections.find(
    (c) => c.id === collection.collection_id
  );
  const [editedCollection, setEditedCollection] = useState(collectionData);

  if (!collectionData || !editedCollection) return null;

  const rcmdItems =
    collectionData.collection_items?.filter(
      (item) => item.item_type === "rcmd" && item.rcmd_id
    ) || [];

  const handleSave = async () => {
    if (!editedCollection || !collection.collection_id) return;

    try {
      await useCollectionStore
        .getState()
        .updateCollection(collection.collection_id, {
          name: editedCollection.name,
          description: editedCollection.description,
          visibility: editedCollection.visibility,
        });

      setIsEditMode(false);
      onSave?.(collection);
    } catch (err) {
      console.error("Error updating collection:", err);
    }
  };

  return (
    <div className={blockStyles.container}>
      <div className="flex items-start justify-between gap-2">
        {isEditMode ? (
          <input
            title="Edit name"
            type="text"
            value={editedCollection.name}
            onChange={(e) =>
              setEditedCollection({ ...editedCollection, name: e.target.value })
            }
            className={blockStyles.inputField}
          />
        ) : (
          <h3 className={blockStyles.title}>{collectionData.name}</h3>
        )}

        <BlockActions
          isEditMode={isEditMode}
          onEdit={() => setIsEditMode(true)}
          onDelete={onDelete}
          onSave={handleSave}
          onCancel={() => setIsEditMode(false)}
        />
      </div>

      {isEditMode ? (
        <textarea
          title="Edit description"
          value={editedCollection.description || ""}
          onChange={(e) =>
            setEditedCollection({
              ...editedCollection,
              description: e.target.value,
            })
          }
          className={`${blockStyles.inputField} mt-2`}
          rows={2}
        />
      ) : (
        collectionData.description && (
          <p className={blockStyles.description}>
            {collectionData.description}
          </p>
        )
      )}

      {/* Embla Carousel */}
      {rcmdItems.length > 0 && (
        <div className="mt-4 relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {rcmdItems.map(
                (item) =>
                  item.rcmd_id && (
                    <div className="flex-[0_0_300px]" key={item.rcmd_id.id}>
                      <RcmdBlock
                        rcmdBlock={{
                          id: item.id,
                          rcmd_id: item.rcmd_id.id,
                          created_at: item.created_at,
                          updated_at: "",
                          profile_block_id: "",
                        }}
                      />
                    </div>
                  )
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-md hover:bg-white dark:hover:bg-gray-800 transition-opacity ${
              prevBtnEnabled ? "opacity-100" : "opacity-0"
            }`}
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-md hover:bg-white dark:hover:bg-gray-800 transition-opacity ${
              nextBtnEnabled ? "opacity-100" : "opacity-0"
            }`}
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        {isEditMode ? (
          <select
            value={editedCollection.visibility || "public"}
            onChange={(e) =>
              setEditedCollection({
                ...editedCollection,
                visibility: e.target.value as Collection["visibility"],
              })
            }
            className={blockStyles.inputField}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="followers">Followers</option>
          </select>
        ) : (
          <div className="flex items-center gap-2">
            <span className={blockStyles.tag}>
              {collectionData.visibility || "public"}
            </span>
            <span className={blockStyles.tag}>
              {collectionData.collection_items?.length || 0} items
            </span>
            {collectionData.created_at && (
              <span className={blockStyles.metaText}>
                {formatDistanceToNow(new Date(collectionData.created_at), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
