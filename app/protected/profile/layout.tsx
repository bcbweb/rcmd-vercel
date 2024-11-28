"use client";

import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from '@supabase/supabase-js';
import ProfileHeader from "@/components/profile/profile-header";

const PAGE_TITLES = {
  '/protected/profile': 'Edit Profile',
  '/protected/profile/links': 'Manage Links',
  '/protected/profile/rcmds': 'Recommendations'
} as const;

type PathType = keyof typeof PAGE_TITLES;

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [profileId, setProfileId] = useState<string>("");
  const [handle, setHandle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [interests, setInterests] = useState<string[] | null>(null);
  const [tags, setTags] = useState<string[] | null>(null);
  const [bio, setBio] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  const pageTitle = pathname && (PAGE_TITLES[pathname as PathType] || 'Profile');

  // Get and monitor auth state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('Error fetching user:', error);
        router.push('/sign-in');
        return;
      }
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        router.push('/sign-in');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

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

      if (!profile || profile.is_onboarded !== true) {
        router.push('/protected/onboarding');
        return;
      }

      setProfileId(profile.id || "");
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setHandle(profile.handle || "");
      setProfilePictureUrl(profile.profile_picture_url || "");
      setCoverImageUrl(profile.cover_image || "");
      setInterests(profile.interests);
      setTags(profile.tags);
      setBio(profile.bio || "");
      setLocation(profile.location || "");
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile data');
    }
  }, [supabase, router]);

  useEffect(() => {
    const initializeProfile = async () => {
      if (!user?.id) return;
      await fetchProfileData(user.id);
      setIsLoading(false);
    };

    initializeProfile();
  }, [user?.id, fetchProfileData]);

  if (isLoading || !user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <ProfileHeader
        profileId={profileId}
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
      />
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
      {children}
    </div>
  );
}