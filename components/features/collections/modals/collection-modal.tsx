"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useModalStore } from "@/stores/modal-store";
import { useCollectionStore } from "@/stores/collection-store";
import { useRCMDStore } from "@/stores/rcmd-store";
import { Search } from "lucide-react";
import type { RCMDVisibility } from "@/types";
import RCMDPicker from "../rcmd-picker";

export default function CollectionModal() {
  const {
    isCollectionModalOpen,
    setIsCollectionModalOpen,
    onModalSuccess,
    isCollectionEditMode,
    collectionToEdit,
  } = useModalStore();

  const { insertCollection, updateCollection, isLoading } =
    useCollectionStore();
  const { rcmds, fetchRCMDs } = useRCMDStore();

  // Collection metadata
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<RCMDVisibility>("private");

  // Search and selection states
  const [searchQuery, setSearchQuery] = useState("");
  const [rcmdIds, setRcmdIds] = useState<string[]>([]);

  // Add modal ref for focus handling
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch RCMDs on mount
  useEffect(() => {
    fetchRCMDs();
  }, [fetchRCMDs]);

  // Filter RCMDs based on search query
  const filteredRCMDs = rcmds.filter(
    (rcmd) =>
      rcmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rcmd.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      )
  );

  // Handle RCMD selection
  const handleRCMDSelect = (id: string) => {
    setRcmdIds((prev) =>
      prev.includes(id) ? prev.filter((rcmdId) => rcmdId !== id) : [...prev, id]
    );
  };

  // Form validation
  const isFormValid = name.trim() !== "" && rcmdIds.length > 0;

  // Reset form function
  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setVisibility("private");
    setRcmdIds([]);
    setSearchQuery("");
  }, []);

  // Handle form close
  const handleClose = useCallback(() => {
    // Ensure we reset before closing
    resetForm();

    // Small delay to prevent any race conditions
    setTimeout(() => {
      setIsCollectionModalOpen(false);
    }, 10);
  }, [resetForm, setIsCollectionModalOpen]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔍 CollectionModal: handleSubmit called");
    console.log(
      "🔍 CollectionModal: isLoading:",
      isLoading,
      "isFormValid:",
      isFormValid
    );
    if (isLoading || !isFormValid) return;

    try {
      let result;
      if (isCollectionEditMode && collectionToEdit) {
        console.log(
          "🔍 CollectionModal: Updating existing collection",
          collectionToEdit.id
        );
        // Update existing collection
        await updateCollection(collectionToEdit.id, {
          name,
          description,
          visibility,
        });
        console.log("🔍 CollectionModal: Collection updated successfully");
        result = true;
      } else {
        // Create new collection
        console.log("🔍 CollectionModal: Creating new collection");
        result = await insertCollection({
          name,
          description,
          visibility,
          rcmdIds,
          linkIds: [], // No links in this version
        });
        console.log(
          "🔍 CollectionModal: Collection created successfully",
          result
        );
      }

      if (result) {
        console.log(
          "🔍 CollectionModal: About to call onModalSuccess callback"
        );
        console.log(
          "🔍 CollectionModal: onModalSuccess exists:",
          !!onModalSuccess
        );

        // Create a safe object to pass back to the callback
        const safeUpdatedCollection = {
          name: name,
          description: description,
          visibility: visibility,
          // Create collection items from rcmdIds
          collection_items: Array.isArray(rcmdIds)
            ? rcmdIds.map((id) => ({
                id: crypto.randomUUID(), // Generate a temporary ID
                collection_id: collectionToEdit?.id || "",
                item_type: "rcmd",
                rcmd_id: id,
                created_at: new Date().toISOString(),
              }))
            : collectionToEdit?.collection_items || [],
        };

        // First close the modal to prevent UI jank
        resetForm();
        setIsCollectionModalOpen(false);

        // Then call the callback after a short delay
        // This prevents UI updates from competing with each other
        setTimeout(() => {
          // Only call onModalSuccess if it exists and pass it the safe object
          if (typeof onModalSuccess === "function") {
            console.log(
              "🔍 CollectionModal: Calling onModalSuccess with:",
              safeUpdatedCollection
            );
            onModalSuccess(safeUpdatedCollection);
            console.log(
              "🔍 CollectionModal: Called onModalSuccess callback successfully"
            );
          }
        }, 50);
      }
    } catch (error) {
      console.error(
        `Error ${isCollectionEditMode ? "updating" : "creating"} collection:`,
        error
      );
    }
  };

  // Populate form with existing collection data when in edit mode
  useEffect(() => {
    if (isCollectionEditMode && collectionToEdit) {
      setName(collectionToEdit.name || "");
      setDescription(collectionToEdit.description || "");
      setVisibility(collectionToEdit.visibility || "private");

      // If collection has items, populate the rcmdIds
      if (collectionToEdit.collection_items) {
        const ids = collectionToEdit.collection_items
          .filter((item: any) => {
            // Ensure item exists before checking properties
            return item && (item.rcmd_id || item.rcmd);
          })
          .map((item: any) => {
            if (!item) return undefined;
            // Handle potential null/undefined values
            const rcmdObj = item.rcmd || {};
            const rcmdIdObj = item.rcmd_id || {};
            return rcmdObj.id || (rcmdIdObj && rcmdIdObj.id);
          })
          .filter(
            (id: unknown): id is string =>
              id !== undefined && typeof id === "string"
          );
        setRcmdIds(ids);
      }
    } else {
      // Reset form when opening in create mode
      resetForm();
    }
  }, [
    isCollectionEditMode,
    collectionToEdit,
    isCollectionModalOpen,
    resetForm,
  ]);

  // Add effect to prevent background scrolling when modal is open
  useEffect(() => {
    if (isCollectionModalOpen) {
      // Save the current overflow value to restore later
      const originalOverflow = document.body.style.overflow;
      // Prevent background scrolling
      document.body.style.overflow = "hidden";

      // Cleanup function to restore scrolling when modal closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isCollectionModalOpen]);

  // Add keyboard event handling
  useEffect(() => {
    if (!isCollectionModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on ESC key
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCollectionModalOpen, handleClose]);

  if (!isCollectionModalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-modal-heading"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="collection-modal-heading"
          className="text-lg font-semibold p-6 pb-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] z-10"
        >
          {isCollectionEditMode ? "Edit Collection" : "New Collection"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div
            className="overflow-y-auto px-6 flex-grow"
            style={{ maxHeight: "calc(90vh - 150px)" }}
          >
            {/* Collection Metadata Section */}
            <div className="space-y-4 pb-6 pt-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  required
                  minLength={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as RCMDVisibility)
                  }
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>

              {/* RCMD Selection Section */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Add RCMDs <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search RCMDs..."
                    className="w-full p-2 pl-10 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <RCMDPicker
                  rcmds={filteredRCMDs}
                  selectedIds={rcmdIds}
                  onSelect={handleRCMDSelect}
                />
              </div>
            </div>
          </div>

          <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto bg-white dark:bg-gray-800 sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-10">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Saving..."
                  : isCollectionEditMode
                    ? "Update"
                    : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
