"use client";

import { MoreVertical, ExternalLink, Trash2, Pencil, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { useState, useRef, useEffect } from 'react';
import type { LinkBlockType, Link } from '@/types';

interface LinkBlockProps {
  linkBlock: LinkBlockType;
  isEditing?: boolean;
  onDelete?: () => void;
  onSave?: (block: Partial<LinkBlockType>) => void;
}

export default function LinkBlock({ linkBlock, isEditing, onDelete, onSave }: LinkBlockProps) {
  const supabase = createClient();
  const [showDropdown, setShowDropdown] = useState(false);
  const [link, setLink] = useState<Link | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedLink, setEditedLink] = useState<Link | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const { data, error } = await supabase
          .from('links')
          .select('*')
          .eq('id', linkBlock.link_id)
          .single();

        if (error) throw error;
        setLink(data);
        setEditedLink(data);
      } catch (err) {
        console.error('Error fetching link:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLink();
  }, [linkBlock.link_id, supabase]);

  const handleLinkClick = async () => {
    if (!link) return;

    try {
      await supabase.rpc('increment_link_click_count', { link_id: link.id });
      setLink(prev => prev ? { ...prev, click_count: (prev.click_count || 0) + 1 } : null);
    } catch (error) {
      console.error('Error incrementing click count:', error);
    }
  };

  const handleSave = async () => {
    if (!editedLink) return;

    try {
      const { error } = await supabase
        .from('links')
        .update(editedLink)
        .eq('id', linkBlock.link_id);

      if (error) throw error;

      setLink(editedLink);
      setIsEditMode(false);
      onSave?.(linkBlock);
    } catch (err) {
      console.error('Error updating link:', err);
    }
  };

  const handleCancel = () => {
    setEditedLink(link);
    setIsEditMode(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
        <div className="p-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!link || !editedLink) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md 
      transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <input
                  type="text"
                  value={editedLink.title}
                  onChange={(e) => setEditedLink({ ...editedLink, title: e.target.value })}
                  className="font-semibold text-lg border rounded px-2 py-1 w-full"
                />
              ) : (
                <h3 className="font-semibold text-lg">{link.title}</h3>
              )}
              {!isEditMode && (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
                    dark:hover:text-gray-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {isEditMode ? (
              <>
                <input
                  type="url"
                  value={editedLink.url}
                  onChange={(e) => setEditedLink({ ...editedLink, url: e.target.value })}
                  className="w-full text-sm border rounded px-2 py-1 mt-2"
                />
                <textarea
                  value={editedLink.description || ''}
                  onChange={(e) => setEditedLink({ ...editedLink, description: e.target.value })}
                  className="w-full text-sm text-gray-600 dark:text-gray-300 mt-2 border rounded px-2 py-1"
                  rows={2}
                />
              </>
            ) : (
              link.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                  {link.description}
                </p>
              )
            )}

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 
              dark:text-gray-400">
              {isEditMode ? (
                <select
                  value={editedLink.visibility}
                  onChange={(e) => setEditedLink({ ...editedLink, visibility: e.target.value })}
                  className="border rounded px-2 py-1"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="followers">Followers</option>
                </select>
              ) : (
                <>
                  <span className="capitalize">{link.type}</span>
                  <span>•</span>
                  <span className="capitalize">{link.visibility}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(linkBlock.created_at), { addSuffix: true })}</span>
                </>
              )}
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            {isEditMode ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="p-1 text-green-500 hover:text-green-700"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  title="More"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                    dark:hover:text-gray-300"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 
                    rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    {isEditing && (
                      <button
                        onClick={() => {
                          setIsEditMode(true);
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-blue-600 
                          hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={onDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 
                          hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 
          dark:text-gray-400">
          <span>{link.view_count} views</span>
          <span>•</span>
          <span>{link.click_count} clicks</span>
          <span>•</span>
          <span>{link.share_count} shares</span>
          <span>•</span>
          <span>{link.save_count} saves</span>
        </div>
      </div>
    </div>
  );
}