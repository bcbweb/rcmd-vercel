"use client";

import { AddBlockButton } from "@/components/features/profile";
import { ProfileBlocks } from "@/components/features/profile";
import {
  RcmdBlockModal,
  TextBlockModal,
  ImageBlockModal,
  LinkBlockModal,
  CollectionBlockModal,
  PageConfigModal,
} from "@/components/features/profile/modals";
import { createClient } from "@/utils/supabase/client";
import type { ProfileBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";
import { toast } from "sonner";
import { useCollectionStore } from "@/stores/collection-store";
import { useLinkStore } from "@/stores/link-store";
import { useRCMDStore } from "@/stores/rcmd-store";
import { Button } from "@/components/ui/button";
import { Eye, Settings } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const supabase = createClient();
  const [blocks, setBlocks] = useState<ProfileBlockType[]>([]);
  const [isBlockSaving, setIsBlockSaving] = useState(false);
  const [profileId, setProfileId] = useState<string>("");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDefaultPage, setIsDefaultPage] = useState(false);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const userId = useAuthStore((state) => state.userId);
  const {
    isRCMDBlockModalOpen,
    setIsRCMDBlockModalOpen,
    isTextBlockModalOpen,
    setIsTextBlockModalOpen,
    isImageBlockModalOpen,
    setIsImageBlockModalOpen,
    isLinkBlockModalOpen,
    setIsLinkBlockModalOpen,
    isCollectionBlockModalOpen,
    setIsCollectionBlockModalOpen,
  } = useModalStore();
  const fetchCollections = useCollectionStore(
    (state) => state.fetchCollections
  );
  const fetchLinks = useLinkStore((state) => state.fetchLinks);
  const fetchRCMDs = useRCMDStore((state) => state.fetchRCMDs);

  // Define refreshBlocks function first
  const refreshBlocks = useCallback(
    async (profileId: string) => {
      if (!profileId) return;

      try {
        setIsBlockSaving(true);
        const { data: blocksData, error: blocksError } = await supabase
          .from("profile_blocks")
          .select("*")
          .eq("profile_id", profileId)
          .order("display_order", { ascending: true });

        if (blocksError) throw blocksError;
        setBlocks(blocksData || []);
      } catch (error) {
        console.error("Error refreshing blocks:", error);
        toast.error("Failed to refresh blocks");
      } finally {
        setIsBlockSaving(false);
      }
    },
    [supabase]
  );

  // Get profile ID
  useEffect(() => {
    const getProfileData = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, handle, default_page_type, default_page_id")
          .eq("auth_user_id", userId)
          .single();

        let profileData = null;

        if (error && error.message.includes("does not exist")) {
          // If the columns don't exist yet, fall back to just getting id and handle
          console.log(
            "Default page columns not available yet, fetching basic profile data"
          );
          const { data: basicData, error: basicError } = await supabase
            .from("profiles")
            .select("id, handle")
            .eq("auth_user_id", userId)
            .single();

          if (basicError) throw basicError;
          profileData = {
            ...basicData,
            default_page_type: undefined,
            default_page_id: undefined,
          };
        } else if (error) {
          throw error;
        } else {
          // No error, use the data from the first query
          profileData = data;
        }

        if (profileData) {
          setUserHandle(profileData.handle || null);
          setProfileId(profileData.id);
          // Check if this is the default page only if the columns exist
          if (profileData.default_page_type !== undefined) {
            setIsDefaultPage(
              profileData.default_page_type === "custom" &&
                profileData.default_page_id === null
            );
          } else {
            // Assume it's not the default page if we don't have that data
            setIsDefaultPage(false);
          }
          refreshBlocks(profileData.id);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to fetch profile data");
      }
    };

    getProfileData();

    // Set up real-time subscription to listen for profile changes
    if (userId) {
      const supabase = createClient();
      const subscription = supabase
        .channel("profile-default-changes-main")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `auth_user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Profile update received in main page:", payload);
            if (payload.new) {
              const { default_page_type, default_page_id } = payload.new;
              // Update the default page status
              setIsDefaultPage(
                default_page_type === "custom" && default_page_id === null
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [userId, supabase, refreshBlocks]);

  useEffect(() => {
    if (profileId) {
      fetchCollections(profileId);
      fetchLinks(profileId);
      fetchRCMDs(profileId);
    }
  }, [profileId, fetchCollections, fetchLinks, fetchRCMDs]);

  const moveBlock = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      try {
        setIsBlockSaving(true);

        setBlocks((prevBlocks) => {
          const newBlocks = [...prevBlocks];
          const [removed] = newBlocks.splice(dragIndex, 1);
          newBlocks.splice(hoverIndex, 0, removed);
          return newBlocks;
        });

        const newOrder = hoverIndex + 1;
        const blockId = blocks[dragIndex].id;
        const profileId = blocks[dragIndex].profile_id;

        const { error } = await supabase.rpc("reorder_profile_blocks", {
          p_profile_id: profileId,
          p_block_id: blockId,
          p_new_order: newOrder,
        });

        if (error) throw error;

        const { data: updatedBlocks, error: fetchError } = await supabase
          .from("profile_blocks")
          .select("*")
          .eq("profile_id", profileId)
          .order("display_order", { ascending: true });

        if (fetchError) throw fetchError;

        if (updatedBlocks) {
          setBlocks(updatedBlocks);
        }
      } catch (error) {
        console.error("Error moving block:", error);
        toast.error("Failed to update block order");

        const { data: originalBlocks } = await supabase
          .from("profile_blocks")
          .select("*")
          .eq("profile_id", blocks[dragIndex].profile_id)
          .order("display_order", { ascending: true });

        if (originalBlocks) {
          setBlocks(originalBlocks);
        }
      } finally {
        setIsBlockSaving(false);
      }
    },
    [blocks, supabase]
  );

  const handleBlockAdded = useCallback(async () => {
    if (!profileId) return;
    setIsBlockSaving(true);
    try {
      await refreshBlocks(profileId);
      setIsRCMDBlockModalOpen(false);
      setIsTextBlockModalOpen(false);
      setIsImageBlockModalOpen(false);
      setIsLinkBlockModalOpen(false);
      setIsCollectionBlockModalOpen(false);
    } finally {
      setIsBlockSaving(false);
    }
  }, [
    profileId,
    refreshBlocks,
    setIsRCMDBlockModalOpen,
    setIsTextBlockModalOpen,
    setIsImageBlockModalOpen,
    setIsLinkBlockModalOpen,
    setIsCollectionBlockModalOpen,
  ]);

  const handleDeleteBlock = useCallback(
    async (id: string) => {
      try {
        setIsBlockSaving(true);
        setBlocks((prev) => prev.filter((b) => b.id !== id));

        const { error } = await supabase
          .from("profile_blocks")
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (error) {
        console.error("Error deleting block:", error);
        toast.error("Failed to delete block");
      } finally {
        setIsBlockSaving(false);
      }
    },
    [supabase]
  );

  if (!userId) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-screen-xl mx-auto relative">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold mx-auto">Custom Pages</h1>
          <div className="absolute right-0 flex space-x-2">
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
              <Button
                variant="outline"
                size="sm"
                className="gap-1 py-1 h-auto text-sm"
                asChild
              >
                <Link
                  href={`/${userHandle}/pages`}
                  className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary"
                  target="_blank"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview Page</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <AddBlockButton />
        </div>

        <ProfileBlocks
          blocks={blocks}
          onMove={moveBlock}
          onDelete={handleDeleteBlock}
        />

        {isBlockSaving && (
          <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2">
            Saving changes...
          </div>
        )}

        {isRCMDBlockModalOpen && (
          <RcmdBlockModal profileId={profileId} onSuccess={handleBlockAdded} />
        )}

        {isTextBlockModalOpen && (
          <TextBlockModal profileId={profileId} onSuccess={handleBlockAdded} />
        )}

        {isImageBlockModalOpen && (
          <ImageBlockModal profileId={profileId} onSuccess={handleBlockAdded} />
        )}

        {isLinkBlockModalOpen && (
          <LinkBlockModal profileId={profileId} onSuccess={handleBlockAdded} />
        )}

        {isCollectionBlockModalOpen && (
          <CollectionBlockModal
            profileId={profileId}
            onSuccess={handleBlockAdded}
          />
        )}

        {/* Page config modal */}
        <PageConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          pageType="custom"
          isDefault={isDefaultPage}
          profileId={profileId}
        />
      </div>
    </DndProvider>
  );
}
