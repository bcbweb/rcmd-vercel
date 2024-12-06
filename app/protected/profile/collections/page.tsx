"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";
import { useCollectionStore } from "@/stores/collection-store";
import AddCollectionButton from "@/components/collections/add-collection-button";
import CollectionList from "@/components/collections/collection-list";
import { CollectionBlockType } from "@/types";

export default function CollectionsPage() {
	const [isCollectionSaving, setIsCollectionSaving] = useState(false);
	const userId = useAuthStore(state => state.userId);

	const { collections, fetchCollections, deleteCollection, updateCollection } = useCollectionStore();

	// Transform collections to CollectionBlock format
	const collectionBlocks = useMemo(() => {
		return collections.map(collection => ({
			id: crypto.randomUUID(), // Generate a unique ID for the block
			collection_id: collection.id,
			profile_block_id: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		} satisfies CollectionBlockType));
	}, [collections]);

	useEffect(() => {
		if (userId) {
			fetchCollections(userId);
		}
	}, [userId, fetchCollections]);

	useEffect(() => {
		useModalStore.setState({
			onModalSuccess: async () => {
				if (userId) {
					await fetchCollections(userId);
				}
			}
		});
	}, [userId, fetchCollections]);

	const handleDeleteCollection = useCallback(async (id: string) => {
		try {
			setIsCollectionSaving(true);
			await deleteCollection(id);
		} catch (error) {
			console.error('Error deleting collection:', error);
			alert(
				error instanceof Error
					? error.message
					: 'Failed to delete collection'
			);
		} finally {
			setIsCollectionSaving(false);
		}
	}, [deleteCollection]);

	const handleUpdateCollection = async (block: Partial<CollectionBlockType>) => {
		if (!userId || !block.collection_id) return;
		try {
			setIsCollectionSaving(true);
			// Find the collection that corresponds to this block
			const collection = collections.find(c => c.id === block.collection_id);
			if (!collection) {
				throw new Error('Collection not found');
			}

			// Update the collection (you'll need to specify what fields should be updated)
			await updateCollection(block.collection_id, {
				// Add the fields you want to update here
				updated_at: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error saving collection:', error);
			alert('Failed to save collection');
		} finally {
			setIsCollectionSaving(false);
		}
	};

	return (
		<div>
			<div className="flex gap-4 mb-4">
				<AddCollectionButton />
			</div>

			<CollectionList
				collections={collectionBlocks}
				onDelete={handleDeleteCollection}
				onUpdate={handleUpdateCollection}
			/>

			{isCollectionSaving && (
				<div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
					Saving changes...
				</div>
			)}
		</div>
	);
}