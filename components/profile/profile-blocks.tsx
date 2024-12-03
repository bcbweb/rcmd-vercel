import type { Database } from "@/types/supabase";
import DraggableBlock from "./draggable-block";

type ProfileBlock = Database["public"]["Tables"]["profile_blocks"]["Row"];

interface Props {
	blocks: ProfileBlock[];
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
