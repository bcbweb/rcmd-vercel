"use client";

import { AddLinkButton, LinkBlocks } from "@/components/features/links";
import type { Link, LinkBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";
import { useLinkStore } from "@/stores/link-store";
import { toast } from "sonner";

export default function LinksPage() {
  const [linkBlocks, setLinkBlocks] = useState<LinkBlockType[]>([]);
  const [isLinkSaving, setIsLinkSaving] = useState(false);
  const userId = useAuthStore((state) => state.userId);
  const { links, fetchLinks, deleteLink, updateLink } = useLinkStore();

  const transformLinksToBlocks = useCallback((links: Link[]) => {
    return links.map((link) => ({
      id: link.id,
      link_id: link.id,
      profile_block_id: `profile-block-${link.id}`,
      created_at: link.created_at,
      updated_at: link.updated_at,
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
      toast(
        "Are you sure you want to delete this link? Any associated profile blocks and collection items will also be deleted.",
        {
          duration: Infinity,
          action: {
            label: "Delete",
            onClick: async () => {
              try {
                setIsLinkSaving(true);
                await deleteLink(id);
                await fetchLinks();
                toast.success("Link deleted successfully");
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to delete link"
                );
              } finally {
                setIsLinkSaving(false);
              }
            },
          },
          cancel: {
            label: "Cancel",
            onClick: () => {
              toast.dismiss();
            },
          },
        }
      );
    },
    [deleteLink, fetchLinks]
  );

  const handleSaveLink = async (block: Partial<LinkBlockType>) => {
    if (!userId || !block.link_id) return;
    try {
      setIsLinkSaving(true);
      await updateLink(block.link_id, {
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving link:", error);
      toast.error("Failed to save link");
    } finally {
      setIsLinkSaving(false);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <AddLinkButton />
      </div>

      <LinkBlocks
        initialLinkBlocks={linkBlocks}
        onDelete={handleDeleteLink}
        onSave={handleSaveLink}
      />

      {isLinkSaving && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
          Saving changes...
        </div>
      )}
    </div>
  );
}
