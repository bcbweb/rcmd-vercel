"use client";

import { RCMD } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useBlockStore } from "@/stores/block-store";
import { useModalStore } from "@/stores/modal-store";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface RcmdBlockModalProps {
  profileId: string;
  pageId?: string;
  onSuccess?: () => void;
}

export default function RcmdBlockModal({
  profileId,
  pageId,
  onSuccess,
}: RcmdBlockModalProps) {
  const { saveRCMDBlock, isLoading: isSaving, error } = useBlockStore();
  const [selectedRcmdId, setSelectedRcmdId] = useState("");
  const [rcmds, setRcmds] = useState<RCMD[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const { setIsRCMDBlockModalOpen, setIsRCMDModalOpen, setOnModalSuccess } =
    useModalStore();

  const fetchRcmds = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        console.error("No user found");
        return;
      }

      console.log("Fetching RCMDs in modal for user:", user.id);

      const { data, error } = await supabase
        .from("rcmds")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error fetching RCMDs:", error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} RCMDs in modal`);
      setRcmds(data || []);
    } catch (error) {
      console.error("Error fetching RCMDs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    console.log("RcmdBlockModal mounted, fetching RCMDs...");
    fetchRcmds();
  }, [fetchRcmds]);

  const handleSave = async () => {
    if (!selectedRcmdId) {
      toast.error("Please select an RCMD first");
      return;
    }

    try {
      console.log("Attempting to save RCMD block with:", {
        profileId,
        rcmdId: selectedRcmdId,
        pageId: pageId || "not provided",
      });

      const success = await saveRCMDBlock(profileId, selectedRcmdId, pageId);

      if (success) {
        toast.success("RCMD block added successfully");
        onSuccess?.();
        setIsRCMDBlockModalOpen(false);
      } else if (error) {
        console.error("Block store reported error:", error);
        throw new Error(error);
      } else {
        throw new Error("Failed to save RCMD block (unknown error)");
      }
    } catch (err) {
      console.error("Error in handleSave:", err);

      // More helpful error message based on the error
      let errorMessage = "Failed to save RCMD block";

      if (err instanceof Error) {
        errorMessage = err.message;

        // Custom handling for common errors
        if (errorMessage.includes("page") && errorMessage.includes("first")) {
          errorMessage =
            "You need to create a page before adding blocks. Please go to your profile settings to create a page.";
        } else if (
          errorMessage.includes("not-null constraint") ||
          errorMessage.includes("null value")
        ) {
          errorMessage =
            "Missing required information. Please make sure you have at least one profile page.";
        } else if (errorMessage.includes("found")) {
          errorMessage =
            "The RPC function is not available. Please make sure to apply the SQL migration.";
        }
      }

      toast.error(errorMessage, {
        duration: 5000,
      });
    }
  };

  const handleClose = () => {
    setIsRCMDBlockModalOpen(false);
  };

  const handleAddNewClick = () => {
    // Set up the callback to refresh RCMDs after successful creation
    setOnModalSuccess(() => {
      fetchRcmds();
    });

    // Open the RCMD creation modal
    setIsRCMDModalOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 
                dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 
                rounded-full transition-colors"
              aria-label="Back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-left"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold flex-1 text-center">
              Select RCMD
            </h2>
            <div className="w-8"></div> {/* Empty spacer for balance */}
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddNewClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg
                hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 
                disabled:cursor-not-allowed"
              disabled={isLoading || isSaving}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-plus-circle"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
              <span>New RCMD</span>
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : rcmds.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No RCMDs found. Please add some RCMDs first.
              </div>
            ) : (
              rcmds.map((rcmd) => (
                <div
                  key={rcmd.id}
                  className={`p-4 border rounded-lg mb-2 cursor-pointer transition-colors
                    ${
                      selectedRcmdId === rcmd.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                    }`}
                  onClick={() => setSelectedRcmdId(rcmd.id)}
                >
                  <h3 className="font-medium">{rcmd.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {rcmd.description}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedRcmdId || isSaving || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors 
                flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Saving...</span>
                </>
              ) : (
                "Add RCMD Block"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
