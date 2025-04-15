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
import { Eye, Settings } from "lucide-react";
import Link from "next/link";
import { PageConfigModal } from "@/components/features/profile/modals";

export default function CollectionsPage() {
  const [collectionBlocks, setCollectionBlocks] = useState<
    CollectionBlockType[]
  >([]);
  const [isCollectionSaving, setIsCollectionSaving] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const userId = useAuthStore((state) => state.userId);
  const { collections, fetchCollections, deleteCollection, updateCollection } =
    useCollectionStore();
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
    if (userId) {
      fetchCollections();
    }
  }, [userId, fetchCollections]);

  useEffect(() => {
    setCollectionBlocks(transformCollectionsToBlocks(collections));
  }, [collections, transformCollectionsToBlocks]);

  useEffect(() => {
    useModalStore.setState({
      onModalSuccess: () => {
        if (userId) {
          fetchCollections();
        }
      },
    });
  }, [userId, fetchCollections]);

  const handleDeleteCollection = useCallback(
    async (id: string) => {
      toast("Are you sure you want to delete this collection?", {
        duration: Infinity,
        action: {
          label: "Delete",
          onClick: async () => {
            try {
              setIsCollectionSaving(true);
              await deleteCollection(id);
              await fetchCollections();
              toast.success("Collection deleted successfully");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Failed to delete collection"
              );
            } finally {
              setIsCollectionSaving(false);
            }
          },
        },
        cancel: {
          label: "Cancel",
          onClick: () => {
            toast.dismiss();
          },
        },
      });
    },
    [deleteCollection, fetchCollections]
  );

  const handleSaveCollection = async (block: Partial<CollectionBlockType>) => {
    if (!userId || !block.collection_id) return;
    try {
      setIsCollectionSaving(true);
      await updateCollection(block.collection_id, {
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving collection:", error);
      toast.error("Failed to save collection");
    } finally {
      setIsCollectionSaving(false);
    }
  };

  const handleConfigUpdated = () => {
    console.log("[Collections] Config updated, refreshing profile");
    // Refresh profile data to get updated default page settings
    if (userId) {
      fetchProfile(userId);
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
            Configure
          </Button>
          {userHandle && (
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
                Preview Page
              </Link>
            </Button>
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
    </div>
  );
}
