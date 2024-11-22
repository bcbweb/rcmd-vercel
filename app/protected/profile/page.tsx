"use client";

import AddBlockButton from "@/components/profile/add-block-button";
import ProfileBlocks from "@/components/profile/profile-blocks";
import ShareButton from "@/components/profile/share-button";
import { PencilLine, Eye } from 'lucide-react';
import { createClient } from "@/utils/supabase/client";
import type { ProfileBlock } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useRouter } from "next/navigation";
import { User } from '@supabase/supabase-js';

export default function EditProfilePage() {
	const supabase = createClient();
	const router = useRouter();
	const [blocks, setBlocks] = useState<ProfileBlock[]>([]);
	const [username, setUsername] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);
	const [isBlockSaving, setIsBlockSaving] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [profileId, setProfileId] = useState<string>("");

	// Get and monitor auth state
	useEffect(() => {
		const getUser = async () => {
			const { data: { user }, error } = await supabase.auth.getUser();
			if (error || !user) {
				console.error('Error fetching user:', error);
				router.push('/sign-in');
				return;
			}
			setUser(user);
		};

		getUser();

		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
			if (session) {
				setUser(session.user);
			} else {
				setUser(null);
				router.push('/sign-in');
			}
		});

		return () => subscription.unsubscribe();
	}, [supabase, router]);

	const fetchProfileData = useCallback(async (userId: string) => {
		try {
			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("id, is_onboarded, username")
				.eq("auth_user_id", userId)
				.single();

			if (profileError) throw profileError;

			if (!profile || profile.is_onboarded !== true) {
				router.push('/protected/onboarding');
				return null;
			}

			setUsername(profile.username || "");
			setProfileId(profile.id);
			return profile.id;
		} catch (error) {
			console.error('Error fetching profile:', error);
			alert('Failed to load profile data');
			return null;
		}
	}, [supabase, router]);

	const refreshBlocks = useCallback(async (profileId: string) => {
		if (!profileId) return;

		try {
			setIsBlockSaving(true);
			const { data: blocksData, error: blocksError } = await supabase
				.from('profile_blocks')
				.select('*')
				.eq('profile_id', profileId)
				.order('order', { ascending: true });

			if (blocksError) throw blocksError;
			setBlocks(blocksData || []);
		} catch (error) {
			console.error('Error refreshing blocks:', error);
			alert('Failed to refresh blocks');
		} finally {
			setIsBlockSaving(false);
		}
	}, [supabase]);

	// Initialize profile and blocks
	useEffect(() => {
		const initializeProfile = async () => {
			if (!user?.id) return;

			const profileId = await fetchProfileData(user.id);
			if (profileId) {
				await refreshBlocks(profileId);
			}
			setIsLoading(false);
		};

		initializeProfile();
	}, [user?.id, fetchProfileData, refreshBlocks]);


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
				.order('order', { ascending: true });

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
				.order('order', { ascending: true });

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

	const handleDeleteBlock = async (id: string) => {
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
	};

	if (isLoading || !user) {
		return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
	}

	const shareUrl = username ? `${window.location.origin}/${username}` : "";

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="w-full max-w-7xl mx-auto py-8 px-4">
				<div className="relative flex flex-wrap gap-y-4 items-center mb-8">
					<div className="absolute right-0">
						<div className="flex items-center gap-3">
							<button
								onClick={() => router.push('/protected/edit-info')}
								className="p-2 hover:bg-gray-100 rounded-full transition-colors"
								title="Edit my info"
							>
								<PencilLine className="w-5 h-5" />
							</button>
							<button
								onClick={() => window.open(`/${username}`, '_blank')}
								className="p-2 hover:bg-gray-100 rounded-full transition-colors"
								title="Preview my public profile"
							>
								<Eye className="w-5 h-5" />
							</button>
							<ShareButton url={shareUrl} />
						</div>
					</div>
					<h1 className="text-2xl font-bold w-full text-center">Edit Profile</h1>
				</div>

				<div className="flex gap-4 mb-4">
					<AddBlockButton
						profileId={profileId}
						onBlockAdded={handleBlockAdded}
					/>
				</div>

				<ProfileBlocks
					blocks={blocks}
					isEditing={true}
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