"use client";

import AddBlockButton from "@/components/profile/add-block-button";
import ProfileBlocks from "@/components/profile/profile-blocks";
import { createClient } from "@/utils/supabase/client";
import type { ProfileBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function EditProfilePage() {
	const supabase = createClient();
	const [blocks, setBlocks] = useState<ProfileBlockType[]>([]);
	const [isBlockSaving, setIsBlockSaving] = useState(false);
	const [profileId, setProfileId] = useState<string>("");
	const [userId, setUserId] = useState<string>("");

	// Get profile ID
	useEffect(() => {
		const getProfileId = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { data: profile } = await supabase
				.from("profiles")
				.select("id")
				.eq("auth_user_id", user.id)
				.single();

			if (user?.id) {
				setUserId(user.id);
			}

			if (profile) {
				setProfileId(profile.id);
				refreshBlocks(profile.id);
			}
		};

		getProfileId();
	}, [supabase]);

	const refreshBlocks = useCallback(async (profileId: string) => {
		if (!profileId) return;

		try {
			setIsBlockSaving(true);
			const { data: blocksData, error: blocksError } = await supabase
				.from('profile_blocks')
				.select('*')
				.eq('profile_id', profileId)
				.order('display_order', { ascending: true });

			if (blocksError) throw blocksError;
			setBlocks(blocksData || []);
		} catch (error) {
			console.error('Error refreshing blocks:', error);
			alert('Failed to refresh blocks');
		} finally {
			setIsBlockSaving(false);
		}
	}, [supabase]);

	const moveBlock = useCallback(async (dragIndex: number, hoverIndex: number) => {
		try {
			setIsBlockSaving(true);

			// Update local state first for immediate UI feedback
			setBlocks((prevBlocks) => {
				const newBlocks = [...prevBlocks];
				const [removed] = newBlocks.splice(dragIndex, 1);
				newBlocks.splice(hoverIndex, 0, removed);
				return newBlocks;
			});

			// Calculate the new order value
			const newOrder = hoverIndex + 1; // Using 1-based indexing
			const blockId = blocks[dragIndex].id;
			const profileId = blocks[dragIndex].profile_id;

			// Call the database function to handle reordering
			const { error } = await supabase.rpc('reorder_profile_blocks', {
				p_profile_id: profileId,
				p_block_id: blockId,
				p_new_order: newOrder
			});

			if (error) throw error;

			// Optionally refresh the blocks from the server to ensure consistency
			const { data: updatedBlocks, error: fetchError } = await supabase
				.from("profile_blocks")
				.select('*')
				.eq('profile_id', profileId)
				.order('display_order', { ascending: true });

			if (fetchError) throw fetchError;

			if (updatedBlocks) {
				setBlocks(updatedBlocks);
			}

		} catch (error) {
			console.error('Error moving block:', error);
			alert('Failed to update block order');

			// Optionally revert the local state on error
			const { data: originalBlocks } = await supabase
				.from("profile_blocks")
				.select('*')
				.eq('profile_id', blocks[dragIndex].profile_id)
				.order('display_order', { ascending: true });

			if (originalBlocks) {
				setBlocks(originalBlocks);
			}
		} finally {
			setIsBlockSaving(false);
		}
	}, [blocks, supabase]);

	const handleBlockAdded = useCallback(async () => {
		if (!profileId) return;
		setIsBlockSaving(true);
		try {
			await refreshBlocks(profileId);
		} finally {
			setIsBlockSaving(false);
		}
	}, [profileId, refreshBlocks]);

	const handleDeleteBlock = useCallback(async (id: string) => {
		try {
			setIsBlockSaving(true);
			setBlocks(prev => prev.filter(b => b.id !== id));

			const { error } = await supabase
				.from("profile_blocks")
				.delete()
				.eq("id", id);

			if (error) throw error;
		} catch (error) {
			console.error('Error deleting block:', error);
			alert('Failed to delete block');
		} finally {
			setIsBlockSaving(false);
		}
	}, [supabase]);

	return (
		<DndProvider backend={HTML5Backend}>
			<div>
				<div className="flex gap-4 mb-4">
					<AddBlockButton
						userId={userId}
						profileId={profileId}
						onBlockAdded={handleBlockAdded}
					/>
				</div>

				<ProfileBlocks
					blocks={blocks}
					onMove={moveBlock}
					onDelete={handleDeleteBlock}
				/>

				{isBlockSaving && (
					<div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2">
						Saving changes...
					</div>
				)}
			</div>
		</DndProvider>
	);
}