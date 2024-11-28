"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StepProgress } from "@/components/step-progress";
import ProfilePhotoUpload from "@/components/profile-photo-upload";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";

export default function ProfilePhotoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, profile_picture_url')
          .eq('auth_user_id', user.id)
          .single();

        if (error) throw error;

        if (user?.id) {
          setUserId(user.id);
        }

        if (profile?.profile_picture_url) {
          setPhotoUrl(profile.profile_picture_url);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  const handleUploadComplete = (url: string) => {
    setPhotoUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('profiles')
        .update({
          profile_picture_url: photoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

      if (error) throw error;
      router.push("/protected/onboarding/other-info");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile photo");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-48 w-48 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Profile Photo
        </h2>
        <StepProgress currentStep={2} totalSteps={3} />
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <ProfilePhotoUpload
          onUploadComplete={handleUploadComplete}
          currentPhotoUrl={photoUrl}
          userId={userId}
        />

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/protected/onboarding/personal-info"
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
          <Link
            href="/protected/onboarding/other-info"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 
              bg-white dark:bg-gray-800 
              border border-gray-300 dark:border-gray-600 
              rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Skip
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white 
              bg-blue-600 dark:bg-blue-500 
              rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 
              focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-blue-500 dark:focus:ring-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Next"}
          </button>
        </div>
      </form>
    </>
  );
}