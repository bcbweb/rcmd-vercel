import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface BlockData {
	id: string;  // Add id to the interface
	type: 'text' | 'image' | 'rcmd' | 'business';
}

interface Props {
	onAdd: (blockData: BlockData) => void;
}

export default function AddBlockButton({ onAdd }: Props) {
	const [isOpen, setIsOpen] = useState(false);

	const blockTypes = [
		{ id: "text", label: "Text Block" },
		{ id: "image", label: "Image Block" },
		{ id: "rcmd", label: "RCMD" },
		{ id: "business", label: "Business" },
	];

	// Generate a temporary ID for new blocks
	const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
			>
				<PlusIcon className="w-5 h-5" />
				Add Block
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
					{blockTypes.map((type) => (
						<button
							key={type.id}
							onClick={() => {
								onAdd({
									id: generateTempId(),
									type: type.id as BlockData['type']
								});
								setIsOpen(false);
							}}
							className="w-full px-4 py-2 text-left hover:bg-gray-100"
						>
							{type.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}