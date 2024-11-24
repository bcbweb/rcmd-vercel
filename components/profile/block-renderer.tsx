"use client";

import { useSupabase } from "@/components/providers/supabase-provider";
import { type ProfileBlockType, type TextBlockType } from "@/types";
import { useEffect, useState } from "react";
import TextBlock from "./blocks/TextBlock";

interface Props {
	block: ProfileBlockType;
	isEditing: boolean;
	onDelete?: () => void;
	onSave?: (updatedBlock: ProfileBlockType) => void;
}

export default function BlockRenderer({
	block,
	isEditing,
	onDelete,
	onSave,
}: Props) {
	const { supabase } = useSupabase();
	const [textBlock, setTextBlock] = useState<TextBlockType | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchBlockData = async () => {
			if (block.type !== "text") {
				setIsLoading(false);
				return;
			}

			try {
				const { data, error } = await supabase
					.from("text_blocks")
					.select("*")
					.eq("profile_block_id", block.id)
					.single();

				if (error) {
					throw error;
				}

				setTextBlock(data);
			} catch (err) {
				console.error("Error fetching text block:", err);
				setError(err instanceof Error ? err.message : "Failed to load block data");
			} finally {
				setIsLoading(false);
			}
		};

		fetchBlockData();
	}, [block.id, block.type, supabase]);

	const handleTextBlockSave = async (updatedBlock: Partial<TextBlockType>) => {
		if (!textBlock) return;

		try {
			const { error } = await supabase
				.from("text_blocks")
				.update({
					text: updatedBlock.text,
					alignment: updatedBlock.alignment
				})
				.eq("profile_block_id", block.id);

			if (error) throw error;

			setTextBlock({
				...textBlock,
				text: updatedBlock.text ?? textBlock.text,
				alignment: updatedBlock.alignment ?? textBlock.alignment
			});
			onSave?.(block);
		} catch (err) {
			console.error("Error saving text block:", err);
			throw err;
		}
	};

	if (isLoading) {
		return <div className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>;
	}

	if (error) {
		return <div className="text-red-500">Error loading block: {error}</div>;
	}

	switch (block.type) {
		case "text":
			if (!textBlock) return null;
			return (
				<TextBlock
					textBlock={textBlock}
					isEditing={isEditing}
					onDelete={onDelete}
					onSave={handleTextBlockSave}
				/>
			);
		// Add other block type cases here as needed
		default:
			return null;
	}
}