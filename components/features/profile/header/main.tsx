"use client";

import { useState } from "react";
import type { ProfilePage } from "@/types";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "@/types";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { CoverImage } from "./cover-image";
import { ProfilePhoto } from "./photo";
import { ProfileInfo } from "./info";
import { ProfileTabs } from "./tabs";
import { ShareModal } from "@/components/common/modals";
import AddPageModal from "../modals/add-page-modal";

interface ProfileHeaderProps {
  handle: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  coverImageUrl?: string;
  interests?: string[] | null;
  tags?: string[] | null;
  bio?: string;
  location?: string;
  socialLinks?: Array<{
    platform: string;
    handle: string;
  }>;
  showEditButton?: boolean;
  showPreviewButton?: boolean;
  showShareButton?: boolean;
  onUpdate?: () => void;
  customPages?: ProfilePage[];
  defaultPageId?: string | null;
  defaultPageType?: string | null;
}

export default function ProfileHeaderMain({
  handle,
  firstName,
  lastName,
  profilePictureUrl,
  coverImageUrl,
  interests = [],
  tags = [],
  bio = "",
  location = "",
  socialLinks = [],
  onUpdate,
  customPages = [],
  defaultPageId = null,
  defaultPageType = null,
}: ProfileHeaderProps) {
  const userId = useAuthStore((state) => state.userId);
  const pathname = usePathname();
  const supabase = createClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: firstName || "",
    lastName: lastName || "",
    bio: bio || "",
    interests: interests || [],
    tags: tags || [],
  });
  const [newCoverImageUrl, setNewCoverImageUrl] = useState(coverImageUrl);
  const [newProfilePictureUrl, setNewProfilePictureUrl] =
    useState(profilePictureUrl);
  const [newInterest, setNewInterest] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // We don't need to fetch custom pages anymore as they're coming from props

  const handleAddPage = async (
    pageName: string,
    isDefault: boolean = false
  ) => {
    if (!pageName.trim()) {
      toast.error("Page name is required");
      return false;
    }

    try {
      const slug = pageName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Get profile ID first to pass to the RPC function
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Call the RPC function
      const { error } = await supabase.rpc("insert_profile_page", {
        page_name: pageName.trim(),
        page_slug: slug,
      });

      if (error) throw error;

      // If this should be the default page, update that as well
      if (isDefault) {
        const { data: newPage } = await supabase
          .from("profile_pages")
          .select("id")
          .eq("profile_id", profile.id)
          .eq("slug", slug)
          .single();

        if (newPage) {
          await handleMakeDefault(newPage.id);
        }
      }

      toast.success("Page created successfully");
      setIsAddingPage(false);
      return true;
    } catch (error) {
      console.error("Error creating page:", error);
      toast.error("Failed to create page");
      return false;
    }
  };

  const tabs = [
    { name: "RCMDs", href: `/protected/profile/rcmds`, key: "rcmd" },
    { name: "Links", href: `/protected/profile/links`, key: "link" },
    {
      name: "Collections",
      href: `/protected/profile/collections`,
      key: "collection",
    },
  ];

  const handleSave = async () => {
    try {
      const updates: Partial<Profile> = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        interests: formData.interests,
        tags: formData.tags,
        profile_picture_url: newProfilePictureUrl,
        cover_image: newCoverImageUrl,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("handle", handle);

      if (error) throw error;

      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: firstName || "",
      lastName: lastName || "",
      bio: bio || "",
      interests: interests || [],
      tags: tags || [],
    });
    setNewCoverImageUrl(coverImageUrl);
    setNewProfilePictureUrl(profilePictureUrl);
    setNewInterest("");
    setNewTag("");
  };

  const handleAddInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newInterest.trim()) {
      e.preventDefault();
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter(
        (interest) => interest !== interestToRemove
      ),
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleMakeDefault = async (pageId: string) => {
    try {
      console.log("[DEBUG] handleMakeDefault called with pageId:", pageId);
      // Get profile ID first
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

      if (!profile) {
        console.log("[DEBUG] No profile found for user ID:", userId);
        throw new Error("Profile not found");
      }

      console.log("[DEBUG] Found profile:", profile.id);

      // Try to update with type information first
      try {
        console.log(
          "[DEBUG] Updating profile with new default page settings:",
          {
            profile_id: profile.id,
            default_page_id: pageId,
            default_page_type: "custom",
          }
        );

        const { error } = await supabase
          .from("profiles")
          .update({
            default_page_id: pageId, // For custom pages, this is always a valid UUID
            default_page_type: "custom",
          })
          .eq("id", profile.id);

        if (error) {
          console.log("[DEBUG] Error updating default page:", error);
          if (error.message.includes("does not exist")) {
            // If the default_page_type column doesn't exist, fall back to just updating default_page_id
            console.log(
              "[DEBUG] Falling back to update without default_page_type"
            );
            const { error: fallbackError } = await supabase
              .from("profiles")
              .update({ default_page_id: pageId })
              .eq("id", profile.id);

            if (fallbackError) {
              console.log("[DEBUG] Fallback update failed:", fallbackError);
              throw fallbackError;
            }

            console.log("[DEBUG] Fallback update succeeded");
            // Notify the user about the schema issue
            toast.info(
              "Default page set with limited functionality. Please run database migrations."
            );
          } else {
            throw error;
          }
        } else {
          console.log("[DEBUG] Default page update succeeded");
        }
      } catch (error) {
        console.error("[DEBUG] Detailed error setting default page:", error);
        throw new Error("Failed to update default page");
      }

      // Call the onUpdate prop to refresh the parent component
      if (onUpdate) {
        onUpdate();
      }

      toast.success("Default page updated");
    } catch (error) {
      console.error("[DEBUG] Error setting default page:", error);
      toast.error("Failed to update default page");
    }
  };

  return (
    <div className="relative mb-8">
      <CoverImage
        isEditing={isEditing}
        coverImageUrl={newCoverImageUrl}
        onUploadComplete={setNewCoverImageUrl}
      />

      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex flex-col md:flex-row md:items-end pb-4 border-b border-gray-200 dark:border-gray-700">
          <ProfilePhoto
            isEditing={isEditing}
            profilePictureUrl={newProfilePictureUrl}
            handle={handle}
            firstName={formData.firstName}
            onUploadComplete={setNewProfilePictureUrl}
          />

          <div className="w-full md:ml-44 flex-grow flex flex-col md:flex-row md:items-end justify-between pb-4">
            <ProfileInfo
              isEditing={isEditing}
              isOwnProfile={true}
              formData={formData}
              handle={handle}
              onFormChange={(field, value) =>
                setFormData((prev) => ({ ...prev, [field]: value }))
              }
              onEdit={() => setIsEditing(true)}
              onSave={handleSave}
              onCancel={handleCancel}
              onShare={() => setIsShareModalOpen(true)}
              location={location}
              socialLinks={socialLinks}
              newInterest={newInterest}
              onNewInterestChange={setNewInterest}
              onAddInterest={handleAddInterest}
              onRemoveInterest={handleRemoveInterest}
              newTag={newTag}
              onNewTagChange={setNewTag}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        </div>

        <ProfileTabs
          tabs={tabs}
          customPages={customPages}
          defaultPageId={defaultPageId}
          defaultPageType={defaultPageType}
          currentPath={pathname}
          isAddingPage={isAddingPage}
          onAddPage={handleAddPage}
          onCancelAdd={() => {
            setIsAddingPage(false);
          }}
          onStartAddPage={() => setIsAddingPage(true)}
          onPageDeleted={() => {
            // Call the onUpdate prop to refresh the parent component
            if (onUpdate) {
              onUpdate();
            }
          }}
          onPageRenamed={() => {
            // Call the onUpdate prop to refresh the parent component
            if (onUpdate) {
              onUpdate();
            }
          }}
          onMakeDefault={handleMakeDefault}
        />
      </div>
      {isShareModalOpen && (
        <ShareModal
          onClose={() => setIsShareModalOpen(false)}
          handle={handle}
        />
      )}
      <AddPageModal
        isOpen={isAddingPage}
        onClose={() => setIsAddingPage(false)}
        onAdd={handleAddPage}
        hasDefaultPage={!!defaultPageId}
      />
    </div>
  );
}
