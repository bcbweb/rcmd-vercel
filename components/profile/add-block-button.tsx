"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlusCircle } from 'lucide-react';
import TextBlockModal from './modals/text-block-modal';
import ImageBlockModal from './modals/image-block-modal';
import LinkBlockModal from './modals/link-block-modal';
import RCMDBlockModal from './modals/rcmd-block-modal';

interface Props {
	profileId: string;
	onBlockAdded?: () => void;
}

type BlockType = 'text' | 'image' | 'rcmd' | 'business' | 'custom' | 'link';

export default function AddBlockButton({ profileId, onBlockAdded }: Props) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedBlockType, setSelectedBlockType] = useState<BlockType | null>(null);
	const supabase = createClient();

	const handleTextBlockSave = async (content: string) => {
		try {
			const { error } = await supabase
				.rpc('insert_text_block', {
					p_profile_id: profileId,
					p_text: content
				});

			if (error) throw error;

			closeModal();
			onBlockAdded?.();

		} catch (error) {
			console.error('Error saving text block:', error);
			alert('Failed to save text block');
		}
	};

	const handleImageBlockSave = async (
		imageUrl: string,
		caption: string,
		originalFilename: string,
		sizeBytes: number,
		mimeType: string,
		width: number,
		height: number
	) => {
		try {
			const { error } = await supabase
				.rpc('insert_image_block', {
					p_profile_id: profileId,
					p_image_url: imageUrl,
					p_caption: caption,
					p_original_filename: originalFilename,
					p_size_bytes: sizeBytes,
					p_mime_type: mimeType,
					p_width: width,
					p_height: height
				});

			if (error) throw error;

			closeModal();
			onBlockAdded?.();

		} catch (error) {
			console.error('Error saving image block:', error);
			alert('Failed to save image block');
		}
	};

	const handleRcmdBlockSave = async (rcmdId: string) => {
		try {
			const { error } = await supabase
				.rpc('insert_rcmd_block', {
					p_profile_id: profileId,
					p_rcmd_id: rcmdId
				});

			if (error) throw error;

			closeModal();
			onBlockAdded?.();

		} catch (error) {
			console.error('Error saving recommendation block:', error);
			alert('Failed to save recommendation block');
		}
	};

	const handleLinkBlockSave = async (linkId: string) => {
		try {
			const { error } = await supabase
				.rpc('insert_link_block', {
					p_profile_id: profileId,
					p_link_id: linkId
				});

			if (error) throw error;

			closeModal();
			onBlockAdded?.();

		} catch (error) {
			console.error('Error saving link block:', error);
			alert('Failed to save link block');
		}
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setSelectedBlockType(null);
	};

	const openBlockTypeSelector = () => {
		setIsModalOpen(true);
	};

	return (
		<>
			<button
				onClick={openBlockTypeSelector}
				className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 
          rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 
          transition-colors group"
			>
				<div className="flex items-center justify-center gap-2 text-gray-500 
          dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
				>
					<PlusCircle className="w-5 h-5" />
					<span>Add Block</span>
				</div>
			</button>

			{isModalOpen && !selectedBlockType && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
						<h2 className="text-lg font-semibold mb-4">Select Block Type</h2>
						<div className="grid grid-cols-2 gap-4">
							<button
								onClick={() => setSelectedBlockType('text')}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Text Block
							</button>
							<button
								onClick={() => setSelectedBlockType('image')}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Image Block
							</button>
							<button
								onClick={() => setSelectedBlockType('link')}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Link Block
							</button>
							<button
								onClick={() => setSelectedBlockType('rcmd')}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Recommendation Block
							</button>
						</div>
						<button
							onClick={closeModal}
							className="mt-4 px-4 py-2 text-gray-500 hover:text-gray-700"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{isModalOpen && selectedBlockType === 'text' && (
				<TextBlockModal
					onClose={closeModal}
					onSave={handleTextBlockSave}
				/>
			)}

			{isModalOpen && selectedBlockType === 'image' && (
				<ImageBlockModal
					onClose={closeModal}
					onSave={handleImageBlockSave}
				/>
			)}

			{isModalOpen && selectedBlockType === 'link' && (
				<LinkBlockModal
					onClose={closeModal}
					onSave={handleLinkBlockSave}
				/>
			)}

			{isModalOpen && selectedBlockType === 'rcmd' && (
				<RCMDBlockModal
					onClose={closeModal}
					onSave={handleRcmdBlockSave}
				/>
			)}
		</>
	);
}