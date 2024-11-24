"use client";

import AddRcmdButton from "@/components/rcmds/add-rcmd-button";
import RcmdBlocks from "@/components/rcmds/rcmd-blocks";
import { createClient } from "@/utils/supabase/client";
import type { RCMD } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function RcmdsPage() {
	const supabase = createClient();
	const [rcmds, setRcmds] = useState<RCMD[]>([]);
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
			setRcmds(rcmdsData || []);
		} catch (error) {
			console.error('Error refreshing rcmds:', error);
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

	const handleDeleteRcmd = async (id: string) => {
		try {
			setIsRcmdSaving(true);
			setRcmds(prev => prev.filter(r => r.id !== id));

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
	};

	return (
		<div>
			<div className="flex gap-4 mb-4">
				<AddRcmdButton onRcmdAdded={handleRcmdAdded} />
			</div>

			<RcmdBlocks
				rcmds={rcmds}
				isEditing={true}
				onDelete={handleDeleteRcmd}
			/>

			{isRcmdSaving && (
				<div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2">
					Saving changes...
				</div>
			)}
		</div>
	);
}