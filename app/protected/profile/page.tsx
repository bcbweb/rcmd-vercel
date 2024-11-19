"use client";

import AddBlockButton from "@/components/profile/AddBlockButton";
import ProfileBlocks from "@/components/profile/ProfileBlocks";
import ShareButton from "@/components/profile/ShareButton";
import { useSupabase } from "@/components/providers/supabase-provider";
import type { ProfileBlock } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function createDefaultBlock(id: string, type: string, userId: string | undefined, order: number): ProfileBlock {
	// Updated array of allowed types
	if (!['rcmd', 'business', 'custom', 'text', 'image'].includes(type)) {
		throw new Error(`Invalid block type: ${type}`);
	}

	return {
		id,
		type,
		business_id: null,
		content: null,
		created_at: null,
		updated_at: null,
		order,
		profile_id: userId || null,
		rcmd_id: null,
		text_block_id: null
	};
}

export default function EditProfilePage() {
	const { supabase, session } = useSupabase();
	const [blocks, setBlocks] = useState<ProfileBlock[]>([]);
	const [username, setUsername] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);

	// Fetch existing blocks on component mount
	useEffect(() => {
		const fetchBlocks = async () => {
			if (!session?.user?.id) return;

			try {
				const { data, error } = await supabase
					.from('profile_blocks')
					.select('*')
					.eq('profile_id', session.user.id)
					.order('order', { ascending: true });

				if (error) throw error;

				setBlocks(data || []);
			} catch (error) {
				console.error('Error fetching blocks:', error);
				alert('Failed to load blocks');
			}
		};

		fetchBlocks();
	}, [session?.user?.id, supabase]);

	const handleAddBlock = async (blockData: { id: string; type: string; }) => {
		setIsLoading(true);

		try {
			const tempBlock = createDefaultBlock(
				blockData.id,
				blockData.type,
				session?.user?.id,
				blocks.length
			);

			setBlocks(prev => [...prev, tempBlock]);

			const { data, error } = await supabase
				.from("profile_blocks")
				.insert([{
					type: blockData.type,
					profile_id: session?.user?.id,
					order: blocks.length,
					content: null,
					business_id: null,
					rcmd_id: null,
					text_block_id: null
				}])
				.select()
				.single();

			if (error) throw error;

			setBlocks(prev => prev.map(block =>
				block.id === blockData.id ? data : block
			));

		} catch (error) {
			console.error('Error adding block:', error);
			setBlocks(prev => prev.filter(block => block.id !== blockData.id));
			alert('Failed to save block');
		} finally {
			setIsLoading(false);
		}
	};

	const moveBlock = useCallback(
		async (dragIndex: number, hoverIndex: number) => {
			// Update block order in UI
			setBlocks((prevBlocks) => {
				const newBlocks = [...prevBlocks];
				const [removed] = newBlocks.splice(dragIndex, 1);
				newBlocks.splice(hoverIndex, 0, removed);
				return newBlocks;
			});

			// Update order in database
			await supabase
				.from("profile_blocks")
				.update({ order: hoverIndex })
				.eq("id", blocks[dragIndex].id);
		},
		[blocks, supabase],
	);

	const handleDeleteBlock = async (id: string) => {
		try {
			// Remove from UI immediately
			setBlocks(prev => prev.filter(b => b.id !== id));

			// Remove from database
			const { error } = await supabase
				.from("profile_blocks")
				.delete()
				.eq("id", id);

			if (error) throw error;

		} catch (error) {
			console.error('Error deleting block:', error);
			// Optionally restore the block in UI if delete failed
			alert('Failed to delete block');
		}
	};

	const shareUrl = username ? `${window.location.origin}/${username}` : "";

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="max-w-4xl mx-auto py-8 px-4">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-2xl font-bold">Edit Profile</h1>
					<div className="flex gap-4">
						<ShareButton url={shareUrl} />
						<AddBlockButton onAdd={handleAddBlock} />
					</div>
				</div>

				<ProfileBlocks
					blocks={blocks}
					isEditing={true}
					onMove={moveBlock}
					onDelete={handleDeleteBlock}
				/>
				{isLoading && (
					<div className="text-center py-4">Saving...</div>
				)}
			</div>
		</DndProvider>
	);
}