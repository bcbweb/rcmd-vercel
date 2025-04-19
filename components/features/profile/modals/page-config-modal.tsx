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

  // Get setDefaultPage function from the profile store
  const setDefaultPage = useProfileStore((state) => state.setDefaultPage);

  useEffect(() => {
    // Reset form when modal opens or props change
    setName(pageName || "");
    // Set default to true if this is a new page and there's no default page set yet
    if (isOpen) {
      setIsDefaultPage(isDefault);
    }
  }, [isOpen, pageName, isDefault, pageId, pageType, profileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let updatesMade = false;

      // If making this the default page status has changed
      if (isDefaultPage !== isDefault) {
        // Use the profile store to update the default page
        const success = await setDefaultPage(
          profileId,
          isDefaultPage ? pageType : "",
          pageType === "custom" && isDefaultPage ? pageId : undefined
        );

        if (success) {
          updatesMade = true;
        } else {
          console.error("Default page update failed");
          throw new Error("Failed to update default page");
        }
      }

      // For custom pages, additionally update the name if changed
      if (pageType === "custom" && name !== pageName && pageId) {
        const supabase = createClient();
        const { error: nameError } = await supabase
          .from("profile_pages")
          .update({ name })
          .eq("id", pageId);

        if (nameError) {
          console.error("Error updating page name:", nameError);
          toast.error("Failed to update page name");
        } else {
          updatesMade = true;
          toast.success("Page name updated successfully");
        }
      }

      // Always call onUpdate if any updates were made
      if (updatesMade && onUpdate) {
        onUpdate();
      }

      onClose();
    } catch (error) {
      console.error("Error updating page:", error);
      toast.error("Failed to update page settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
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
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter page name"
                required
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={isDefaultPage}
              onCheckedChange={(checked) => setIsDefaultPage(checked === true)}
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default page
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
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
