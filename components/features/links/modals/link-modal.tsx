"use client";

import { useState } from 'react';
import { useModalStore } from '@/stores/modal-store';
import { useLinkStore } from '@/stores/link-store';
import { Spinner } from '@/components/ui/spinner';
import LinkInput from '@/components/ui/link-input';
import { LinkMetadata } from '@/types';

export default function LinkModal() {
  const {
    isLinkModalOpen,
    setIsLinkModalOpen,
    onModalSuccess
  } = useModalStore();
  const { insertLink, isLoading } = useLinkStore();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('other');
  const [visibility, setVisibility] = useState('private');

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setType('other');
    setVisibility('private');
  };

  const handleClose = () => {
    setIsLinkModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const link = await insertLink(
      title,
      url,
      description,
      type,
      visibility
    );

    if (link) {
      onModalSuccess?.();
      resetForm();
      handleClose();
    }
  };

  const sanitizeText = (text: string | undefined, maxLength: number): string => {
    if (!text) return '';

    // Remove HTML tags and decode HTML entities
    const div = document.createElement('div');
    div.innerHTML = text;
    const sanitized = div.textContent || div.innerText || '';

    // Remove control characters and trim whitespace
    return sanitized
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim()
      .slice(0, maxLength);
  };

  const handleMetadataFetch = (metadata: LinkMetadata) => {
    if (metadata.title && !title) {
      setTitle(sanitizeText(metadata.title, 100));
    }
    if (metadata.description && !description) {
      setDescription(sanitizeText(metadata.description, 500));
    }
    if (metadata.type) {
      const detectedType = metadata.type.toLowerCase();
      if (['article', 'video', 'podcast', 'product'].includes(detectedType)) {
        setType(detectedType);
      }
    }
  };

  if (!isLinkModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">New Link</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                URL
              </label>
              <LinkInput
                value={url}
                onChange={setUrl}
                onMetadataFetch={handleMetadataFetch}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="other">Other</option>
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="podcast">Podcast</option>
                <option value="product">Product</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}