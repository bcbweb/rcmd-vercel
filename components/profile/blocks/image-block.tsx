import Image from 'next/image';
import { useState } from 'react';
import { type ImageBlockType } from '@/types';
import BlockActions from '@/components/shared/block-actions';
import { blockStyles } from '@/components/shared/styles';
import ImageEditor from '@/components/shared/image-editor';
import type { ImageEditorResult } from '@/components/shared/image-editor';

interface Props {
	imageBlock: ImageBlockType;
	onDelete?: () => void;
	onSave?: (updatedBlock: Partial<ImageBlockType>) => void;
}

export default function ImageBlock({
	imageBlock,
	onDelete,
	onSave,
}: Props) {
	const [isEditMode, setIsEditMode] = useState(false);

	const handleSave = async (result: ImageEditorResult) => {
		onSave?.(result);
		setIsEditMode(false);
	};

	if (isEditMode) {
		return (
			<div className={blockStyles.container}>
				<ImageEditor
					currentImageUrl={imageBlock.image_url}
					currentCaption={imageBlock.caption || ''}
					currentWidth={imageBlock.width ?? undefined}
					currentHeight={imageBlock.height ?? undefined}
					onSave={handleSave}
					onCancel={() => setIsEditMode(false)}
				/>
			</div>
		);
	}

	return (
		<div className={blockStyles.container}>
			<div className="flex justify-end mb-2 gap-2">
				<BlockActions
					isEditMode={isEditMode}
					onEdit={() => setIsEditMode(true)}
					onDelete={onDelete}
					onCancel={() => setIsEditMode(false)}
				/>
			</div>

			<figure>
				<Image
					src={imageBlock.image_url}
					alt={imageBlock.caption || ""}
					className="w-full h-auto rounded"
					width={imageBlock.width || 200}
					height={imageBlock.height || 200}
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