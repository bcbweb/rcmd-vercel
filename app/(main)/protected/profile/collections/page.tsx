// page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";
import { useCollectionStore } from "@/stores/collection-store";
import { useProfileStore } from "@/stores/profile-store";
import {
  AddCollectionButton,
  CollectionBlocks,
} from "@/components/features/collections";
import type { Collection, CollectionBlockType } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, Settings, Share2 } from "lucide-react";
import Link from "next/link";
import { PageConfigModal } from "@/components/features/profile/modals";
import { ShareModal } from "@/components/common/modals";

export default function CollectionsPage() {
  const [collectionBlocks, setCollectionBlocks] = useState<
    CollectionBlockType[]
  >([]);
  const [isCollectionSaving, setIsCollectionSaving] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const userId = useAuthStore((state) => state.userId);
  const {
    collections,
    fetchCollections,
    deleteCollection,
    updateCollection,
    reorderCollections,
  } = useCollectionStore();
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string>("");

  // Get profile store state and actions
  const { profile, fetchProfile, lastFetchTimestamp } = useProfileStore();

  // Determine if this is the default page
  const isDefaultPage = profile?.default_page_type === "collection";

  // Fetch user profile when userId changes or profile is outdated
  useEffect(() => {
    const loadProfileData = async () => {
      if (!userId) return;
      try {
        console.log("[Collections] Loading profile for user:", userId);
        await fetchProfile(userId);
      } catch (error) {
        console.error("[Collections] Error loading profile:", error);
      }
    };

    loadProfileData();
  }, [userId, fetchProfile]);

  // Extract profile data when profile changes
  useEffect(() => {
    if (profile) {
      console.log("[Collections] Profile data updated:", {
        id: profile.id,
        handle: profile.handle,
        defaultPageType: profile.default_page_type,
        isCollectionsDefault: profile.default_page_type === "collection",
      });

      setProfileId(profile.id);
      setUserHandle(profile.handle);
    }
  }, [profile, lastFetchTimestamp]);

  const transformCollectionsToBlocks = useCallback(
    (collections: Collection[]) => {
      return collections.map((collection) => ({
        id: collection.id,
        collection_id: collection.id,
        profile_block_id: `profile-block-${collection.id}`,
        created_at: collection.created_at ?? new Date().toISOString(),
        updated_at: collection.updated_at ?? new Date().toISOString(),
      }));
    },
    []
  );

  useEffect(() => {
    if (userId && profileId) {
      console.log("[DEBUG] Fetching collections for profileId:", profileId);
      fetchCollections(userId, profileId);
    } else if (userId) {
      console.log("[DEBUG] Fetching collections for userId:", userId);
      fetchCollections(userId);
    }
  }, [userId, profileId, fetchCollections]);

  useEffect(() => {
    setCollectionBlocks(transformCollectionsToBlocks(collections));
  }, [collections, transformCollectionsToBlocks]);

  useEffect(() => {
    useModalStore.setState({
      onModalSuccess: () => {
        if (userId) {
          if (profileId) {
            fetchCollections(userId, profileId);
          } else {
            fetchCollections(userId);
          }
        }
      },
    });
  }, [userId, fetchCollections]);

  // Handle collection deletion
  const handleDeleteCollection = async (id: string) => {
    try {
      setIsCollectionSaving(true);
      await deleteCollection(id);

      // Remove the block locally
      setCollectionBlocks((prev) => prev.filter((block) => block.id !== id));
      toast.success("Collection deleted successfully");
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    } finally {
      setIsCollectionSaving(false);
    }
  };

  // Handle collection save/update
  const handleSaveCollection = async (block: Partial<CollectionBlockType>) => {
    if (!block.collection_id) return;

    try {
      setIsCollectionSaving(true);
      await updateCollection(block.collection_id, {
        updated_at: new Date().toISOString(),
      });
      toast.success("Collection updated successfully");
    } catch (error) {
      console.error("Error saving collection:", error);
      toast.error("Failed to save collection");
    } finally {
      setIsCollectionSaving(false);
    }
  };

  const handleConfigUpdated = () => {
    // Refresh profile data to get updated default page settings
    if (userId) {
      fetchProfile(userId);
    }
  };

  // Handler for reordering collections
  const handleMoveCollection = async (
    dragIndex: number,
    hoverIndex: number
  ) => {
    if (!collectionBlocks.length || dragIndex < 0 || hoverIndex < 0) return;

    try {
      setIsCollectionSaving(true);

      const draggedBlock = collectionBlocks[dragIndex];
      if (!draggedBlock?.collection_id) return;

      // Calculate new order (1-indexed)
      const newOrder = hoverIndex + 1;

      // Call the reorder function
      await reorderCollections(
        draggedBlock.collection_id,
        newOrder,
        profileId || undefined,
        userId ? userId : undefined
      );

      // Refetch to get updated order
      if (profileId) {
        await fetchCollections(userId || undefined, profileId);
      } else {
        await fetchCollections(userId || undefined);
      }
    } catch (error) {
      console.error("Error reordering collection:", error);
      toast.error("Failed to reorder collection");
      // Refetch to restore original order
      if (profileId) {
        await fetchCollections(userId || undefined, profileId);
      } else {
        await fetchCollections(userId || undefined);
      }
    } finally {
      setIsCollectionSaving(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto relative">
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold">Collections</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 py-1 h-auto text-sm"
            onClick={() => setIsConfigModalOpen(true)}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configure</span>
          </Button>
          {userHandle && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 py-1 h-auto text-sm"
                asChild
              >
                <Link
                  href={`/${userHandle}/collections`}
                  className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary"
                  target="_blank"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview Page</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 py-1 h-auto text-sm"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <AddCollectionButton />
      </div>

      <CollectionBlocks
        initialCollectionBlocks={collectionBlocks}
        onDelete={handleDeleteCollection}
        onSave={handleSaveCollection}
        onMove={handleMoveCollection}
      />

      {isCollectionSaving && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
          Saving changes...
        </div>
      )}

      {/* Page config modal */}
      <PageConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        pageId={undefined}
        pageType="collection"
        isDefault={isDefaultPage}
        profileId={profileId}
        onUpdate={handleConfigUpdated}
      />

      {/* Share modal */}
      {isShareModalOpen && userHandle && (
        <ShareModal
          handle={userHandle}
          path="collections"
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}
