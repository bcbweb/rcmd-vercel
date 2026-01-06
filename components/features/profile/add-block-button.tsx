"use client";

import { useState, useRef, useEffect } from "react";
import {
  PlusCircle,
  X,
  Type as TextIcon,
  Image as ImageIcon,
  Link2,
  List,
  Star,
  ArrowLeft,
  Play,
} from "lucide-react";
import { useModalStore } from "@/stores/modal-store";

export default function AddBlockButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const {
    setIsRCMDBlockModalOpen,
    setIsTextBlockModalOpen,
    setIsImageBlockModalOpen,
    setIsLinkBlockModalOpen,
    setIsCollectionBlockModalOpen,
    setIsVideoBlockModalOpen,
  } = useModalStore();

  const openBlockTypeSelector = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Handle clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  const handleRCMDSelection = () => {
    setIsModalOpen(false);
    setIsRCMDBlockModalOpen(true);
  };

  const handleTextSelection = () => {
    setIsModalOpen(false);
    setIsTextBlockModalOpen(true);
  };

  const handleImageSelection = () => {
    setIsModalOpen(false);
    setIsImageBlockModalOpen(true);
  };

  const handleLinkSelection = () => {
    setIsModalOpen(false);
    setIsLinkBlockModalOpen(true);
  };

  const handleCollectionSelection = () => {
    setIsModalOpen(false);
    setIsCollectionBlockModalOpen(true);
  };

  const handleVideoSelection = () => {
    setIsModalOpen(false);
    setIsVideoBlockModalOpen(true);
  };

  return (
    <>
      <button
        onClick={openBlockTypeSelector}
        className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 
          hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
      >
        <div
          className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 
          group-hover:text-gray-600 dark:group-hover:text-gray-300"
        >
          <PlusCircle className="w-5 h-5" aria-hidden="true" />
          <span>Add Block</span>
        </div>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4"
          >
            <div className="flex items-center mb-6">
              <button
                onClick={closeModal}
                className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 
									dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 
									rounded-full transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <h2 className="text-xl font-semibold flex-1">
                Select Block Type
              </h2>
              <button
                onClick={closeModal}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 
									dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 
									rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleRCMDSelection}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 
									dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg 
									hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 
									dark:hover:border-blue-700 transition-all"
              >
                <Star
                  className="w-8 h-8 mb-2 text-blue-500"
                  aria-hidden="true"
                />
                <span className="font-medium">RCMD</span>
              </button>
              <button
                onClick={handleCollectionSelection}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 
									dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg 
									hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 
									dark:hover:border-blue-700 transition-all"
              >
                <List
                  className="w-8 h-8 mb-2 text-blue-500"
                  aria-hidden="true"
                />
                <span className="font-medium">Collection</span>
              </button>
              <button
                onClick={handleTextSelection}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 
									dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg 
									hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 
									dark:hover:border-blue-700 transition-all"
              >
                <TextIcon
                  className="w-8 h-8 mb-2 text-blue-500"
                  aria-hidden="true"
                />
                <span className="font-medium">Text</span>
              </button>
              <button
                onClick={handleImageSelection}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 
									dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg 
									hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 
									dark:hover:border-blue-700 transition-all"
              >
                <ImageIcon
                  className="w-8 h-8 mb-2 text-blue-500"
                  aria-hidden="true"
                />
                <span className="font-medium">Image</span>
              </button>
              <button
                onClick={handleLinkSelection}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 
									dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg 
									hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 
									dark:hover:border-blue-700 transition-all"
              >
                <Link2
                  className="w-8 h-8 mb-2 text-blue-500"
                  aria-hidden="true"
                />
                <span className="font-medium">Link</span>
              </button>
              <button
                onClick={handleVideoSelection}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 
									dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg 
									hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 
									dark:hover:border-blue-700 transition-all"
              >
                <Play
                  className="w-8 h-8 mb-2 text-blue-500"
                  aria-hidden="true"
                />
                <span className="font-medium">Video</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
