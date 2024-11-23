import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlusCircle } from 'lucide-react';
import TextBlockModal from './modals/text-block-modal';
import ImageBlockModal from './modals/image-block-modal';

interface Props {
	profileId: string;
	onBlockAdded?: () => void;
}

type BlockType = 'text' | 'image';

export default function AddBlockButton({ profileId, onBlockAdded }: Props) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedBlockType, setSelectedBlockType] = useState<BlockType | null>(null);
	const supabase = createClient();

	const handleTextBlockSave = async (content: string, alignment: string) => {
		try {
			const { data: profileBlock, error: profileBlockError } = await supabase
				.from('profile_blocks')
				.insert({
					profile_id: profileId,
					type: 'text',
					order: 0,
				})
				.select()
				.single();

			if (profileBlockError) throw profileBlockError;

			const { error: textBlockError } = await supabase
				.from('text_blocks')
				.insert({
					text: content,
					alignment: alignment,
					profile_block_id: profileBlock.id,
				});

			if (textBlockError) {
				await supabase
					.from('profile_blocks')
					.delete()
					.eq('id', profileBlock.id);
				throw textBlockError;
			}

			closeModal();
			onBlockAdded?.();

		} catch (error) {
			console.error('Error saving text block:', error);
			alert('Failed to save text block');
		}
	};

	const handleImageBlockSave = async (imageUrl: string, caption: string) => {
		try {
			const { data: profileBlock, error: profileBlockError } = await supabase
				.from('profile_blocks')
				.insert({
					profile_id: profileId,
					type: 'image',
					order: 0,
				})
				.select()
				.single();

			if (profileBlockError) throw profileBlockError;

			const { error: imageBlockError } = await supabase
				.from('image_blocks')
				.insert({
					url: imageUrl,
					caption: caption,
					profile_block_id: profileBlock.id,
				});

			if (imageBlockError) {
				await supabase
					.from('profile_blocks')
					.delete()
					.eq('id', profileBlock.id);
				throw imageBlockError;
			}

			closeModal();
			onBlockAdded?.();

		} catch (error) {
			console.error('Error saving image block:', error);
			alert('Failed to save image block');
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
						<div className="flex gap-4">
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
		</>
	);
}