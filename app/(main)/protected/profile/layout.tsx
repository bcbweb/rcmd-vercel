"use client";

import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import ProfileHeader from "@/components/profile/profile-header";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

const PAGE_TITLES = {
  '/protected/profile/rcmds': 'Manage RCMDs',
  '/protected/profile/links': 'Manage Links',
  '/protected/profile/collections': 'Manage Collections',
  '/protected/profile': 'Edit Profile',
} as const;

type PathType = keyof typeof PAGE_TITLES;

type SocialLink = {
  platform: string;
  handle: string;
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const userId = useAuthStore(state => state.userId);
  const [handle, setHandle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [interests, setInterests] = useState<string[] | null>(null);
  const [tags, setTags] = useState<string[] | null>(null);
  const [bio, setBio] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  const pageTitle = pathname && (PAGE_TITLES[pathname as PathType] || 'Profile');

  const fetchProfileData = useCallback(async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id, 
          is_onboarded, 
          first_name, 
          last_name, 
          handle, 
          profile_picture_url,
          cover_image,
          interests,
          tags,
          bio,
          location
        `)
        .eq("auth_user_id", userId)
        .single();

      if (profileError) throw profileError;

      // Return early if no profile or not onboarded
      if (!profile || !profile.is_onboarded) {
        return { needsOnboarding: true };
      }

      // Fetch social links
      const { data: socialLinksData, error: socialLinksError } = await supabase
        .from("profile_social_links")
        .select("platform, handle")
        .eq("profile_id", profile.id);

      if (socialLinksError) throw socialLinksError;

      return {
        profile,
        socialLinks: socialLinksData || [],
        needsOnboarding: false
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
      return { error: true };
    }
  }, [supabase]);

  useEffect(() => {
    const initializeProfile = async () => {
      if (!userId) return;

      const result = await fetchProfileData(userId);

      if (result.needsOnboarding) {
        router.push('/protected/onboarding');
        return;
      }

      if (!result.error && result.profile) {
        setFirstName(result.profile.first_name || "");
        setLastName(result.profile.last_name || "");
        setHandle(result.profile.handle || "");
        setProfilePictureUrl(result.profile.profile_picture_url || "");
        setCoverImageUrl(result.profile.cover_image || "");
        setInterests(result.profile.interests);
        setTags(result.profile.tags);
        setBio(result.profile.bio || "");
        setLocation(result.profile.location || "");
        setSocialLinks(result.socialLinks);
      }

      setIsLoading(false);
    };

    initializeProfile();
  }, [userId, fetchProfileData, router]);

  if (isLoading || !userId) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <ProfileHeader
        handle={handle}
        title={pageTitle}
        firstName={firstName}
        lastName={lastName}
        profilePictureUrl={profilePictureUrl}
        coverImageUrl={coverImageUrl}
        interests={interests}
        tags={tags}
        bio={bio}
        location={location}
        socialLinks={socialLinks}
      />
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
      {children}
    </div>
  );
}