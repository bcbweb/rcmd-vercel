"use client";

import AddLinkButton from "@/components/links/add-link-button";
import LinkBlocks from "@/components/links/link-blocks"; // Update import path
import { createClient } from "@/utils/supabase/client";
import type { Link } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function LinksPage() {
	const supabase = createClient();
	const [links, setLinks] = useState<Link[]>([]);
	const [isLinkSaving, setIsLinkSaving] = useState(false);
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
			setIsLinkSaving(true);
			const { data: linksData, error: linksError } = await supabase
				.from('links')
				.select('*')
				.eq('owner_id', ownerId)
				.order('created_at', { ascending: false });

			if (linksError) throw linksError;
			setLinks(linksData || []);
		} catch (error) {
			console.error('Error refreshing links:', error);
			alert('Failed to refresh links');
		} finally {
			setIsLinkSaving(false);
		}
	}, [supabase]);

	const handleLinkAdded = useCallback(async () => {
		if (!userId) return;
		setIsLinkSaving(true);
		try {
			await refreshLinks(userId);
		} finally {
			setIsLinkSaving(false);
		}
	}, [userId, refreshLinks]);

	const handleDeleteLink = async (id: string) => {
		try {
			setIsLinkSaving(true);
			setLinks(prev => prev.filter(l => l.id !== id));

			const { error } = await supabase
				.from("links")
				.delete()
				.eq("id", id);

			if (error) throw error;
		} catch (error) {
			console.error('Error deleting link:', error);
			alert('Failed to delete link');
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
				initialLinks={links}
				onDelete={handleDeleteLink}
			/>

			{isLinkSaving && (
				<div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2">
					Saving changes...
				</div>
			)}
		</div>
	);
}