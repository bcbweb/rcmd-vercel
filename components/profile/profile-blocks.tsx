import type { Database } from "@/types/supabase";
import DraggableBlock from "./draggable-block";

type ProfileBlock = Database["public"]["Tables"]["profile_blocks"]["Row"];

interface Props {
	blocks: ProfileBlock[];
	isEditing: boolean;
	onMove?: (dragIndex: number, hoverIndex: number) => void;
	onDelete?: (id: string) => void;
}

export default function ProfileBlocks({
	blocks,
	isEditing,
	onMove,
	onDelete,
}: Props) {
	console.log(blocks.map(block => block.id));
	return (
		<div className="space-y-4">
			{blocks.map((block, index) => (
				<DraggableBlock
					key={block.id}
					block={block}
					index={index}
					isEditing={isEditing}
					onMove={onMove}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
