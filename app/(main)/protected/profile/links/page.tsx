"use client";

import { LinkBlocks } from "@/components/features/links";
import { AddLinkButton } from "@/components/features/links";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useLinkStore } from "@/stores/link-store";
import { useProfileStore } from "@/stores/profile-store";
import type { Link, LinkBlockType } from "@/types";
import { useModalStore } from "@/stores/modal-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, Settings } from "lucide-react";
import NextLink from "next/link";
import { PageConfigModal } from "@/components/features/profile/modals";

export default function LinksPage() {
  const [linkBlocks, setLinkBlocks] = useState<LinkBlockType[]>([]);
  const [isLinksSaving, setIsLinksSaving] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const userId = useAuthStore((state) => state.userId);
  const { links, fetchLinks, deleteLink, updateLink } = useLinkStore();
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string>("");

  // Get profile store state and actions
  const { profile, fetchProfile, lastFetchTimestamp } = useProfileStore();

  // Determine if this is the default page
  const isDefaultPage = profile?.default_page_type === "link";

  // Fetch user profile when userId changes or profile is outdated
  useEffect(() => {
    const loadProfileData = async () => {
      if (!userId) return;
      try {
        console.log("[Links] Loading profile for user:", userId);
        await fetchProfile(userId);
      } catch (error) {
        console.error("[Links] Error loading profile:", error);
      }
    };

    loadProfileData();
  }, [userId, fetchProfile]);

  // Extract profile data when profile changes
  useEffect(() => {
    if (profile) {
      console.log("[Links] Profile data updated:", {
        id: profile.id,
        handle: profile.handle,
        defaultPageType: profile.default_page_type,
        isLinksDefault: profile.default_page_type === "link",
      });

      setProfileId(profile.id);
      setUserHandle(profile.handle);
    }
  }, [profile, lastFetchTimestamp]);

  const transformLinksToBlocks = useCallback((links: Link[]) => {
    return links.map((link) => ({
      id: link.id,
      link_id: link.id,
      profile_block_id: `profile-block-${link.id}`,
      created_at: link.created_at ?? new Date().toISOString(),
      updated_at: link.updated_at ?? new Date().toISOString(),
    }));
  }, []);

  useEffect(() => {
    if (userId) {
      fetchLinks();
    }
  }, [userId, fetchLinks]);

  useEffect(() => {
    setLinkBlocks(transformLinksToBlocks(links));
  }, [links, transformLinksToBlocks]);

  useEffect(() => {
    useModalStore.setState({
      onModalSuccess: () => {
        if (userId) {
          fetchLinks();
        }
      },
    });
  }, [userId, fetchLinks]);

  const handleDeleteLink = useCallback(
    async (id: string) => {
      toast("Are you sure you want to delete this link?", {
        duration: Infinity,
        action: {
          label: "Delete",
          onClick: async () => {
            try {
              setIsLinksSaving(true);
              await deleteLink(id);
              await fetchLinks();
              toast.success("Link deleted successfully");
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Failed to delete link"
              );
            } finally {
              setIsLinksSaving(false);
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
    [deleteLink, fetchLinks]
  );

  const handleSaveLink = async (block: Partial<LinkBlockType>) => {
    if (!userId || !block.link_id) return;
    try {
      setIsLinksSaving(true);
      await updateLink(block.link_id, {
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving link:", error);
      toast.error("Failed to save link");
    } finally {
      setIsLinksSaving(false);
    }
  };

  const handleConfigUpdated = () => {
    console.log("[Links] Config updated, refreshing profile");
    // Refresh profile data to get updated default page settings
    if (userId) {
      fetchProfile(userId);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto relative">
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold">Links</h1>
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
              <NextLink
                href={`/${userHandle}/links`}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary"
                target="_blank"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Page
              </NextLink>
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <AddLinkButton />
      </div>

      <LinkBlocks
        initialLinkBlocks={linkBlocks}
        onDelete={handleDeleteLink}
        onSave={handleSaveLink}
      />

      {isLinksSaving && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
          Saving changes...
        </div>
      )}

      {/* Page config modal */}
      <PageConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        pageId={undefined}
        pageType="link"
        isDefault={isDefaultPage}
        profileId={profileId}
        onUpdate={handleConfigUpdated}
      />
    </div>
  );
}
