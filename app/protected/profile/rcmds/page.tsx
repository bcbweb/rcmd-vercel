"use client";

import AddRcmdButton from "@/components/rcmds/add-rcmd-button";
import RcmdBlocks from "@/components/rcmds/rcmd-blocks";
import { createClient } from "@/utils/supabase/client";
import type { RCMD } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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

	const moveRcmd = useCallback(async (dragIndex: number, hoverIndex: number) => {
		try {
			setIsRcmdSaving(true);

			// Update local state first for immediate UI feedback
			setRcmds((prevRcmds) => {
				const newRcmds = [...prevRcmds];
				const [removed] = newRcmds.splice(dragIndex, 1);
				newRcmds.splice(hoverIndex, 0, removed);
				return newRcmds;
			});

		} catch (error) {
			console.error('Error moving recommendation:', error);
			alert('Failed to update recommendation order');

			// Revert the local state on error
			refreshRcmds(userId);
		} finally {
			setIsRcmdSaving(false);
		}
	}, [rcmds, supabase, userId, refreshRcmds]);

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
		<DndProvider backend={HTML5Backend}>
			<div>
				<div className="flex gap-4 mb-4">
					<AddRcmdButton
						ownerId={userId}
						onRcmdAdded={handleRcmdAdded}
					/>
				</div>

				<RcmdBlocks
					rcmds={rcmds}
					isEditing={true}
					onMove={moveRcmd}
					onDelete={handleDeleteRcmd}
				/>

				{isRcmdSaving && (
					<div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2">
						Saving changes...
					</div>
				)}
			</div>
		</DndProvider>
	);
}