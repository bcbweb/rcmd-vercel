"use client";

import { Pencil, Trash2, Globe, Lock, Users, Check, X } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import { type RCMDBlockType, type RCMD } from "@/types";

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

  const handleCancel = () => {
    setEditedRcmd(rcmd);
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="relative rounded-lg border p-4 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
        <div className="flex items-start justify-between gap-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mt-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-4"></div>
      </div>
    );
  }

  if (!rcmd || !editedRcmd) return null;

  const visibilityIcon = {
    public: <Globe className="w-4 h-4" />,
    private: <Lock className="w-4 h-4" />,
    followers: <Users className="w-4 h-4" />,
  }[rcmd.visibility || 'public'];

  return (
    <div className="relative group rounded-lg border p-4">
      {rcmd.featured_image && (
        <div className="relative w-full h-48 mb-4">
          <Image
            src={rcmd.featured_image}
            alt={rcmd.title}
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
            className="flex-1 font-medium border rounded px-2 py-1"
          />
        ) : (
          <h3 className="font-medium">{rcmd.title}</h3>
        )}
        <div className="flex items-center gap-2">
          {visibilityIcon}
          {isEditing && !isEditMode && (
            <>
              <button
                type="button"
                title="Edit"
                onClick={() => setIsEditMode(true)}
                className="p-1 hover:text-primary"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={onDelete}
                className="p-1 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {isEditMode && (
            <>
              <button
                type="button"
                title="Save"
                onClick={handleSave}
                className="p-1 hover:text-primary"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Cancel"
                onClick={handleCancel}
                className="p-1 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditMode ? (
        <textarea
          title="Edit description"
          value={editedRcmd.description || ''}
          onChange={(e) => setEditedRcmd({ ...editedRcmd, description: e.target.value })}
          className="w-full text-sm text-muted-foreground mt-2 border rounded px-2 py-1"
          rows={2}
        />
      ) : (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {rcmd.description}
        </p>
      )}

      {rcmd.tags && rcmd.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {rcmd.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-muted rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
        <span>{rcmd.view_count} views</span>
        <span>{rcmd.like_count} likes</span>
        <span>{rcmd.save_count} saves</span>
      </div>
    </div>
  );
}