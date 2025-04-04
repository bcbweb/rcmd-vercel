"use client";

import { useEffect, useState } from "react";
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
  const [customPages, setCustomPages] = useState<ProfilePage[]>([]);
  const [defaultPageId, setDefaultPageId] = useState<string | null>(null);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch custom pages on component mount
  useEffect(() => {
    fetchCustomPages();
  }, []);

  const fetchCustomPages = async () => {
    try {
      // First get the user's profile ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, default_page_id")
        .eq("auth_user_id", userId)
        .single();

      if (profileError || !profile) {
        throw profileError || new Error("Profile not found");
      }

      // Now fetch pages using profile_id
      const { data: pages, error } = await supabase
        .from("profile_pages")
        .select("*")
        .eq("profile_id", profile.id) // Changed from owner_id
        .order("created_at", { ascending: true });

      if (error) throw error;

      setCustomPages(pages || []);
      setDefaultPageId(profile.default_page_id);
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Failed to load custom pages");
    }
  };

  const handleAddPage = async (pageName: string) => {
    if (!pageName.trim()) {
      toast.error("Page name is required");
      return false;
    }

    try {
      const slug = pageName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Call the RPC function
      const { error } = await supabase.rpc("insert_profile_page", {
        page_name: pageName.trim(),
        page_slug: slug,
      });

      if (error) throw error;

      toast.success("Page created successfully");
      setIsAddingPage(false);
      fetchCustomPages(); // Refresh the list
      return true;
    } catch (error) {
      console.error("Error creating page:", error);
      toast.error("Failed to create page");
      return false;
    }
  };

  const tabs = [
    { name: "RCMDs", href: `/protected/profile/rcmds` },
    { name: "Links", href: `/protected/profile/links` },
    { name: "Collections", href: `/protected/profile/collections` },
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

      if (!profile) throw new Error("Profile not found");

      // Update using profile ID
      const { error } = await supabase
        .from("profiles")
        .update({ default_page_id: pageId })
        .eq("id", profile.id); // Changed from auth_user_id

      if (error) throw error;

      // Refresh data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("default_page_id")
        .eq("id", profile.id)
        .single();

      setDefaultPageId(updatedProfile?.default_page_id || null);
      fetchCustomPages();
      toast.success("Default page updated");
    } catch (error) {
      console.error("Error setting default page:", error);
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
          currentPath={pathname}
          isAddingPage={isAddingPage}
          onAddPage={handleAddPage}
          onCancelAdd={() => {
            setIsAddingPage(false);
          }}
          onStartAddPage={() => setIsAddingPage(true)}
          onPageDeleted={(deletedPageId) => {
            if (defaultPageId === deletedPageId) {
              setDefaultPageId(null);
            }
            fetchCustomPages();
          }}
          onPageRenamed={fetchCustomPages}
          onMakeDefault={handleMakeDefault}
        />
      </div>
      {isShareModalOpen && (
        <ShareModal
          onClose={() => setIsShareModalOpen(false)}
          handle={handle}
        />
      )}
    </div>
  );
}
