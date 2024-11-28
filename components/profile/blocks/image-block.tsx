import Image from 'next/image';
import { useState } from 'react';
import { type ImageBlockType } from '@/types';
import BlockActions from '@/components/shared/block-actions';
import { blockStyles } from '@/components/shared/styles';

interface Props {
	imageBlock: ImageBlockType;
	isEditing?: boolean;
	onDelete?: () => void;
	onSave?: (updatedBlock: Partial<ImageBlockType>) => void;
}

export default function ImageBlock({
	imageBlock,
	isEditing,
	onDelete,
	onSave,
}: Props) {
	const [isEditMode, setIsEditMode] = useState(false);
	const [imageUrl, setImageUrl] = useState(imageBlock.image_url);
	const [caption, setCaption] = useState(imageBlock.caption || '');

	const handleSave = () => {
		onSave?.({
			image_url: imageUrl,
			caption: caption || null
		});
		setIsEditMode(false);
	};

	if (isEditMode) {
		return (
			<div className={blockStyles.container}>
				<div className="space-y-4">
					<input
						type="text"
						value={imageUrl}
						onChange={(e) => setImageUrl(e.target.value)}
						className="w-full p-2 border rounded bg-white dark:bg-gray-700 
                                 text-gray-900 dark:text-gray-100 
                                 border-gray-300 dark:border-gray-600"
						placeholder="Image URL"
					/>
					<input
						type="text"
						value={caption}
						onChange={(e) => setCaption(e.target.value)}
						className="w-full p-2 border rounded bg-white dark:bg-gray-700 
                                 text-gray-900 dark:text-gray-100 
                                 border-gray-300 dark:border-gray-600"
						placeholder="Caption (optional)"
					/>
					<div className="flex justify-end gap-2">
						<button
							onClick={() => setIsEditMode(false)}
							className="px-3 py-1 text-gray-600 dark:text-gray-300 
                                     hover:text-gray-800 dark:hover:text-gray-100"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="px-3 py-1 bg-blue-500 text-white rounded 
                                     hover:bg-blue-600 dark:hover:bg-blue-400"
						>
							Save
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={blockStyles.container}>
			<div className="flex justify-end mb-2 gap-2">
				<BlockActions
					isEditing={isEditing}
					isEditMode={isEditMode}
					onEdit={() => setIsEditMode(true)}
					onDelete={onDelete}
					onSave={handleSave}
					onCancel={() => setIsEditMode(false)}
				/>
			</div>

			<figure>
				<Image
					src={imageBlock.image_url}
					alt={imageBlock.caption || ""}
					className="w-full h-auto rounded"
					width="200"
					height="200"
				/>
				{imageBlock.caption && (
					<figcaption className="mt-2 text-center text-gray-600 dark:text-gray-300">
						{imageBlock.caption}
					</figcaption>
				)}
			</figure>
		</div>
	);
}