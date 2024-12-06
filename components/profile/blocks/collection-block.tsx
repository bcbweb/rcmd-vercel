"use client";

import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import type { CollectionBlockType } from '@/types';
import BlockActions from '@/components/shared/block-actions';
import { blockStyles } from '@/components/shared/styles';
import BlockSkeleton from '@/components/shared/block-skeleton';

interface Collection {
  created_at: string | null;
  description: string | null;
  id: string;
  name: string;
  owner_id: string | null;
  updated_at: string | null;
  visibility: 'public' | 'private' | 'followers' | null;
}

interface CollectionBlockProps {
  collection: CollectionBlockType;
  onDelete?: () => void;
  onUpdate?: (block: Partial<CollectionBlockType>) => void;
}

export default function CollectionBlock({
  collection,
  onDelete,
  onUpdate,
}: CollectionBlockProps) {
  const supabase = createClient();
  const [collectionData, setCollectionData] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCollection, setEditedCollection] = useState<Collection | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('id', collection.collection_id)
          .single();

        if (error) throw error;
        setCollectionData(data);
        setEditedCollection(data);
      } catch (err) {
        console.error('Error fetching collection:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollection();
  }, [collection.collection_id, supabase]);

  const handleSave = async () => {
    if (!editedCollection) return;

    try {
      const { error } = await supabase
        .from('collections')
        .update({
          name: editedCollection.name,
          description: editedCollection.description,
          visibility: editedCollection.visibility,
          updated_at: new Date().toISOString()
        })
        .eq('id', collection.collection_id);

      if (error) throw error;

      setCollectionData(editedCollection);
      setIsEditMode(false);
      onUpdate?.(collection);
    } catch (err) {
      console.error('Error updating collection:', err);
    }
  };

  if (isLoading) {
    return <BlockSkeleton lines={2} className="p-2" />;
  }

  if (!collectionData || !editedCollection) return null;

  return (
    <div className={blockStyles.container}>
      <div className="flex items-start justify-between gap-2">
        {isEditMode ? (
          <input
            title="Edit name"
            type="text"
            value={editedCollection.name}
            onChange={(e) => setEditedCollection({ ...editedCollection, name: e.target.value })}
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
          value={editedCollection.description || ''}
          onChange={(e) => setEditedCollection({ ...editedCollection, description: e.target.value })}
          className={`${blockStyles.inputField} mt-2`}
          rows={2}
        />
      ) : (
        collectionData.description && (
          <p className={blockStyles.description}>{collectionData.description}</p>
        )
      )}

      <div className="flex items-center gap-2 mt-2">
        {isEditMode ? (
          <select
            value={editedCollection.visibility || 'public'}
            onChange={(e) => setEditedCollection({
              ...editedCollection,
              visibility: e.target.value as Collection['visibility']
            })}
            className={blockStyles.inputField}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="followers">Followers</option>
          </select>
        ) : (
          <div className="flex items-center gap-2">
            <span className={blockStyles.tag}>
              {collectionData.visibility || 'public'}
            </span>
            {collectionData.created_at && (
              <span className={blockStyles.metaText}>
                {formatDistanceToNow(new Date(collectionData.created_at), { addSuffix: true })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}