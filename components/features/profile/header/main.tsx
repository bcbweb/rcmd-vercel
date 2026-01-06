"use client";

import { useState } from "react";
import type { ProfilePage } from "@/types";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "@/types";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
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

const isString = (value: unknown): value is string => typeof value === "string";

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

      // Get active profile ID from profile store or fetch it
      let profileId: string | null = null;

      // First try to get from profile store
      const profileState = useProfileStore.getState();
      if (profileState.profile?.id) {
        profileId = profileState.profile.id;
        console.log("[AddPage] Using active profile from store:", profileId);
      } else {
        // Fallback: get the active profile from database
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: activeProfile } = await supabase
            .from("user_active_profiles")
            .select("profile_id")
            .eq("auth_user_id", user.id)
            .single();

          if (activeProfile) {
            profileId = activeProfile.profile_id;
            console.log("[AddPage] Using active profile from DB:", profileId);
          } else {
            // Last resort: get the first profile for the user
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id")
              .eq("auth_user_id", user.id)
              .order("created_at", { ascending: true })
              .limit(1);

            if (profiles && profiles.length > 0) {
              profileId = profiles[0].id;
              console.log("[AddPage] Using first profile:", profileId);
            }
          }
        }
      }

      // The RPC function will use the active profile internally
      // But we can verify it exists for better error messages
      if (!profileId) {
        throw new Error(
          "Profile not found. Please ensure you have an active profile."
        );
      }

      // Call the RPC function - it uses the active profile from user_active_profiles
      // The function will automatically handle duplicate slugs by appending numbers
      const { data: newPageId, error } = await supabase.rpc(
        "insert_profile_page",
        {
          page_name: pageName.trim(),
          page_slug: slug,
        }
      );

      if (error) {
        console.error("[AddPage] RPC error:", error);
        throw error;
      }

      // If this should be the default page, update that as well
      if (isDefault && newPageId) {
        await handleMakeDefault(newPageId);
      }

      toast.success("Page created successfully");
      setIsAddingPage(false);

      // Refresh pages list by calling onUpdate if available
      // This will trigger fetchPages in the profile store
      if (onUpdate) {
        await onUpdate();
      } else {
        // Fallback: manually refresh pages from profile store
        const profileStore = useProfileStore.getState();
        if (userId) {
          await profileStore.fetchPages(userId);
        }
      }

      return true;
    } catch (error) {
      console.error("Error creating page:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create page";
      toast.error(errorMessage);
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
      // Get profile ID first
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

      if (!profile) {
        throw new Error("Profile not found");
      }

      const profileId = profile.id;

      // Find if it's a custom page
      const matchingPage = customPages.find((page) => page.id === pageId);
      let defaultPageType = matchingPage ? "custom" : null;

      if (!defaultPageType) {
        // Check if it's a known system page type
        if (pathname.includes("/rcmds")) {
          defaultPageType = "rcmd";
        } else if (pathname.includes("/links")) {
          defaultPageType = "link";
        } else if (pathname.includes("/collections")) {
          defaultPageType = "collection";
        }
      }

      try {
        if (isString(defaultPageType)) {
          try {
            if (defaultPageType === "custom" && pageId) {
              await supabase
                .from("profiles")
                .update({
                  default_page_type: "custom",
                  default_page_id: pageId,
                })
                .eq("id", profileId);
            } else {
              // For non-custom pages (rcmd, link, collection)
              await supabase
                .from("profiles")
                .update({
                  default_page_type: defaultPageType,
                  default_page_id: null,
                })
                .eq("id", profileId);
            }
          } catch {
            throw new Error("Failed to update default page");
          }
        }
      } catch {
        toast.error("Failed to update default page");
        return;
      }

      // Call the onUpdate prop to refresh the parent component
      if (onUpdate) {
        onUpdate();
      }

      toast.success("Default page updated");
    } catch {
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
