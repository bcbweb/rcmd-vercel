"use client";

import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import BlockRenderer from "./block-renderer";
import type { ProfileBlockType } from '@/types';

interface Props {
	block: ProfileBlockType;
	index: number;
	onMove?: (dragIndex: number, hoverIndex: number) => void;
	onDelete?: (id: string) => void;
}

export default function DraggableBlock({
	block,
	index,
	onMove,
	onDelete,
}: Props) {
	const ref = useRef<HTMLDivElement>(null);

	const [{ isDragging }, drag] = useDrag({
		type: "BLOCK",
		item: { index },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
		canDrag: () => true,
	});

	const [{ isOver }, drop] = useDrop({
		accept: "BLOCK",
		hover: (item: { index: number; }) => {
			if (item.index === index) return;
			onMove?.(item.index, index);
			item.index = index;
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
		}),
		canDrop: () => true,
	});

	// Combine the refs
	drag(drop(ref));

	return (
		<div
			ref={ref}
			style={{ opacity: isDragging ? 0.5 : 1 }}
			className={`relative ${isOver ? "border-2 border-blue-500" : ""}`}
		>
			<BlockRenderer
				block={block}
				onDelete={onDelete ? () => onDelete(block.id) : undefined}
			/>
		</div>
	);
}
