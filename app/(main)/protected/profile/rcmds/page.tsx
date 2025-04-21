"use client";

import { AddRcmdButton } from "@/components/features/rcmd";
import RCMDBlocks from "@/components/features/rcmd/rcmd-blocks";
import type { RCMD, RCMDBlockType } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useModalStore } from "@/stores/modal-store";
import { useRCMDStore } from "@/stores/rcmd-store";
import { useProfileStore } from "@/stores/profile-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, Settings, Share2 } from "lucide-react";
import Link from "next/link";
import { PageConfigModal } from "@/components/features/profile/modals";
import { ShareModal } from "@/components/common/modals";

export default function RCMDsPage() {
  const [rcmdBlocks, setRCMDBlocks] = useState<RCMDBlockType[]>([]);
  const [isRCMDSaving, setIsRCMDSaving] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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

  // Transform RCMDs to RCMD blocks
  const transformRCMDsToBlocks = useCallback((rcmds: RCMD[]) => {
    return rcmds.map((rcmd) => ({
      id: rcmd.id,
      rcmd_id: rcmd.id,
      profile_block_id: `profile-block-${rcmd.id}`,
      created_at: rcmd.created_at ?? new Date().toISOString(),
      updated_at: rcmd.updated_at ?? new Date().toISOString(),
    }));
  }, []);

  // Fetch RCMDs when userId changes
  useEffect(() => {
    if (userId) {
      fetchRCMDs();
    }
  }, [userId, fetchRCMDs]);

  // Update blocks when RCMDs change
  useEffect(() => {
    setRCMDBlocks(transformRCMDsToBlocks(rcmds));
  }, [rcmds, transformRCMDsToBlocks]);

  // Set up modal success handler
  useEffect(() => {
    useModalStore.setState({
      onModalSuccess: () => {
        if (userId) {
          fetchRCMDs();
        }
      },
    });
  }, [userId, fetchRCMDs]);

  // Handler for saving an RCMD
  const handleSaveRCMD = async (block: Partial<RCMDBlockType>) => {
    if (!block.rcmd_id) return;

    try {
      setIsRCMDSaving(true);

      // Update the RCMD with current timestamp
      await updateRCMD(block.rcmd_id, {
        updated_at: new Date().toISOString(),
      });

      toast.success("RCMD updated successfully");
    } catch (error) {
      console.error("Failed to update RCMD:", error);
      toast.error("Failed to update RCMD");
    } finally {
      setIsRCMDSaving(false);
    }
  };

  // Handler for deleting an RCMD
  const handleDeleteRCMD = async (id: string) => {
    try {
      setIsRCMDSaving(true);

      await deleteRCMD(id);

      // Remove the block from the state
      setRCMDBlocks((prev) => prev.filter((block) => block.id !== id));
      toast.success("RCMD deleted successfully");
    } catch (error) {
      console.error("Failed to delete RCMD:", error);
      toast.error("Failed to delete RCMD");
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
            <>
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
              <Button
                variant="outline"
                size="sm"
                className="gap-1 py-1 h-auto text-sm"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <AddRcmdButton />
      </div>

      <RCMDBlocks
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

      {/* Share modal */}
      {isShareModalOpen && userHandle && (
        <ShareModal
          handle={userHandle}
          path="rcmds"
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}
