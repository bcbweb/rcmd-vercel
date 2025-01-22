"use client";

import { useState, useEffect } from 'react';
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { X } from 'lucide-react';
import { createClient } from "@/utils/supabase/client";

export function RenamePageModal({
  page,
  isOpen,
  onClose,
  onSuccess
}: {
  page: { id: string; name: string; } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && page) {
      setNewName(page.name);
    } else {
      setNewName("");
    }
  }, [isOpen, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || !newName.trim()) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("profile_pages")
        .update({ name: newName.trim() })
        .eq("id", page.id);

      if (error) throw error;

      toast.success("Page renamed successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to rename page");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Rename Page</h2>
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
              New Page Name
            </label>
            <input
              id="pageName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
                dark:border-gray-600 dark:text-gray-100 focus:outline-none 
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter new page name"
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
              disabled={isSaving || !newName.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors 
                flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}