import React from "react";
import Image from "next/image";
import { useState } from "react";
import { type ImageBlockType } from "@/types";
import { BlockActions, blockStyles } from "@/components/common";
import { ImageEditor, type ImageEditorResult } from "@/components/common/media";
import { imageLoader } from "@/utils/image";

interface Props {
  imageBlock: ImageBlockType;
  onDelete?: () => void;
  onSave?: (updatedBlock: Partial<ImageBlockType>) => void;
  noBorder?: boolean;
  hideEdit?: boolean;
}

export default function ImageBlock({
  imageBlock,
  onDelete,
  onSave,
  noBorder = false,
  hideEdit = false,
}: Props) {
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSave = async (result: ImageEditorResult) => {
    onSave?.(result);
    setIsEditMode(false);
  };

  if (isEditMode) {
    return (
      <div className={noBorder ? "" : blockStyles.container}>
        <ImageEditor
          currentImageUrl={imageBlock.image_url}
          currentCaption={imageBlock.caption || ""}
          currentWidth={imageBlock.width ?? undefined}
          currentHeight={imageBlock.height ?? undefined}
          onSave={handleSave}
          onCancel={() => setIsEditMode(false)}
        />
      </div>
    );
  }

  return (
    <div className={noBorder ? "" : blockStyles.container}>
      <div className="flex justify-end mb-2 gap-2">
        <BlockActions
          isEditMode={isEditMode}
          onEdit={hideEdit ? undefined : () => setIsEditMode(true)}
          onDelete={onDelete}
          onCancel={() => setIsEditMode(false)}
        />
      </div>

      <div className="relative w-full h-64 rounded-md overflow-hidden">
        <Image
          src={imageBlock.image_url}
          alt={imageBlock.caption || "Image"}
          fill
          className="object-cover"
          loader={imageLoader}
        />
      </div>

      {imageBlock.caption && (
        <figcaption className="mt-2 text-center text-gray-600 dark:text-gray-300">
          {imageBlock.caption}
        </figcaption>
      )}
    </div>
  );
}
