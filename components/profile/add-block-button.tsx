import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlusCircle } from 'lucide-react';
import TextBlockModal from './modals/text-block-modal';

interface Props {
	profileId: string;
	onBlockAdded?: () => void;
}

export default function AddBlockButton({ profileId, onBlockAdded }: Props) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const supabase = createClient();

	const handleSave = async (content: string, alignment: string) => {
		try {
			const { data: profileBlock, error: profileBlockError } = await supabase
				.from('profile_blocks')
				.insert({
					profile_id: profileId,
					type: 'text',
					order: 0,  // Default order to 0
				})
				.select()
				.single();

			if (profileBlockError) {
				throw profileBlockError;
			}

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

			setIsModalOpen(false);
			onBlockAdded?.();

		} catch (error) {
			console.error('Error saving blocks:', error);
			alert('Failed to save block');
		}
	};

	return (
		<>
			<button
				onClick={() => setIsModalOpen(true)}
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

			{isModalOpen && (
				<TextBlockModal
					onClose={() => setIsModalOpen(false)}
					onSave={handleSave}
				/>
			)}
		</>
	);
}