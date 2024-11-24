"use client";

import { MoreVertical, ExternalLink, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { useState, useRef, useEffect } from 'react';
import type { Link } from '@/types';

interface LinkBlockProps {
  link: Link;
  onDelete?: (id: string) => Promise<void>;
}

export default function LinkBlock({ link, onDelete }: LinkBlockProps) {
  const supabase = createClient();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLinkClick = async () => {
    try {
      await supabase.rpc('increment_link_click_count', { link_id: link.id });
    } catch (error) {
      console.error('Error incrementing click count:', error);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (window.confirm('Are you sure you want to delete this link?')) {
      try {
        await onDelete(link.id);
        setShowDropdown(false);
      } catch (error) {
        console.error('Error deleting link:', error);
      }
    }
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md 
      transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{link.title}</h3>
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
            </div>

            {link.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                {link.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 
              dark:text-gray-400">
              <span className="capitalize">{link.type}</span>
              <span>•</span>
              <span className="capitalize">{link.visibility}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
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
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 
                      hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
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