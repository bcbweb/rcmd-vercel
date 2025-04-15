"use client";

import { useSupabase } from "@/components/common/providers";
import {
  type ProfileBlockType,
  type TextBlockType,
  type ImageBlockType,
  type LinkBlockType,
  type RCMDBlockType,
  type CollectionBlockWithCollection,
} from "@/types";
import { useEffect, useState } from "react";
import TextBlock from "./blocks/text-block";
import ImageBlock from "./blocks/image-block";
import LinkBlock from "./blocks/link-block";
import RCMDBlock from "./blocks/rcmd-block";
import CollectionBlock from "./blocks/collection-block";

interface Props {
  block: ProfileBlockType;
  onDelete?: () => void;
  onSave?: (updatedBlock: ProfileBlockType) => void;
  noBorder?: boolean;
  hideEdit?: boolean;
}

export default function BlockRenderer({
  block,
  onDelete,
  onSave,
  noBorder = false,
  hideEdit = false,
}: Props) {
  const { supabase } = useSupabase();
  const [textBlock, setTextBlock] = useState<TextBlockType | null>(null);
  const [imageBlock, setImageBlock] = useState<ImageBlockType | null>(null);
  const [linkBlock, setLinkBlock] = useState<LinkBlockType | null>(null);
  const [rcmdBlock, setRCMDBlock] = useState<RCMDBlockType | null>(null);
  const [collectionBlock, setCollectionBlock] =
    useState<CollectionBlockWithCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlockData = async () => {
      try {
        let query;
        switch (block.type) {
          case "text":
            query = supabase
              .from("text_blocks")
              .select("*")
              .eq("profile_block_id", block.id)
              .single();
            break;
          case "image":
            query = supabase
              .from("image_blocks")
              .select("*")
              .eq("profile_block_id", block.id)
              .single();
            break;
          case "link":
            query = supabase
              .from("link_blocks")
              .select("*")
              .eq("profile_block_id", block.id)
              .single();
            break;
          case "rcmd":
            query = supabase
              .from("rcmd_blocks")
              .select("*")
              .eq("profile_block_id", block.id)
              .single();
            break;
          case "collection":
            query = supabase
              .from("collection_blocks")
              .select(
                `
								*,
								collection:collections (
									*,
									collection_items(
										*,
										rcmd:rcmd_id(*)
									)
								)
							`
              )
              .eq("profile_block_id", block.id)
              .single();
            break;
          default:
            setIsLoading(false);
            return;
        }

        const { data, error } = await query;
        if (error) throw error;

        switch (block.type) {
          case "text":
            setTextBlock(data);
            break;
          case "image":
            setImageBlock(data);
            break;
          case "link":
            setLinkBlock(data);
            break;
          case "rcmd":
            setRCMDBlock(data);
            break;
          case "collection":
            setCollectionBlock(data);
            break;
        }
      } catch (err) {
        console.error(`Error fetching ${block.type} block:`, err);
        setError(
          err instanceof Error ? err.message : "Failed to load block data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockData();
  }, [block.id, block.type, supabase]);

  const handleTextBlockSave = async (updatedBlock: Partial<TextBlockType>) => {
    if (!textBlock) return;

    try {
      const { error } = await supabase
        .from("text_blocks")
        .update({
          text: updatedBlock.text,
        })
        .eq("profile_block_id", block.id);

      if (error) throw error;

      setTextBlock({
        ...textBlock,
        text: updatedBlock.text ?? textBlock.text,
      });
      onSave?.(block);
    } catch (err) {
      console.error("Error saving text block:", err);
      throw err;
    }
  };

  const handleImageBlockSave = async (
    updatedBlock: Partial<ImageBlockType>
  ) => {
    if (!imageBlock) return;

    try {
      const { error } = await supabase
        .from("image_blocks")
        .update({
          image_url: updatedBlock.image_url,
          caption: updatedBlock.caption,
        })
        .eq("profile_block_id", block.id);

      if (error) throw error;

      setImageBlock({
        ...imageBlock,
        image_url: updatedBlock.image_url ?? imageBlock.image_url,
        caption: updatedBlock.caption ?? imageBlock.caption,
      });
      onSave?.(block);
    } catch (err) {
      console.error("Error saving image block:", err);
      throw err;
    }
  };

  const handleLinkBlockSave = async (updatedBlock: Partial<LinkBlockType>) => {
    if (!linkBlock) return;

    try {
      const { error } = await supabase
        .from("link_blocks")
        .update({
          link_id: updatedBlock.link_id,
        })
        .eq("profile_block_id", block.id);

      if (error) throw error;

      setLinkBlock({
        ...linkBlock,
        link_id: updatedBlock.link_id ?? linkBlock.link_id,
      });
      onSave?.(block);
    } catch (err) {
      console.error("Error saving link block:", err);
      throw err;
    }
  };

  const handleRCMDBlockSave = async (updatedBlock: Partial<RCMDBlockType>) => {
    if (!rcmdBlock) return;

    try {
      const { error } = await supabase
        .from("rcmd_blocks")
        .update({
          rcmd_id: updatedBlock.rcmd_id,
        })
        .eq("profile_block_id", block.id);

      if (error) throw error;

      setRCMDBlock({
        ...rcmdBlock,
        rcmd_id: updatedBlock.rcmd_id ?? rcmdBlock.rcmd_id,
      });
      onSave?.(block);
    } catch (err) {
      console.error("Error saving RCMD block:", err);
      throw err;
    }
  };

  const handleCollectionBlockSave = async (
    updatedBlock: Partial<CollectionBlockWithCollection>
  ) => {
    if (!collectionBlock) return;

    try {
      const { error } = await supabase
        .from("collection_blocks")
        .update({
          collection_id: updatedBlock.collection_id,
        })
        .eq("profile_block_id", block.id);

      if (error) throw error;

      // Fetch the updated collection data
      const { data: collectionData, error: collectionError } = await supabase
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
        .eq("id", updatedBlock.collection_id ?? collectionBlock.collection_id)
        .single();

      if (collectionError) throw collectionError;

      setCollectionBlock({
        ...collectionBlock,
        collection_id:
          updatedBlock.collection_id ?? collectionBlock.collection_id,
        collection: collectionData,
      });
      onSave?.(block);
    } catch (err) {
      console.error("Error saving collection block:", err);
      throw err;
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading block: {error}</div>;
  }

  switch (block.type) {
    case "text":
      if (!textBlock) return null;
      return (
        <TextBlock
          textBlock={textBlock}
          onDelete={onDelete}
          onSave={handleTextBlockSave}
          noBorder={noBorder}
          hideEdit={hideEdit}
        />
      );
    case "image":
      if (!imageBlock) return null;
      return (
        <ImageBlock
          imageBlock={imageBlock}
          onDelete={onDelete}
          onSave={handleImageBlockSave}
          noBorder={noBorder}
          hideEdit={hideEdit}
        />
      );
    case "link":
      if (!linkBlock) return null;
      return (
        <LinkBlock
          linkBlock={linkBlock}
          onDelete={onDelete}
          onSave={handleLinkBlockSave}
          noBorder={noBorder}
          hideEdit={hideEdit}
        />
      );
    case "rcmd":
      if (!rcmdBlock) return null;
      return (
        <RCMDBlock
          rcmdBlock={rcmdBlock}
          onDelete={onDelete}
          onSave={handleRCMDBlockSave}
          noBorder={noBorder}
          hideEdit={hideEdit}
        />
      );
    case "collection":
      if (!collectionBlock) return null;
      return (
        <CollectionBlock
          collection={collectionBlock.collection}
          onDelete={onDelete}
          onSave={() => handleCollectionBlockSave(collectionBlock)}
          noBorder={noBorder}
          hideEdit={hideEdit}
        />
      );
    default:
      return null;
  }
}
