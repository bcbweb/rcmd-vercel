"use client";

import { AddBlockButton } from "@/components/features/profile";
import { ProfileBlocks } from "@/components/features/profile";
import {
  RcmdBlockModal,
  TextBlockModal,
  ImageBlockModal,
  LinkBlockModal,
  CollectionBlockModal,
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
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export default function CustomProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const supabase = createClient();
  const [blocks, setBlocks] = useState<ProfileBlockType[]>([]);
  const [isBlockSaving, setIsBlockSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileId, setProfileId] = useState<string>("");
  const [pageId, setPageId] = useState<string>("");
  const [pageName, setPageName] = useState<string>("");
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
    async (pageId: string) => {
      if (!pageId) return;

      try {
        setIsBlockSaving(true);
        const { data: blocksData, error: blocksError } = await supabase
          .from("profile_blocks")
          .select("*")
          .eq("page_id", pageId)
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

  // Get profile and page data
  useEffect(() => {
    const getPageData = async () => {
      if (!userId || !slug) return;

      setIsLoading(true);
      try {
        // First get user's profile ID
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", userId)
          .single();

        if (profileError) throw profileError;
        if (!profile) {
          toast.error("Profile not found");
          router.push("/protected/profile");
          return;
        }

        setProfileId(profile.id);

        // Now get the page details using the slug
        const { data: page, error: pageError } = await supabase
          .from("profile_pages")
          .select("*")
          .eq("profile_id", profile.id)
          .eq("slug", slug)
          .single();

        if (pageError) {
          console.error("Error fetching page:", pageError);
          toast.error("Page not found");
          router.push("/protected/profile");
          return;
        }

        if (!page) {
          toast.error("Page not found");
          router.push("/protected/profile");
          return;
        }

        setPageId(page.id);
        setPageName(page.name);

        // Fetch blocks for this page
        await refreshBlocks(page.id);
      } catch (error) {
        console.error("Error fetching page data:", error);
        toast.error("Failed to load page");
        router.push("/protected/profile");
      } finally {
        setIsLoading(false);
      }
    };

    // Reset page data when slug changes
    setBlocks([]);
    setPageId("");
    setPageName("");

    getPageData();
  }, [userId, slug, supabase, refreshBlocks, router]);

  useEffect(() => {
    if (profileId) {
      fetchCollections(profileId);
      fetchLinks(profileId);
      fetchRCMDs(profileId);
    }
  }, [profileId, fetchCollections, fetchLinks, fetchRCMDs]);

  const moveBlock = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      if (!blocks.length || dragIndex < 0 || hoverIndex < 0) return;

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

        const { error } = await supabase.rpc("reorder_profile_blocks", {
          p_profile_id: profileId,
          p_block_id: blockId,
          p_new_order: newOrder,
        });

        if (error) throw error;

        const { data: updatedBlocks, error: fetchError } = await supabase
          .from("profile_blocks")
          .select("*")
          .eq("page_id", pageId)
          .order("display_order", { ascending: true });

        if (fetchError) throw fetchError;

        if (updatedBlocks) {
          setBlocks(updatedBlocks);
        }
      } catch (error) {
        console.error("Error moving block:", error);
        toast.error("Failed to update block order");

        // Reset to original order
        refreshBlocks(pageId);
      } finally {
        setIsBlockSaving(false);
      }
    },
    [blocks, supabase, profileId, pageId, refreshBlocks]
  );

  // Replaced by specific handlers for each block type
  // const handleBlockAdded = useCallback(async () => {
  //   if (!pageId) return;
  //   setIsBlockSaving(true);
  //   try {
  //     await refreshBlocks(pageId);
  //     setIsRCMDBlockModalOpen(false);
  //     setIsTextBlockModalOpen(false);
  //     setIsImageBlockModalOpen(false);
  //     setIsLinkBlockModalOpen(false);
  //     setIsCollectionBlockModalOpen(false);
  //   } finally {
  //     setIsBlockSaving(false);
  //   }
  // }, [
  //   pageId,
  //   refreshBlocks,
  //   setIsRCMDBlockModalOpen,
  //   setIsTextBlockModalOpen,
  //   setIsImageBlockModalOpen,
  //   setIsLinkBlockModalOpen,
  //   setIsCollectionBlockModalOpen,
  // ]);

  // Custom onSuccess handlers for each modal that include pageId
  const handleRCMDBlockAdded = useCallback(async () => {
    if (!pageId) return;
    await refreshBlocks(pageId);
    setIsRCMDBlockModalOpen(false);
  }, [pageId, refreshBlocks, setIsRCMDBlockModalOpen]);

  const handleTextBlockAdded = useCallback(async () => {
    if (!pageId) return;
    await refreshBlocks(pageId);
    setIsTextBlockModalOpen(false);
  }, [pageId, refreshBlocks, setIsTextBlockModalOpen]);

  const handleImageBlockAdded = useCallback(async () => {
    if (!pageId) return;
    await refreshBlocks(pageId);
    setIsImageBlockModalOpen(false);
  }, [pageId, refreshBlocks, setIsImageBlockModalOpen]);

  const handleLinkBlockAdded = useCallback(async () => {
    if (!pageId) return;
    await refreshBlocks(pageId);
    setIsLinkBlockModalOpen(false);
  }, [pageId, refreshBlocks, setIsLinkBlockModalOpen]);

  const handleCollectionBlockAdded = useCallback(async () => {
    if (!pageId) return;
    await refreshBlocks(pageId);
    setIsCollectionBlockModalOpen(false);
  }, [pageId, refreshBlocks, setIsCollectionBlockModalOpen]);

  const handleDeleteBlock = useCallback(
    async (id: string) => {
      toast("Are you sure you want to delete this block?", {
        duration: Infinity,
        action: {
          label: "Delete",
          onClick: async () => {
            try {
              setIsBlockSaving(true);
              setBlocks((prev) => prev.filter((b) => b.id !== id));

              const { error } = await supabase
                .from("profile_blocks")
                .delete()
                .eq("id", id);

              if (error) throw error;
              toast.success("Block deleted successfully");
            } catch (error) {
              console.error("Error deleting block:", error);
              toast.error("Failed to delete block");

              // Refresh blocks to restore state if deletion failed
              if (pageId) {
                refreshBlocks(pageId);
              }
            } finally {
              setIsBlockSaving(false);
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
    [supabase, pageId, refreshBlocks]
  );

  if (!userId) {
    router.push("/sign-in");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold border-b pb-4 mb-4 text-center">
            {pageName}
          </h1>
          <div className="flex justify-end mb-3">
            <AddBlockButton />
          </div>
        </div>

        <ProfileBlocks
          blocks={blocks}
          onMove={moveBlock}
          onDelete={handleDeleteBlock}
        />

        {isBlockSaving && (
          <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2 z-50">
            Saving changes...
          </div>
        )}

        {isRCMDBlockModalOpen && (
          <RcmdBlockModal
            profileId={profileId}
            onSuccess={handleRCMDBlockAdded}
          />
        )}

        {isTextBlockModalOpen && (
          <TextBlockModal
            profileId={profileId}
            onSuccess={handleTextBlockAdded}
          />
        )}

        {isImageBlockModalOpen && (
          <ImageBlockModal
            profileId={profileId}
            onSuccess={handleImageBlockAdded}
          />
        )}

        {isLinkBlockModalOpen && (
          <LinkBlockModal
            profileId={profileId}
            onSuccess={handleLinkBlockAdded}
          />
        )}

        {isCollectionBlockModalOpen && (
          <CollectionBlockModal
            profileId={profileId}
            onSuccess={handleCollectionBlockAdded}
          />
        )}
      </div>
    </DndProvider>
  );
}
