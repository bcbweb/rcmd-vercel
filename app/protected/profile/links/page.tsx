"use client";

import AddLinkButton from "@/components/links/add-link-button";
import LinkBlocks from "@/components/links/link-blocks";
import { createClient } from "@/utils/supabase/client";
import type { LinkBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function LinksPage() {
	const supabase = createClient();
	const [linkBlocks, setLinkBlocks] = useState<LinkBlockType[]>([]);
	const [isBlockSaving, setIsBlockSaving] = useState(false);
	const [userId, setUserId] = useState<string>("");

	// Get user ID
	useEffect(() => {
		const getUserId = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			setUserId(user.id);
			refreshLinks(user.id);
		};

		getUserId();
	}, [supabase]);

	const refreshLinks = useCallback(async (ownerId: string) => {
		if (!ownerId) return;

		try {
			setIsBlockSaving(true);
			const { data: linksData, error: linksError } = await supabase
				.from('links')
				.select('*')
				.eq('owner_id', ownerId)
				.order('created_at', { ascending: false });

			if (linksError) throw linksError;

			// Transform links data into link blocks format
			const transformedBlocks: LinkBlockType[] = (linksData || []).map(link => ({
				id: link.id,
				link_id: link.id,
				profile_block_id: `profile-block-${link.id}`, // Generate a unique profile block ID
				created_at: link.created_at,
				updated_at: link.updated_at
			}));

			setLinkBlocks(transformedBlocks);
		} catch (error) {
			console.error('Error refreshing links:', error);
			alert('Failed to refresh links');
		} finally {
			setIsBlockSaving(false);
		}
	}, [supabase]);

	const handleBlockAdded = useCallback(async () => {
		if (!userId) return;
		setIsBlockSaving(true);
		try {
			await refreshLinks(userId);
		} finally {
			setIsBlockSaving(false);
		}
	}, [userId, refreshLinks]);

	const handleDeleteBlock = useCallback(async (id: string) => {
		try {
			setIsBlockSaving(true);
			setLinkBlocks(prev => prev.filter(b => b.id !== id));

			const { error } = await supabase
				.from("links")
				.delete()
				.eq("id", id);

			if (error) throw error;
		} catch (error) {
			console.error('Error deleting link:', error);
			alert('Failed to delete link');
		} finally {
			setIsBlockSaving(false);
		}
	}, [supabase]);

	const handleSaveBlock = async (block: Partial<LinkBlockType>) => {
		try {
			setIsBlockSaving(true);

			const { error } = await supabase
				.from("links")
				.update({
					updated_at: new Date().toISOString()
				})
				.eq("id", block.id);

			if (error) throw error;

			await refreshLinks(userId);
		} catch (error) {
			console.error('Error saving link:', error);
			alert('Failed to save link');
		} finally {
			setIsBlockSaving(false);
		}
	};

	return (
		<div>
			<div className="flex gap-4 mb-4">
				<AddLinkButton
					onLinkAdded={handleBlockAdded}
				/>
			</div>

			<LinkBlocks
				initialLinkBlocks={linkBlocks}
				onDelete={handleDeleteBlock}
				onSave={handleSaveBlock}
			/>

			{isBlockSaving && (
				<div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
					Saving changes...
				</div>
			)}
		</div>
	);
}