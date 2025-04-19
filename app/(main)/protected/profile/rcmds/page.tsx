"use client";

import { AddRcmdButton, RcmdBlocks } from "@/components/features/rcmd";
import type { RCMD, RCMDBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";
import { useRCMDStore } from "@/stores/rcmd-store";
import { useProfileStore } from "@/stores/profile-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, Settings } from "lucide-react";
import Link from "next/link";
import { PageConfigModal } from "@/components/features/profile/modals";

export default function RCMDsPage() {
  const [rcmdBlocks, setRCMDBlocks] = useState<RCMDBlockType[]>([]);
  const [isRCMDSaving, setIsRCMDSaving] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const userId = useAuthStore((state) => state.userId);
  const { rcmds, fetchRCMDs, deleteRCMD, updateRCMD } = useRCMDStore();
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string>("");

  // Get profile store state and actions
  const { profile, fetchProfile, lastFetchTimestamp } = useProfileStore();

  // Determine if this is the default page
  const isDefaultPage = profile?.default_page_type === "rcmd";

  // Fetch user profile when userId changes or profile is outdated
  useEffect(() => {
    const loadProfileData = async () => {
      if (!userId) return;
      try {
        await fetchProfile(userId);
      } catch (error) {
        console.error("[RCMDs] Error loading profile:", error);
      }
    };

    loadProfileData();
  }, [userId, fetchProfile]);

  // Extract profile data when profile changes
  useEffect(() => {
    if (profile) {
      setProfileId(profile.id);
      setUserHandle(profile.handle);
    }
  }, [profile, lastFetchTimestamp]);

  const transformRCMDsToBlocks = useCallback((rcmds: RCMD[]) => {
    return rcmds.map((rcmd) => ({
      id: rcmd.id,
      rcmd_id: rcmd.id,
      profile_block_id: `profile-block-${rcmd.id}`,
      created_at: rcmd.created_at ?? new Date().toISOString(),
      updated_at: rcmd.updated_at ?? new Date().toISOString(),
    }));
  }, []);

  useEffect(() => {
    if (userId) {
      fetchRCMDs();
    }
  }, [userId, fetchRCMDs]);

  useEffect(() => {
    setRCMDBlocks(transformRCMDsToBlocks(rcmds));
  }, [rcmds, transformRCMDsToBlocks]);

  useEffect(() => {
    useModalStore.setState({
      onModalSuccess: () => {
        if (userId) {
          fetchRCMDs();
        }
      },
    });
  }, [userId, fetchRCMDs]);

  const handleDeleteRCMD = useCallback(
    async (id: string) => {
      toast("Are you sure you want to delete this RCMD?", {
        duration: Infinity,
        action: {
          label: "Delete",
          onClick: async () => {
            try {
              setIsRCMDSaving(true);
              await deleteRCMD(id);
              await fetchRCMDs();
              toast.success("RCMD deleted successfully");
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Failed to delete RCMD"
              );
            } finally {
              setIsRCMDSaving(false);
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
    [deleteRCMD, fetchRCMDs]
  );

  const handleSaveRCMD = async (block: Partial<RCMDBlockType>) => {
    if (!userId || !block.rcmd_id) return;
    try {
      setIsRCMDSaving(true);
      await updateRCMD(block.rcmd_id, {
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving RCMD:", error);
      toast.error("Failed to save RCMD");
    } finally {
      setIsRCMDSaving(false);
    }
  };

  const handleConfigUpdated = () => {
    // Refresh profile data to get updated default page settings
    if (userId) {
      fetchProfile(userId);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto relative">
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold">RCMDs</h1>
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
                href={`/${userHandle}/rcmds`}
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
        <AddRcmdButton />
      </div>

      <RcmdBlocks
        initialRCMDBlocks={rcmdBlocks}
        onDelete={handleDeleteRCMD}
        onSave={handleSaveRCMD}
      />

      {isRCMDSaving && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2">
          Saving changes...
        </div>
      )}

      {/* Page config modal */}
      <PageConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        pageId={undefined}
        pageType="rcmd"
        isDefault={isDefaultPage}
        profileId={profileId}
        onUpdate={handleConfigUpdated}
      />
    </div>
  );
}
