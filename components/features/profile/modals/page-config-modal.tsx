import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { useProfileStore } from "@/stores/profile-store";
import { createClient } from "@/utils/supabase/client";

interface PageConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId?: string;
  pageType: "rcmd" | "link" | "collection" | "custom";
  pageName?: string;
  isDefault: boolean;
  profileId: string;
  onUpdate?: () => void;
}

export function PageConfigModal({
  isOpen,
  onClose,
  pageId,
  pageType,
  pageName,
  isDefault,
  profileId,
  onUpdate,
}: PageConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(pageName || "");
  const [isDefaultPage, setIsDefaultPage] = useState(isDefault);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Get setDefaultPage function from the profile store
  const setDefaultPage = useProfileStore((state) => state.setDefaultPage);

  useEffect(() => {
    // Reset form when modal opens or props change
    setName(pageName || "");
    // Set default to true if this is a new page and there's no default page set yet
    if (isOpen) {
      console.log("[DEBUG-MODAL] Modal opened with props:", {
        pageId,
        pageType,
        pageName,
        isDefault,
        profileId,
      });
      setIsDefaultPage(isDefault);
      setStartTime(Date.now());
    }
  }, [isOpen, pageName, isDefault, pageId, pageType, profileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const submitTime = Date.now();
    const timeOpen = startTime ? submitTime - startTime : 0;

    console.log("[DEBUG-MODAL] Submitting form with values:", {
      name,
      isDefaultPage,
      initialIsDefault: isDefault,
      hasChanged: isDefaultPage !== isDefault || name !== pageName,
      pageId,
      pageType,
      profileId,
      timeOpen: `${timeOpen}ms`,
    });

    try {
      let updatesMade = false;

      // If making this the default page status has changed
      if (isDefaultPage !== isDefault) {
        console.log("[DEBUG-MODAL] Default page status changed:", {
          from: isDefault,
          to: isDefaultPage,
          timestamp: new Date().toISOString(),
        });

        // Use the profile store to update the default page
        const success = await setDefaultPage(
          profileId,
          isDefaultPage ? pageType : "",
          pageType === "custom" && isDefaultPage ? pageId : undefined
        );

        if (success) {
          console.log("[DEBUG-MODAL] Default page update succeeded via store");
          updatesMade = true;
        } else {
          console.error("[DEBUG-MODAL] Default page update failed");
          throw new Error("Failed to update default page");
        }
      } else {
        console.log("[DEBUG-MODAL] Default page status unchanged");
      }

      // For custom pages, additionally update the name if changed
      if (pageType === "custom" && name !== pageName && pageId) {
        console.log("[DEBUG-MODAL] Updating custom page name:", {
          from: pageName,
          to: name,
          pageId,
          timestamp: new Date().toISOString(),
        });

        const nameUpdateStartTime = Date.now();
        const supabase = createClient();
        const { error: nameError } = await supabase
          .from("profile_pages")
          .update({ name })
          .eq("id", pageId);

        const nameUpdateDuration = Date.now() - nameUpdateStartTime;
        console.log(`[DEBUG-MODAL] Name update took ${nameUpdateDuration}ms`);

        if (nameError) {
          console.error("[DEBUG-MODAL] Error updating page name:", nameError);
          toast.error("Failed to update page name");
        } else {
          console.log("[DEBUG-MODAL] Page name update succeeded");
          updatesMade = true;
          toast.success("Page name updated successfully");
        }
      } else if (pageType === "custom" && name === pageName) {
        console.log("[DEBUG-MODAL] Page name unchanged, skipping update");
      }

      // Always call onUpdate if any updates were made
      if (updatesMade) {
        console.log("[DEBUG-MODAL] Updates made, calling onUpdate callback");
        if (onUpdate) {
          console.log("[DEBUG-MODAL] onUpdate callback is defined, calling it");
          onUpdate();
        } else {
          console.log("[DEBUG-MODAL] onUpdate callback is not defined");
        }
      } else {
        console.log("[DEBUG-MODAL] No updates made, not calling onUpdate");
      }

      const totalTime = Date.now() - submitTime;
      console.log(
        `[DEBUG-MODAL] Total form submission process took ${totalTime}ms`
      );

      console.log("[DEBUG-MODAL] Closing modal");
      onClose();
    } catch (error) {
      console.error("[DEBUG-MODAL] Error updating page:", error);
      toast.error("Failed to update page settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        console.log("[DEBUG-MODAL] Dialog onOpenChange:", open);
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Configure{" "}
            {pageType === "rcmd"
              ? "Recommendations"
              : pageType === "custom"
                ? "Custom Page"
                : `${pageType.charAt(0).toUpperCase()}${pageType.slice(1)}s`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {pageType === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="name">Page Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log(
                    `[DEBUG-MODAL] Name changed: "${name}" → "${newValue}"`
                  );
                  setName(newValue);
                }}
                placeholder="Enter page name"
                required
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={isDefaultPage}
              onCheckedChange={(checked) => {
                console.log("[DEBUG-MODAL] Default checkbox changed:", {
                  from: isDefaultPage,
                  to: checked === true,
                  timestamp: new Date().toISOString(),
                });
                setIsDefaultPage(checked === true);
              }}
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default page
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("[DEBUG-MODAL] Cancel button clicked");
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
