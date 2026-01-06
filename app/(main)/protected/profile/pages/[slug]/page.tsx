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
import { useCallback, useEffect, useState, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, Settings } from "lucide-react";

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
  const [handle, setHandle] = useState<string>("");
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
  const [isPageConfigOpen, setIsPageConfigOpen] = useState(false);
  const [isDefaultPage, setIsDefaultPage] = useState(false);

  // Track if we're currently fetching to avoid duplicate fetches
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Refs to store IDs without causing re-renders
  const pageIdRef = useRef<string>("");
  const profileIdRef = useRef<string>("");

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

      // Don't allow multiple simultaneous fetches
      if (isFetchingRef.current) {
        return;
      }

      // Debounce fetches to prevent rapid consecutive calls
      const now = Date.now();
      if (now - lastFetchTimeRef.current < 2000) {
        return;
      }

      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      setIsLoading(true);

      try {
        // First get user's profile ID
        try {
          // First try to fetch with the new columns
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("id, handle, default_page_type, default_page_id")
            .eq("auth_user_id", userId)
            .single();

          let profileData = null;

          if (error && error.message.includes("does not exist")) {
            // If the columns don't exist yet, fall back to just getting id and handle
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
            profileData = profile;
          }

          if (!profileData) {
            toast.error("Profile not found");
            router.push("/protected/profile");
            return;
          }

          setProfileId(profileData.id);
          profileIdRef.current = profileData.id;
          setHandle(profileData.handle || "");

          // Now get the page details using the slug
          const { data: page, error: pageError } = await supabase
            .from("profile_pages")
            .select("*")
            .eq("profile_id", profileData.id)
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
          pageIdRef.current = page.id;
          setPageName(page.name);

          // Check if this is the default page only if the columns exist
          if (profileData.default_page_type !== undefined) {
            setIsDefaultPage(
              profileData.default_page_type === "custom" &&
                profileData.default_page_id === page.id
            );
          } else {
            // Assume it's not a default page if we don't have that data
            setIsDefaultPage(false);
          }

          // Fetch blocks for this page
          await refreshBlocks(page.id);
        } catch (error) {
          console.error("Error fetching page data:", error);
          toast.error("Failed to load page");
          router.push("/protected/profile");
        }
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    // Reset page data when slug changes
    setBlocks([]);
    setPageId("");
    pageIdRef.current = "";
    setPageName("");

    getPageData();

    // Set up real-time subscriptions
    if (userId) {
      const supabase = createClient();

      // Use a separate function for the checkDefaultPageStatus logic that uses refs
      const checkDefaultPageStatus = async (
        profileIdValue: string,
        pageIdValue: string
      ) => {
        if (!profileIdValue || !pageIdValue) return;

        try {
          const { data } = await supabase
            .from("profiles")
            .select("default_page_type, default_page_id")
            .eq("id", profileIdValue)
            .single();

          if (data) {
            const isDefault =
              data.default_page_type === "custom" &&
              data.default_page_id === pageIdValue;
            setIsDefaultPage(isDefault);
          }
        } catch (error) {
          console.error("Error checking default page status:", error);
        }
      };

      // Set up subscription for changes to this page
      const pageSubscription = supabase
        .channel("page-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profile_pages",
            filter: `id=eq.${pageIdRef.current}`, // Use the page ID to filter
          },
          ({ new: newData }) => {
            if (newData) {
              // Update the page name if it changed
              setPageName(newData.name);
              // Also refresh blocks in case display order changed
              if (pageIdRef.current) {
                refreshBlocks(pageIdRef.current);
              }
            }
          }
        )
        .subscribe();

      // Set up subscription for changes to the profile (for default page changes)
      const profileSubscription = supabase
        .channel("profile-default-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${profileIdRef.current}`, // Use the profile ID to filter
          },
          () => {
            // When profile updates, check if this page is still the default
            if (pageIdRef.current && profileIdRef.current) {
              checkDefaultPageStatus(profileIdRef.current, pageIdRef.current);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(pageSubscription);
        supabase.removeChannel(profileSubscription);
      };
    }
  }, [userId, supabase, refreshBlocks, router, slug]);

  // Update the refs when state changes
  useEffect(() => {
    if (pageId) pageIdRef.current = pageId;
  }, [pageId]);

  useEffect(() => {
    if (profileId) profileIdRef.current = profileId;
  }, [profileId]);

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
      <div className="max-w-screen-xl mx-auto relative">
        <div className="mb-8">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold">{pageName}</h1>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 py-1 h-auto text-sm"
                onClick={() => setIsPageConfigOpen(true)}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Configure</span>
              </Button>
              {handle && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 py-1 h-auto text-sm"
                  asChild
                >
                  <Link
                    href={`/${handle}/${slug}`}
                    className="flex items-center space-x-1 text-sm"
                    target="_blank"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Preview Page</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <div className="mb-6">
            <div className="flex justify-start items-center mb-3">
              <AddBlockButton />
            </div>
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
            pageId={pageId}
            onSuccess={handleRCMDBlockAdded}
          />
        )}

        {isTextBlockModalOpen && (
          <TextBlockModal
            profileId={profileId}
            pageId={pageId}
            onSuccess={handleTextBlockAdded}
          />
        )}

        {isImageBlockModalOpen && (
          <ImageBlockModal
            profileId={profileId}
            pageId={pageId}
            onSuccess={handleImageBlockAdded}
          />
        )}

        {isLinkBlockModalOpen && (
          <LinkBlockModal
            profileId={profileId}
            pageId={pageId}
            onSuccess={handleLinkBlockAdded}
          />
        )}

        {isCollectionBlockModalOpen && (
          <CollectionBlockModal
            profileId={profileId}
            pageId={pageId}
            onSuccess={handleCollectionBlockAdded}
          />
        )}

        {/* Page config modal */}
        <PageConfigModal
          isOpen={isPageConfigOpen}
          onClose={() => setIsPageConfigOpen(false)}
          pageId={pageId}
          pageType="custom"
          pageName={pageName}
          isDefault={isDefaultPage}
          profileId={profileId}
          onUpdate={async () => {
            setIsPageConfigOpen(false);

            // Create a new supabase client for this request
            const supabase = createClient();

            try {
              // Refetch the page details to get the updated name
              if (pageId) {
                const { data: page, error: pageError } = await supabase
                  .from("profile_pages")
                  .select("*")
                  .eq("id", pageId)
                  .single();

                if (pageError) throw pageError;
                if (page) {
                  // Update page name without a refresh
                  setPageName(page.name);

                  // Update the URL slug if it has changed, but only if necessary
                  if (page.slug !== slug) {
                    // Use replace instead of push to avoid browser history stack issues
                    router.replace(`/protected/profile/pages/${page.slug}`);
                  }
                }

                // Check if default status changed
                if (profileId) {
                  const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("default_page_type, default_page_id")
                    .eq("id", profileId)
                    .single();

                  if (profileError) throw profileError;
                  if (profile) {
                    setIsDefaultPage(
                      profile.default_page_type === "custom" &&
                        profile.default_page_id === pageId
                    );
                  }
                }

                // If this page's blocks need to be refreshed, do that
                refreshBlocks(pageId);

                toast.success("Page settings updated successfully");
              }
            } catch (error) {
              console.error("Error refreshing page data:", error);
              toast.error("Error refreshing page data");
            }
          }}
        />
      </div>
    </DndProvider>
  );
}
