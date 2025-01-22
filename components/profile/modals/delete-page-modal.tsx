"use client";

import { useState } from 'react';
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { X } from 'lucide-react';
import { createClient } from "@/utils/supabase/client";

export function DeletePageModal({
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
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("profile_pages")
        .delete()
        .eq("id", page.id);

      if (error) throw error;

      toast.success("Page deleted successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete page");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Delete Page</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
              dark:hover:text-gray-200 transition-colors"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the page "{page?.name}"? This action cannot be undone.
            </p>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-200 transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors 
                flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Deleting...</span>
                </>
              ) : (
                'Delete Page'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}