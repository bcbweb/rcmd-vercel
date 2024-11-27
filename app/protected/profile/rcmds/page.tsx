"use client";

import AddRcmdButton from "@/components/rcmds/add-rcmd-button";
import RcmdBlocks from "@/components/rcmds/rcmd-blocks";
import { createClient } from "@/utils/supabase/client";
import type { RCMDBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function RcmdsPage() {
	const supabase = createClient();
	const [rcmdBlocks, setRcmdBlocks] = useState<RCMDBlockType[]>([]);
	const [isRcmdSaving, setIsRcmdSaving] = useState(false);
	const [userId, setUserId] = useState<string>("");

	// Get user ID
	useEffect(() => {
		const getUserId = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			setUserId(user.id);
			refreshRcmds(user.id);
		};

		getUserId();
	}, [supabase]);

	const refreshRcmds = useCallback(async (ownerId: string) => {
		if (!ownerId) return;

		try {
			setIsRcmdSaving(true);
			const { data: rcmdsData, error: rcmdsError } = await supabase
				.from('rcmds')
				.select('*')
				.eq('owner_id', ownerId)
				.order('created_at', { ascending: false });

			if (rcmdsError) throw rcmdsError;

			// Transform rcmds data into rcmd blocks format
			const transformedBlocks: RCMDBlockType[] = (rcmdsData || []).map(rcmd => ({
				id: rcmd.id,
				rcmd_id: rcmd.id,
				profile_block_id: `profile-block-${rcmd.id}`, // Generate a unique profile block ID
				created_at: rcmd.created_at,
				updated_at: rcmd.updated_at
			}));

			setRcmdBlocks(transformedBlocks);
		} catch (error) {
			console.error('Error refreshing recommendations:', error);
			alert('Failed to refresh recommendations');
		} finally {
			setIsRcmdSaving(false);
		}
	}, [supabase]);

	const handleRcmdAdded = useCallback(async () => {
		if (!userId) return;
		setIsRcmdSaving(true);
		try {
			await refreshRcmds(userId);
		} finally {
			setIsRcmdSaving(false);
		}
	}, [userId, refreshRcmds]);

	const handleDeleteRcmd = useCallback(async (id: string) => {
		try {
			setIsRcmdSaving(true);
			setRcmdBlocks(prev => prev.filter(r => r.id !== id));

			const { error } = await supabase
				.from("rcmds")
				.delete()
				.eq("id", id);

			if (error) throw error;
		} catch (error) {
			console.error('Error deleting recommendation:', error);
			alert('Failed to delete recommendation');
		} finally {
			setIsRcmdSaving(false);
		}
	}, [supabase]);

	const handleSaveRcmd = async (block: Partial<RCMDBlockType>) => {
		try {
			setIsRcmdSaving(true);

			const { error } = await supabase
				.from("rcmds")
				.update({
					updated_at: new Date().toISOString()
				})
				.eq("id", block.id);

			if (error) throw error;

			await refreshRcmds(userId);
		} catch (error) {
			console.error('Error saving recommendation:', error);
			alert('Failed to save recommendation');
		} finally {
			setIsRcmdSaving(false);
		}
	};

	return (
		<div>
			<div className="flex gap-4 mb-4">
				<AddRcmdButton onRcmdAdded={handleRcmdAdded} />
			</div>

			<RcmdBlocks
				rcmds={rcmdBlocks}
				isEditing={true}
				onDelete={handleDeleteRcmd}
				onSave={handleSaveRcmd}
			/>

			{isRcmdSaving && (
				<div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
					Saving changes...
				</div>
			)}
		</div>
	);
}