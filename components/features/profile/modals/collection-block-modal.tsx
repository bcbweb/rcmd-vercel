"use client";

import { Collection } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useBlockStore } from "@/stores/block-store";
import { useModalStore } from "@/stores/modal-store";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface CollectionBlockModalProps {
  profileId: string;
  pageId?: string;
  onSuccess?: () => void;
}

export default function CollectionBlockModal({
  profileId,
  pageId,
  onSuccess,
}: CollectionBlockModalProps) {
  const { saveCollectionBlock, isLoading: isSaving, error } = useBlockStore();
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    setIsCollectionBlockModalOpen,
    setIsCollectionModalOpen,
    setOnModalSuccess,
  } = useModalStore();

  const fetchCollections = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        console.error("No user found");
        return;
      }

      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleSave = async () => {
    if (!selectedCollectionId) return;

    try {
      const success = await saveCollectionBlock(
        profileId,
        selectedCollectionId,
        pageId
      );
      if (success) {
        onSuccess?.();
        setIsCollectionBlockModalOpen(false);
      } else {
        throw new Error(error || "Failed to save collection block");
      }
    } catch (error) {
      console.error("Error saving collection block:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save collection block"
      );
    }
  };

  const handleClose = () => {
    setIsCollectionBlockModalOpen(false);
  };

  const handleAddNewClick = () => {
    // Set up the callback to refresh collections after successful creation
    setOnModalSuccess(() => {
      fetchCollections();
    });

    // Open the collection creation modal
    setIsCollectionModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleClose}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 
              dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 
              rounded-full transition-colors"
            aria-label="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-left"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold flex-1 text-center">
            Select Collection
          </h2>
          <div className="w-8"></div> {/* Empty spacer for balance */}
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={handleAddNewClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg
              hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 
              disabled:cursor-not-allowed"
            disabled={isLoading || isSaving}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-plus-circle"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
            <span>New Collection</span>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No collections found. Please add some collections first.
            </div>
          ) : (
            collections.map((collection) => (
              <div
                key={collection.id}
                className={`p-4 border rounded-lg mb-2 cursor-pointer transition-colors
                  ${
                    selectedCollectionId === collection.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                  }`}
                onClick={() => setSelectedCollectionId(collection.id)}
              >
                <h3 className="font-medium">{collection.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {collection.description}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
              dark:hover:text-gray-200 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedCollectionId || isSaving || isLoading}
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
              "Add Collection Block"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
