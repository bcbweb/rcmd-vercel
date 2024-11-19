"use client";

import { useSupabase } from "@/components/providers/supabase-provider";
import { type ProfileBlock, type TextBlockType } from "@/types";
import { useEffect, useState } from "react";
// import BusinessBlock from "./blocks/BusinessBlock";
// import RCMDBlock from "./blocks/RCMDBlock";
import TextBlock from "./blocks/TextBlock";

interface Props {
	block: ProfileBlock;
	isEditing: boolean;
	onDelete?: () => void;
	onSave?: (updatedBlock: ProfileBlock) => void;
}

export default function BlockRenderer({
	block,
	isEditing,
	onDelete,
	onSave,
}: Props) {
	const { supabase } = useSupabase();
	const [textBlock, setTextBlock] = useState<TextBlockType | null>(null);

	useEffect(() => {
		if (block.type === "text" && block.text_block_id) {
			supabase
				.from("text_blocks")
				.select("*")
				.eq("id", block.text_block_id)
				.single()
				.then(({ data }) => {
					if (data) setTextBlock(data);
				});
		}
	}, [block.type, block.text_block_id, supabase]);

	switch (block.type) {
		case "text":
			if (!textBlock) return null;
			return (
				<TextBlock
					textBlock={textBlock}
					isEditing={isEditing}
					onDelete={onDelete}
					onSave={async (updatedText) => {
						await supabase
							.from("text_blocks")
							.update({ text: updatedText.text })
							.eq("id", textBlock.id);

						onSave?.({
							...block,
						});
					}}
				/>
			);
		// ... other cases
		default:
			return null;
	}
}
