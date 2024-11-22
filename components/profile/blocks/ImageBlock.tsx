import { Trash2, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface Props {
	data: {
		url: string;
		caption?: string;
	};
	isEditing?: boolean;
	onDelete?: () => void;
	onEdit?: (data: { url: string; caption?: string; }) => void;
}

export default function ImageBlock({
	data,
	isEditing,
	onDelete,
	onEdit,
}: Props) {
	const [isEditMode, setIsEditMode] = useState(false); // renamed from isEditing
	const [url, setUrl] = useState(data.url);
	const [caption, setCaption] = useState(data.caption || '');

	const handleSave = () => {
		onEdit?.({ url, caption });
		setIsEditMode(false);
	};

	if (isEditMode) {
		return (
			<div className="bg-white rounded-lg shadow p-4">
				<div className="space-y-4">
					<input
						type="text"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						className="w-full p-2 border rounded"
						placeholder="Image URL"
					/>
					<input
						type="text"
						value={caption}
						onChange={(e) => setCaption(e.target.value)}
						className="w-full p-2 border rounded"
						placeholder="Caption (optional)"
					/>
					<div className="flex justify-end gap-2">
						<button
							onClick={() => setIsEditMode(false)}
							className="px-3 py-1 text-gray-600 hover:text-gray-800"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Save
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow p-4">
			{isEditing && (
				<div className="flex justify-end mb-2 gap-2">
					<button
						onClick={() => setIsEditMode(true)}
						className="text-gray-500 hover:text-gray-700"
					>
						<Pencil className="w-5 h-5" />
					</button>
					<button
						onClick={onDelete}
						className="text-red-500 hover:text-red-700"
					>
						<Trash2 className="w-5 h-5" />
					</button>
				</div>
			)}

			<figure>
				<Image
					src={data.url}
					alt={data.caption || ""}
					className="w-full h-auto rounded"
				/>
				{data.caption && (
					<figcaption className="mt-2 text-center text-gray-600">
						{data.caption}
					</figcaption>
				)}
			</figure>
		</div>
	);
}