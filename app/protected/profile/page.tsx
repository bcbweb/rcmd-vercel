"use client";

import AddBlockButton from "@/components/profile/add-block-button";
import ProfileBlocks from "@/components/profile/profile-blocks";
import RCMDBlockModal from "@/components/profile/modals/rcmd-block-modal";
import TextBlockModal from "@/components/profile/modals/text-block-modal";
import ImageBlockModal from "@/components/profile/modals/image-block-modal";
import LinkBlockModal from "@/components/profile/modals/link-block-modal";
import { createClient } from "@/utils/supabase/client";
import type { ProfileBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";

export default function EditProfilePage() {
	const supabase = createClient();
	const [blocks, setBlocks] = useState<ProfileBlockType[]>([]);
	const [isBlockSaving, setIsBlockSaving] = useState(false);
	const [profileId, setProfileId] = useState<string>("");
	const userId = useAuthStore(state => state.userId);
	const {
		isRCMDBlockModalOpen,
		setIsRCMDBlockModalOpen,
		isTextBlockModalOpen,
		setIsTextBlockModalOpen,
		isImageBlockModalOpen,
		setIsImageBlockModalOpen,
		isLinkBlockModalOpen,
		setIsLinkBlockModalOpen
	} = useModalStore();

	// Get profile ID
	useEffect(() => {
		const getProfileId = async () => {
			if (!userId) return;

			const { data: profile } = await supabase
				.from("profiles")
				.select("id")
				.eq("auth_user_id", userId)
				.single();

			if (profile) {
				setProfileId(profile.id);
				refreshBlocks(profile.id);
			}
		};

		getProfileId();
	}, [userId, supabase]);

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

			setBlocks((prevBlocks) => {
				const newBlocks = [...prevBlocks];
				const [removed] = newBlocks.splice(dragIndex, 1);
				newBlocks.splice(hoverIndex, 0, removed);
				return newBlocks;
			});

			const newOrder = hoverIndex + 1;
			const blockId = blocks[dragIndex].id;
			const profileId = blocks[dragIndex].profile_id;

			const { error } = await supabase.rpc('reorder_profile_blocks', {
				p_profile_id: profileId,
				p_block_id: blockId,
				p_new_order: newOrder
			});

			if (error) throw error;

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
			setIsRCMDBlockModalOpen(false);
			setIsTextBlockModalOpen(false);
			setIsImageBlockModalOpen(false);
			setIsLinkBlockModalOpen(false);
		} finally {
			setIsBlockSaving(false);
		}
	}, [
		profileId,
		refreshBlocks,
		setIsRCMDBlockModalOpen,
		setIsTextBlockModalOpen,
		setIsImageBlockModalOpen,
		setIsLinkBlockModalOpen
	]);

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

	if (!userId) return null;

	return (
		<DndProvider backend={HTML5Backend}>
			<div>
				<div className="flex gap-4 mb-4">
					<AddBlockButton />
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

				{isRCMDBlockModalOpen && (
					<RCMDBlockModal
						profileId={profileId}
						onSuccess={handleBlockAdded}
					/>
				)}

				{isTextBlockModalOpen && (
					<TextBlockModal
						profileId={profileId}
						onSuccess={handleBlockAdded}
					/>
				)}

				{isImageBlockModalOpen && (
					<ImageBlockModal
						profileId={profileId}
						onSuccess={handleBlockAdded}
					/>
				)}

				{isLinkBlockModalOpen && (
					<LinkBlockModal
						profileId={profileId}
						onSuccess={handleBlockAdded}
					/>
				)}
			</div>
		</DndProvider>
	);
}