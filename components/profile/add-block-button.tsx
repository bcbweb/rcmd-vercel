"use client";

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useModalStore } from '@/stores/modal-store';

export default function AddBlockButton() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const {
		setIsRCMDBlockModalOpen,
		setIsTextBlockModalOpen,
		setIsImageBlockModalOpen,
		setIsLinkBlockModalOpen
	} = useModalStore();

	const openBlockTypeSelector = () => {
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
	};

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

	return (
		<>
			<button
				onClick={openBlockTypeSelector}
				className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 
          hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
			>
				<div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 
          group-hover:text-gray-600 dark:group-hover:text-gray-300"
				>
					<PlusCircle className="w-5 h-5" />
					<span>Add Block</span>
				</div>
			</button>

			{isModalOpen && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
						<h2 className="text-lg font-semibold mb-4">Select Block Type</h2>
						<div className="grid grid-cols-2 gap-4">
							<button
								onClick={handleRCMDSelection}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								RCMD
							</button>
							<button
								onClick={handleTextSelection}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Text
							</button>
							<button
								onClick={handleImageSelection}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Image
							</button>
							<button
								onClick={handleLinkSelection}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Link
							</button>
						</div>
						<div className="mt-4 flex justify-end gap-2">
							<button
								onClick={closeModal}
								className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                  dark:hover:text-gray-200 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}