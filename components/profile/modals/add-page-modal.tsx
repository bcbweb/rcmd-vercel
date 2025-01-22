"use client";

import { useState } from 'react';
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (pageName: string) => Promise<boolean>;
}

export default function AddPageModal({ isOpen, onClose, onAdd }: Props) {
  const [pageName, setPageName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pageName.trim()) return;

    try {
      setIsSaving(true);
      const success = await onAdd(pageName.trim());

      if (success) {
        setPageName('');
        onClose();
      } else {
        toast.error('Failed to create page');
      }
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Failed to create page');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Page</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
              dark:hover:text-gray-200 transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="pageName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Page Name
            </label>
            <input
              id="pageName"
              type="text"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
                dark:border-gray-600 dark:text-gray-100 focus:outline-none 
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter page name"
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !pageName.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors 
                flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create Page'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}