"use client";

import AddRCMDButton from "@/components/rcmds/add-rcmd-button";
import RCMDBlocks from "@/components/rcmds/rcmd-blocks";
import type { RCMD, RCMDBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";
import { useRCMDStore } from "@/stores/rcmd-store";
import { toast } from 'sonner';

export default function RCMDsPage() {
	const [rcmdBlocks, setRCMDBlocks] = useState<RCMDBlockType[]>([]);
	const [isRCMDSaving, setIsRCMDSaving] = useState(false);
	const userId = useAuthStore(state => state.userId);
	const { rcmds, fetchRCMDs, deleteRCMD, updateRCMD } = useRCMDStore();

	const transformRCMDsToBlocks = useCallback((rcmds: RCMD[]) => {
		return rcmds.map(rcmd => ({
			id: rcmd.id,
			rcmd_id: rcmd.id,
			profile_block_id: `profile-block-${rcmd.id}`,
			created_at: rcmd.created_at ?? new Date().toISOString(), // Provide default if null
			updated_at: rcmd.updated_at ?? new Date().toISOString()  // Provide default if null
		}));
	}, []);

	useEffect(() => {
		if (userId) {
			fetchRCMDs();
		}
	}, [userId, fetchRCMDs]);

	useEffect(() => {
		setRCMDBlocks(transformRCMDsToBlocks(rcmds));
	}, [rcmds, transformRCMDsToBlocks]);

	useEffect(() => {
		useModalStore.setState({
			onModalSuccess: () => {
				if (userId) {
					fetchRCMDs();
				}
			}
		});
	}, [userId, fetchRCMDs]);

	const handleDeleteRCMD = useCallback(async (id: string) => {
		toast('Are you sure you want to delete this RCMD?', {
			duration: Infinity,
			action: {
				label: 'Delete',
				onClick: async () => {
					try {
						setIsRCMDSaving(true);
						await deleteRCMD(id);
						await fetchRCMDs();
						toast.success('RCMD deleted successfully');
					} catch (error) {
						toast.error(error instanceof Error ? error.message : 'Failed to delete RCMD');
					} finally {
						setIsRCMDSaving(false);
					}
				},
			},
			cancel: {
				label: 'Cancel',
				onClick: () => {
					toast.dismiss();
				},
			},
		});
	}, [deleteRCMD, fetchRCMDs]);

	const handleSaveRCMD = async (block: Partial<RCMDBlockType>) => {
		if (!userId || !block.rcmd_id) return;
		try {
			setIsRCMDSaving(true);
			await updateRCMD(block.rcmd_id, {
				updated_at: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error saving RCMD:', error);
			alert('Failed to save RCMD');
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
				initialRCMDBlocks={rcmdBlocks}
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