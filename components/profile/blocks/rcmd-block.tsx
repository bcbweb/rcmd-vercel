"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import type { RCMDBlockType, RCMD, RCMDVisibility } from "@/types";
import BlockActions from "@/components/shared/block-actions";
import BlockStats from "@/components/shared/block-stats";
import BlockSkeleton from "@/components/shared/block-skeleton";
import { blockStyles } from "@/components/shared/styles";

interface RCMDBlockProps {
  rcmdBlock: RCMDBlockType;
  isEditing?: boolean;
  onDelete?: () => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
}

export default function RCMDBlock({
  rcmdBlock,
  isEditing = false,
  onDelete,
  onSave,
}: RCMDBlockProps) {
  const supabase = createClient();
  const [rcmd, setRCMD] = useState<RCMD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRCMD, setEditedRCMD] = useState<RCMD | null>(null);

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

  if (isLoading) {
    return <BlockSkeleton hasImage={true} lines={3} />;
  }

  if (!rcmd || !editedRCMD) return null;

  return (
    <div className={`${blockStyles.container} ${blockStyles.card}`}>
      {rcmd.featured_image && (
        <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
          <Image
            src={rcmd.featured_image}
            alt={rcmd.title || 'Featured image'}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
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

        <BlockActions
          isEditing={isEditing}
          isEditMode={isEditMode}
          onEdit={() => setIsEditMode(true)}
          onDelete={onDelete}
          onSave={handleSave}
          onCancel={() => setIsEditMode(false)}
        />
      </div>

      {isEditMode ? (
        <>
          <textarea
            title="Edit description"
            value={editedRCMD.description || ''}
            onChange={(e) => setEditedRCMD({ ...editedRCMD, description: e.target.value })}
            className={`${blockStyles.inputField} mt-2`}
            rows={3}
          />
          <input
            title="Edit image URL"
            type="url"
            value={editedRCMD.featured_image || ''}
            onChange={(e) => setEditedRCMD({ ...editedRCMD, featured_image: e.target.value })}
            className={`${blockStyles.inputField} mt-2`}
            placeholder="Featured image URL"
          />
        </>
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
    </div>
  );
}