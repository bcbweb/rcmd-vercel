"use client";

import AddBlockButton from "@/components/profile/add-block-button";
import ProfileBlocks from "@/components/profile/profile-blocks";
import ShareButton from "@/components/profile/share-button";
import { createClient } from "@/utils/supabase/client";
import type { ProfileBlock } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

function createDefaultBlock(id: string, type: string, userId: string | undefined, order: number): ProfileBlock {
	if (!['rcmd', 'business', 'custom', 'text', 'image'].includes(type)) {
		throw new Error(`Invalid block type: ${type}`);
	}

	return {
		id,
		type,
		business_id: null,
		content: null,
		created_at: null,
		updated_at: null,
		order,
		profile_id: userId || null,
		rcmd_id: null,
		text_block_id: null
	};
}

export default function EditProfilePage() {
	const supabase = createClient();
	const router = useRouter();
	const [blocks, setBlocks] = useState<ProfileBlock[]>([]);
	const [username] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);
	const [isBlockSaving, setIsBlockSaving] = useState(false);
	const [user, setUser] = useState<User | null>(null);

	// Get and monitor auth state
	useEffect(() => {
		const getUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			setUser(user);
			if (!user) {
				router.push('/sign-in');
			}
		};

		getUser();

		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			if (!session?.user) {
				router.push('/sign-in');
			}
		});

		return () => subscription.unsubscribe();
	}, [supabase, router]);

	// Check onboarding status and fetch blocks on component mount
	useEffect(() => {
		const checkOnboardingAndFetchBlocks = async () => {
			if (!user?.id) {
				return;
			}

			try {
				// First check onboarding status
				const { data: profile, error: profileError } = await supabase
					.from("profiles")
					.select("is_onboarded")
					.eq("auth_user_id", user.id)
					.single();

				if (profileError) throw profileError;

				// Redirect if not onboarded
				if (!profile || profile.is_onboarded !== true) {
					router.push('/protected/onboarding');
					return;
				}

				// If onboarded, fetch blocks
				const { data: blocksData, error: blocksError } = await supabase
					.from('profile_blocks')
					.select('*')
					.eq('profile_id', user.id)
					.order('order', { ascending: true });

				if (blocksError) throw blocksError;

				setBlocks(blocksData || []);
			} catch (error) {
				console.error('Error:', error);
				alert('Failed to load profile data');
			} finally {
				setIsLoading(false);
			}
		};

		checkOnboardingAndFetchBlocks();
	}, [user?.id, supabase, router]);

	const handleAddBlock = async (blockData: { id: string; type: string; }) => {
		if (!user?.id) return;
		setIsBlockSaving(true);

		try {
			const tempBlock = createDefaultBlock(
				blockData.id,
				blockData.type,
				user.id,
				blocks.length
			);

			setBlocks(prev => [...prev, tempBlock]);

			const { data, error } = await supabase
				.from("profile_blocks")
				.insert([{
					type: blockData.type,
					profile_id: user.id,
					order: blocks.length,
					content: null,
					business_id: null,
					rcmd_id: null,
					text_block_id: null
				}])
				.select()
				.single();

			if (error) throw error;

			setBlocks(prev => prev.map(block =>
				block.id === blockData.id ? data : block
			));

		} catch (error) {
			console.error('Error adding block:', error);
			setBlocks(prev => prev.filter(block => block.id !== blockData.id));
			alert('Failed to save block');
		} finally {
			setIsBlockSaving(false);
		}
	};

	const moveBlock = useCallback(
		async (dragIndex: number, hoverIndex: number) => {
			setBlocks((prevBlocks) => {
				const newBlocks = [...prevBlocks];
				const [removed] = newBlocks.splice(dragIndex, 1);
				newBlocks.splice(hoverIndex, 0, removed);
				return newBlocks;
			});

			await supabase
				.from("profile_blocks")
				.update({ order: hoverIndex })
				.eq("id", blocks[dragIndex].id);
		},
		[blocks, supabase],
	);

	const handleDeleteBlock = async (id: string) => {
		try {
			setBlocks(prev => prev.filter(b => b.id !== id));

			const { error } = await supabase
				.from("profile_blocks")
				.delete()
				.eq("id", id);

			if (error) throw error;

		} catch (error) {
			console.error('Error deleting block:', error);
			alert('Failed to delete block');
		}
	};

	if (isLoading || !user) {
		return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
	}

	const shareUrl = username ? `${window.location.origin}/${username}` : "";

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="max-w-4xl mx-auto py-8 px-4">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-2xl font-bold">Edit Profile</h1>
					<div className="flex gap-4">
						<ShareButton url={shareUrl} />
						<AddBlockButton onAdd={handleAddBlock} />
					</div>
				</div>

				<ProfileBlocks
					blocks={blocks}
					isEditing={true}
					onMove={moveBlock}
					onDelete={handleDeleteBlock}
				/>
				{isBlockSaving && (
					<div className="text-center py-4">Saving...</div>
				)}
			</div>
		</DndProvider>
	);
}