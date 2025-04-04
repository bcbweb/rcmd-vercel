import type { ProfileBlockType } from "@/types";
import DraggableBlock from "./draggable-block";


interface Props {
	blocks: ProfileBlockType[];
	onMove?: (dragIndex: number, hoverIndex: number) => void;
	onDelete?: (id: string) => void;
}

export default function ProfileBlocks({
	blocks,
	onMove,
	onDelete,
}: Props) {
	return (
		<div className="space-y-4">
			{blocks.length === 0 && (
				<div className="text-center py-12 text-gray-500 dark:text-gray-400">
					No blocks found
				</div>
			)}
			{blocks.map((block, index) => (
				<DraggableBlock
					key={block.id}
					block={block}
					index={index}
					onMove={onMove}
					onDelete={() => onDelete?.(block.id)}
				/>
			))}
		</div>
	);
}