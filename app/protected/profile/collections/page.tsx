// page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";
import { useCollectionStore } from "@/stores/collection-store";
import AddCollectionButton from "@/components/collections/add-collection-button";
import CollectionBlocks from "@/components/collections/collection-blocks";
import type { Collection, CollectionBlockType } from "@/types";
import { toast } from 'sonner';

export default function CollectionsPage() {
	const [collectionBlocks, setCollectionBlocks] = useState<CollectionBlockType[]>([]);
	const [isCollectionSaving, setIsCollectionSaving] = useState(false);
	const userId = useAuthStore(state => state.userId);
	const { collections, fetchCollections, deleteCollection, updateCollection } = useCollectionStore();

	const transformCollectionsToBlocks = useCallback((collections: Collection[]) => {
		return collections.map(collection => ({
			id: crypto.randomUUID(),
			collection_id: collection.id,
			profile_block_id: `profile-block-${collection.id}`,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}));
	}, []);

	useEffect(() => {
		if (userId) {
			fetchCollections(userId);
		}
	}, [userId, fetchCollections]);

	useEffect(() => {
		setCollectionBlocks(transformCollectionsToBlocks(collections));
	}, [collections, transformCollectionsToBlocks]);

	useEffect(() => {
		useModalStore.setState({
			onModalSuccess: () => {
				if (userId) {
					fetchCollections(userId);
				}
			}
		});
	}, [userId, fetchCollections]);

	const handleDeleteCollection = useCallback(async (id: string) => {
		toast('Are you sure you want to delete this collection?', {
			duration: Infinity,
			action: {
				label: 'Delete',
				onClick: async () => {
					try {
						setIsCollectionSaving(true);
						await deleteCollection(id);
						toast.success('Collection deleted successfully');
					} catch (error) {
						toast.error(error instanceof Error ? error.message : 'Failed to delete collection');
					} finally {
						setIsCollectionSaving(false);
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
	}, [deleteCollection]);

	const handleSaveCollection = async (block: Partial<CollectionBlockType>) => {
		if (!userId || !block.collection_id) return;
		try {
			setIsCollectionSaving(true);
			await updateCollection(block.collection_id, {
				updated_at: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error saving collection:', error);
			toast.error('Failed to save collection');
		} finally {
			setIsCollectionSaving(false);
		}
	};

	return (
		<div>
			<div className="flex gap-4 mb-4">
				<AddCollectionButton />
			</div>

			<CollectionBlocks
				initialCollectionBlocks={collectionBlocks}
				onDelete={handleDeleteCollection}
				onSave={handleSaveCollection}
			/>

			{isCollectionSaving && (
				<div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
					Saving changes...
				</div>
			)}
		</div>
	);
}