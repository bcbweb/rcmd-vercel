"use client";

import AddLinkButton from "@/components/links/add-link-button";
import LinkBlocks from "@/components/links/link-blocks";
import { createClient } from "@/utils/supabase/client";
import type { LinkBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function LinksPage() {
	const supabase = createClient();
	const [linkBlocks, setLinkBlocks] = useState<LinkBlockType[]>([]);
	const [isLinkSaving, setIsLinkSaving] = useState(false);
	const [userId, setUserId] = useState<string>("");

	// Get user ID
	useEffect(() => {
		const getUserId = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			setUserId(user.id);
			fetchLinks(user.id);
		};

		getUserId();
	}, [supabase]);

	const fetchLinks = useCallback(async (ownerId: string) => {
		if (!ownerId) return;

		try {
			setIsLinkSaving(true);
			const { data: linksData, error: linksError } = await supabase
				.from('links')
				.select('*')
				.eq('owner_id', ownerId)
				.order('created_at', { ascending: false });

			if (linksError) throw linksError;

			const transformedBlocks: LinkBlockType[] = (linksData || []).map(link => ({
				id: link.id,
				link_id: link.id,
				profile_block_id: `profile-block-${link.id}`,
				created_at: link.created_at,
				updated_at: link.updated_at
			}));

			setLinkBlocks(transformedBlocks);
		} catch (error) {
			console.error('Error fetching links:', error);
			alert('Failed to fetch links');
		} finally {
			setIsLinkSaving(false);
		}
	}, [supabase]);

	const handleLinkAdded = useCallback(async () => {
		if (!userId) return;
		setIsLinkSaving(true);
		try {
			await fetchLinks(userId);
		} finally {
			setIsLinkSaving(false);
		}
	}, [userId, fetchLinks]);

	const handleDeleteLink = useCallback(async (id: string) => {
		const previousLinkBlocks = [...linkBlocks];
		try {
			setIsLinkSaving(true);

			// Optimistic update
			setLinkBlocks(prev => prev.filter(l => l.link_id !== id));

			const { error } = await supabase
				.from('links')
				.delete()
				.eq('id', id);

			if (error) {
				throw error;
			}

		} catch (error) {
			console.error('Error deleting link:', error);
			alert(
				error instanceof Error
					? error.message
					: 'Failed to delete link'
			);
			// Revert optimistic update
			setLinkBlocks(previousLinkBlocks);
		} finally {
			setIsLinkSaving(false);
		}
	}, [linkBlocks, supabase]);

	const handleSaveLink = async (block: Partial<LinkBlockType>) => {
		try {
			setIsLinkSaving(true);

			const { error } = await supabase
				.from("links")
				.update({
					updated_at: new Date().toISOString()
				})
				.eq("id", block.link_id);

			if (error) throw error;

			await fetchLinks(userId);
		} catch (error) {
			console.error('Error saving link:', error);
			alert('Failed to save link');
		} finally {
			setIsLinkSaving(false);
		}
	};

	return (
		<div>
			<div className="flex gap-4 mb-4">
				<AddLinkButton
					onLinkAdded={handleLinkAdded}
				/>
			</div>

			<LinkBlocks
				initialLinkBlocks={linkBlocks}
				onDelete={handleDeleteLink}
				onSave={handleSaveLink}
			/>

			{isLinkSaving && (
				<div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
					Saving changes...
				</div>
			)}
		</div>
	);
}