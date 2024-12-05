"use client";

import AddRCMDButton from "@/components/rcmds/add-rcmd-button";
import RCMDBlocks from "@/components/rcmds/rcmd-blocks";
import { createClient } from "@/utils/supabase/client";
import type { RCMDBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";

export default function RCMDsPage() {
	const supabase = createClient();
	const [rcmdBlocks, setRCMDBlocks] = useState<RCMDBlockType[]>([]);
	const [isRCMDSaving, setIsRCMDSaving] = useState(false);
	const userId = useAuthStore(state => state.userId);

	const refreshRCMDs = useCallback(async (ownerId: string) => {
		if (!ownerId) return;

		try {
			setIsRCMDSaving(true);
			const { data: rcmdsData, error: rcmdsError } = await supabase
				.from('rcmds')
				.select('*')
				.eq('owner_id', ownerId)
				.order('created_at', { ascending: false });

			if (rcmdsError) throw rcmdsError;

			const transformedBlocks: RCMDBlockType[] = (rcmdsData || []).map(rcmd => ({
				id: rcmd.id,
				rcmd_id: rcmd.id,
				profile_block_id: `profile-block-${rcmd.id}`,
				created_at: rcmd.created_at,
				updated_at: rcmd.updated_at
			}));

			setRCMDBlocks(transformedBlocks);
		} catch (error) {
			console.error('Error refreshing recommendations:', error);
			alert('Failed to refresh recommendations');
		} finally {
			setIsRCMDSaving(false);
		}
	}, [supabase]);

	useEffect(() => {
		if (!userId) return;
		refreshRCMDs(userId);
	}, [userId, refreshRCMDs]);

	useEffect(() => {
		useModalStore.setState({
			onModalSuccess: async () => {
				if (userId) {
					await refreshRCMDs(userId);
				}
			}
		});
	}, [userId, refreshRCMDs]);

	const handleDeleteRCMD = useCallback(async (id: string) => {
		const previousRCMDBlocks = [...rcmdBlocks];
		try {
			setIsRCMDSaving(true);
			setRCMDBlocks(prev => prev.filter(r => r.id !== id));

			const { error } = await supabase
				.from('rcmds')
				.delete()
				.eq('id', id);

			if (error) throw error;

		} catch (error) {
			console.error('Error deleting recommendation:', error);
			alert(
				error instanceof Error
					? error.message
					: 'Failed to delete recommendation'
			);
			setRCMDBlocks(previousRCMDBlocks);
		} finally {
			setIsRCMDSaving(false);
		}
	}, [rcmdBlocks, supabase]);

	const handleSaveRCMD = async (block: Partial<RCMDBlockType>) => {
		if (!userId) return;
		try {
			setIsRCMDSaving(true);

			const { error } = await supabase
				.from("rcmds")
				.update({
					updated_at: new Date().toISOString()
				})
				.eq("id", block.id);

			if (error) throw error;

			await refreshRCMDs(userId);
		} catch (error) {
			console.error('Error saving recommendation:', error);
			alert('Failed to save recommendation');
		} finally {
			setIsRCMDSaving(false);
		}
	};

	return (
		<div>
			<div className="flex gap-4 mb-4">
				<AddRCMDButton />
			</div>

			<RCMDBlocks
				rcmds={rcmdBlocks}
				isEditing={true}
				onDelete={handleDeleteRCMD}
				onSave={handleSaveRCMD}
			/>

			{isRCMDSaving && (
				<div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
					Saving changes...
				</div>
			)}
		</div>
	);
}