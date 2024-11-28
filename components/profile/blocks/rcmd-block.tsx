"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import type { RCMDBlockType, RCMD, RCMDVisibility } from "@/types";
import BlockActions from "@/components/shared/block-actions";
import BlockStats from "@/components/shared/block-stats";
import BlockSkeleton from "@/components/shared/block-skeleton";
import { blockStyles } from "@/components/shared/styles";

interface RcmdBlockProps {
  rcmdBlock: RCMDBlockType;
  isEditing?: boolean;
  onDelete?: () => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
}

export default function RcmdBlock({
  rcmdBlock,
  isEditing = false,
  onDelete,
  onSave,
}: RcmdBlockProps) {
  const supabase = createClient();
  const [rcmd, setRcmd] = useState<RCMD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRcmd, setEditedRcmd] = useState<RCMD | null>(null);

  useEffect(() => {
    const fetchRcmd = async () => {
      try {
        const { data, error } = await supabase
          .from('rcmds')
          .select('*')
          .eq('id', rcmdBlock.rcmd_id)
          .single();

        if (error) throw error;
        setRcmd(data);
        setEditedRcmd(data);
      } catch (err) {
        console.error('Error fetching rcmd:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRcmd();
  }, [rcmdBlock.rcmd_id, supabase]);

  const handleSave = async () => {
    if (!editedRcmd) return;

    try {
      const { error } = await supabase
        .from('rcmds')
        .update(editedRcmd)
        .eq('id', rcmdBlock.rcmd_id);

      if (error) throw error;

      setRcmd(editedRcmd);
      setIsEditMode(false);
      onSave?.(rcmdBlock);
    } catch (err) {
      console.error('Error updating rcmd:', err);
    }
  };

  if (isLoading) {
    return <BlockSkeleton hasImage={true} lines={3} />;
  }

  if (!rcmd || !editedRcmd) return null;

  return (
    <div className={blockStyles.container}>
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
            value={editedRcmd.title}
            onChange={(e) => setEditedRcmd({ ...editedRcmd, title: e.target.value })}
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
            value={editedRcmd.description || ''}
            onChange={(e) => setEditedRcmd({ ...editedRcmd, description: e.target.value })}
            className={`${blockStyles.inputField} mt-2`}
            rows={3}
          />
          <input
            title="Edit image URL"
            type="url"
            value={editedRcmd.featured_image || ''}
            onChange={(e) => setEditedRcmd({ ...editedRcmd, featured_image: e.target.value })}
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
            value={editedRcmd.visibility as RCMDVisibility}
            onChange={(e) => setEditedRcmd({ ...editedRcmd, visibility: e.target.value as RCMDVisibility })}
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