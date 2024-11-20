"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepProgress } from "@/components/step-progress";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { TagInput } from "@/components/tag-input";
import { URLHandleInput } from '@/components/url-handle-input';
import countries from '@/data/countries.json';

interface OtherInfoFormData {
  handle: string;
  location: string;
  interests: string[];
  tags: string[];
}

export default function OtherInfoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [isHandleAvailable, setIsHandleAvailable] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState<OtherInfoFormData>({
    handle: '',
    location: '',
    interests: [],
    tags: []
  });

  const [initialHandle, setInitialHandle] = useState<string>('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/signin');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('handle, location, interests, tags, is_onboarded')
          .eq('auth_user_id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          // If the profile is already onboarded, redirect to profile page
          if (profile.is_onboarded) {
            router.push('/protected/profile');
            return;
          }

          setFormData({
            handle: profile.handle || '',
            location: profile.location || '',
            interests: profile.interests || [],
            tags: profile.tags || []
          });

          // Store initial handle to compare later
          setInitialHandle(profile.handle || '');

          // If handle exists, set it as available
          if (profile.handle) {
            setIsHandleAvailable(true);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [supabase, router]);

  const isFormValid = Boolean(
    formData.handle &&
    (isHandleAvailable || formData.handle === initialHandle) &&
    !isCheckingHandle &&
    formData.location
  );

  const sanitizeHandle = (handle: string) => {
    if (!handle) return '';
    let sanitized = handle.toLowerCase();
    sanitized = sanitized.replace(/[^a-z0-9-_]/g, '');
    sanitized = sanitized.replace(/[-_]{2,}/g, '-');
    sanitized = sanitized.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
    return sanitized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isHandleAvailable && formData.handle !== initialHandle) {
      toast.error("Please choose an available handle");
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const sanitizedHandle = sanitizeHandle(formData.handle);

      const { error } = await supabase
        .from('profiles')
        .update({
          handle: sanitizedHandle,
          location: formData.location,
          interests: formData.interests,
          tags: formData.tags,
          is_onboarded: true,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      router.push("/protected/profile");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save other info");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Tell us more about you
        </h2>
        <StepProgress currentStep={3} totalSteps={3} />
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            URL Handle
          </label>
          <div className="mt-1">
            <URLHandleInput
              value={formData.handle}
              onChange={(handle) => setFormData(prev => ({ ...prev, handle: sanitizeHandle(handle) }))}
              onAvailabilityChange={(status) => {
                setIsCheckingHandle(status.isChecking);
                setIsHandleAvailable(status.isAvailable);
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Location
          </label>
          <select
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select a country</option>
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Interests
          </label>
          <TagInput
            tags={formData.interests}
            onChange={(interests) => setFormData(prev => ({ ...prev, interests }))}
            placeholder="Add interests..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Tags
          </label>
          <TagInput
            tags={formData.tags}
            onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
            placeholder="Add tags..."
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => router.push("/protected/onboarding/profile-photo")}
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
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white 
            bg-blue-600 dark:bg-blue-500 
            rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 
            focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-blue-500 dark:focus:ring-blue-400
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Complete"}
          </button>
        </div>
      </form>
    </>
  );
}



