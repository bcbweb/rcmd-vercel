"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import type { RCMDBlockType, RCMD, RCMDVisibility } from "@/types";
import BlockActions from "@/components/shared/block-actions";
import BlockStats from "@/components/shared/block-stats";
import BlockSkeleton from "@/components/shared/block-skeleton";
import { blockStyles } from "@/components/shared/styles";
import ImageEditor, { type ImageEditorResult } from "@/components/shared/image-editor";

interface RCMDBlockProps {
  rcmdBlock: RCMDBlockType;
  onDelete?: () => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
}

export default function RCMDBlock({
  rcmdBlock,
  onDelete,
  onSave,
}: RCMDBlockProps) {
  const supabase = createClient();
  const [rcmd, setRCMD] = useState<RCMD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRCMD, setEditedRCMD] = useState<RCMD | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);

  useEffect(() => {
    const fetchRCMD = async () => {
      try {
        const { data, error } = await supabase
          .from('rcmds')
          .select('*')
          .eq('id', rcmdBlock.rcmd_id)
          .single();

        if (error) throw error;
        setRCMD(data);
        setEditedRCMD(data);
      } catch (err) {
        console.error('Error fetching rcmd:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRCMD();
  }, [rcmdBlock.rcmd_id, supabase]);

  const handleSave = async () => {
    if (!editedRCMD) return;

    try {
      const { error } = await supabase
        .from('rcmds')
        .update(editedRCMD)
        .eq('id', rcmdBlock.rcmd_id);

      if (error) throw error;

      setRCMD(editedRCMD);
      setIsEditMode(false);
      onSave?.(rcmdBlock);
    } catch (err) {
      console.error('Error updating rcmd:', err);
    }
  };

  const handleImageSave = async (result: ImageEditorResult) => {
    if (!editedRCMD) return;

    setEditedRCMD({
      ...editedRCMD,
      featured_image: result.image_url,
    });
    setIsEditingImage(false);
  };

  if (isLoading) {
    return <BlockSkeleton hasImage={true} lines={3} />;
  }

  if (!rcmd || !editedRCMD) return null;

  return (
    <div className={`${blockStyles.container} ${blockStyles.card} relative pt-12`}>
      <div className="absolute top-2 right-2 z-10">
        <BlockActions
          isEditMode={isEditMode}
          onEdit={() => setIsEditMode(true)}
          onDelete={onDelete}
          onSave={handleSave}
          onCancel={() => setIsEditMode(false)}
        />
      </div>

      {isEditingImage ? (
        <ImageEditor
          currentImageUrl={editedRCMD.featured_image || ''}
          onSave={handleImageSave}
          onCancel={() => setIsEditingImage(false)}
          subfolder="rcmds"
        />
      ) : (
        <>
          {(editedRCMD.featured_image || isEditMode) && (
            <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
              {editedRCMD.featured_image ? (
                <Image
                  src={editedRCMD.featured_image}
                  alt={editedRCMD.title || 'Featured image'}
                  fill
                  className="object-cover"
                />
              ) : null}
              {isEditMode && (
                <button
                  onClick={() => setIsEditingImage(true)}
                  className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-md text-sm hover:bg-black/70"
                >
                  {editedRCMD.featured_image ? 'Change Image' : 'Add Image'}
                </button>
              )}
            </div>
          )}

          {isEditMode ? (
            <input
              title="Edit title"
              type="text"
              value={editedRCMD.title}
              onChange={(e) => setEditedRCMD({ ...editedRCMD, title: e.target.value })}
              className={blockStyles.inputField}
            />
          ) : (
            <h3 className={blockStyles.title}>{rcmd.title}</h3>
          )}

          {isEditMode ? (
            <textarea
              title="Edit description"
              value={editedRCMD.description || ''}
              onChange={(e) => setEditedRCMD({ ...editedRCMD, description: e.target.value })}
              className={`${blockStyles.inputField} mt-2`}
              rows={3}
            />
          ) : (
            rcmd.description && (
              <p className={blockStyles.description}>{rcmd.description}</p>
            )
          )}

          <div className="flex items-center gap-2 mt-2">
            {isEditMode ? (
              <select
                value={editedRCMD.visibility as RCMDVisibility}
                onChange={(e) => setEditedRCMD({ ...editedRCMD, visibility: e.target.value as RCMDVisibility })}
                className={blockStyles.inputField}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="followers">Followers</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span className={blockStyles.tag}>{rcmd.visibility}</span>
                <span className={blockStyles.metaText}>
                  {new Date(rcmdBlock.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <BlockStats
            stats={[
              { value: rcmd.view_count, label: 'views' },
              { value: rcmd.like_count, label: 'likes' },
              { value: rcmd.share_count, label: 'shares' },
            ]}
          />
        </>
      )}
    </div>
  );
}