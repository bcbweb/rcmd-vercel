"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { CollectionWithItems } from "@/types";
import { blockStyles } from "@/components/common";
import { formatDistance } from "date-fns";
import { GenericCarousel, RCMDCard } from "@/components/common/carousel";

interface CollectionBlockProps {
  blockId: string;
}

export default function CollectionBlock({ blockId }: CollectionBlockProps) {
  const [collection, setCollection] = useState<CollectionWithItems | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCollectionBlock() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from("collection_blocks")
          .select(`*, collections (*, collection_items(*, rcmds(*), links(*)))`)
          .eq("profile_block_id", blockId)
          .single();

        if (error) throw error;
        if (!data || !data.collections)
          throw new Error("Collection block not found");

        setCollection(data.collections);
      } catch (err) {
        console.error("Error fetching collection block:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchCollectionBlock();
  }, [blockId]);

  if (isLoading) {
    return (
      <div
        className={`${blockStyles.container} ${blockStyles.card} animate-pulse`}
      >
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !collection) return null;

  // Create RCMD cards for the carousel
  const rcmdCards = collection.collection_items
    ?.filter((item) => item.rcmd && item.item_type === "rcmd")
    .map((item) => <RCMDCard key={item.rcmd!.id} rcmd={item.rcmd!} />);

  return (
    <div className={`${blockStyles.container} ${blockStyles.card} pt-6`}>
      <h3 className={`${blockStyles.title} line-clamp-1`}>{collection.name}</h3>

      {collection.description && (
        <p className={`${blockStyles.description} line-clamp-2 mb-2`}>
          {collection.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-auto mb-3 text-sm">
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
      {rcmdCards && rcmdCards.length > 0 && (
        <div className="-mx-1 mt-1 mb-1">
          <GenericCarousel items={rcmdCards} cardsPerView={2} />
        </div>
      )}
    </div>
  );
}
