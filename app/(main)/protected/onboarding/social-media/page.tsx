"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { StepProgress } from "@/components/common";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { z } from "zod";
import { Trash2 } from "lucide-react";

const STORAGE_KEY = 'onboarding_social_media';

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
] as const;

const platformEnum = z.enum(['instagram', 'twitter', 'youtube', 'tiktok', 'linkedin', 'facebook']);
type Platform = z.infer<typeof platformEnum>;

const socialMediaSchema = z.object({
  socialLinks: z.array(z.object({
    platform: platformEnum,
    handle: z.string().min(1, "Handle is required"),
  })).optional().default([])
});

type SocialMediaFormData = z.infer<typeof socialMediaSchema>;

export default function SocialMediaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const supabase = createClient();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SocialMediaFormData>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      socialLinks: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinks"
  });

  // Update how we track used platforms to use current field values
  const usedPlatforms = new Set(
    fields.map((field, index) => watch(`socialLinks.${index}.platform`))
  );

  const getAvailablePlatforms = (currentPlatform?: Platform) => {
    return PLATFORM_OPTIONS.filter(option =>
      // Include if it's either the current platform or not used anywhere
      option.value === currentPlatform || !usedPlatforms.has(option.value)
    );
  };

  const handleAddPlatform = () => {
    const availablePlatforms = getAvailablePlatforms();
    if (availablePlatforms.length > 0) {
      append({ platform: availablePlatforms[0].value, handle: '' });
    }
  };

  useEffect(() => {
    const loadExistingData = async () => {
      // First try to load from localStorage
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.socialLinks && parsedData.socialLinks.length > 0) {
          setValue('socialLinks', parsedData.socialLinks);
        }
        return; // Exit early if we found localStorage data
      }

      // If no localStorage data, try to load from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (profile?.id) {
          const { data: socialLinks } = await supabase
            .from('profile_social_links')
            .select('platform, handle')
            .eq('profile_id', profile.id);

          if (socialLinks && socialLinks.length > 0) {
            setValue('socialLinks', socialLinks);
          }
        }
      } catch (error) {
        console.error('Error loading social media data:', error);
      }
    };

    loadExistingData();
  }, [setValue, supabase]);

  const onSubmit = async (formData: SocialMediaFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Get or create profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile?.id) {
        throw new Error('Profile not found');
      }

      // Delete existing links
      await supabase
        .from('profile_social_links')
        .delete()
        .eq('profile_id', profile.id);

      // Insert new links if any exist
      if (formData.socialLinks && formData.socialLinks.length > 0) {
        const { error } = await supabase
          .from('profile_social_links')
          .insert(
            formData.socialLinks.map(link => ({
              profile_id: profile.id,
              platform: link.platform,
              handle: link.handle,
              updated_at: new Date().toISOString()
            }))
          );

        if (error) throw error;
      }

      // Store complete form data in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));

      router.push('/protected/onboarding/personal-info');
    } catch (error) {
      console.error('Error saving social media:', error);
      toast.error('Failed to save social media profiles');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Social Media Profiles
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Connect your social media profiles to enhance your networking experience and personalize your profile.
          You can always add or modify these connections later.
        </p>
        <StepProgress currentStep={1} totalSteps={4} />
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsInfoOpen(!isInfoOpen)}
          className="w-full p-4 flex items-center justify-between text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-blue-800 dark:text-blue-300">
              Why connect social media profiles?
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isInfoOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isInfoOpen && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              By connecting your social media accounts, you'll unlock enhanced networking features and allow us to automatically update your profile with your latest achievements and content. Don't worry - we prioritize your privacy and control. We'll never post anything without your explicit permission, and you choose exactly what information we can sync to enhance your experience.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
        {fields.length > 0 && (
          <div className="space-y-2">
            {fields.map((field, index) => {
              const currentPlatform = watch(`socialLinks.${index}.platform`) as Platform;
              const availablePlatforms = getAvailablePlatforms(currentPlatform)
                .sort((a, b) => a.label.localeCompare(b.label));

              return (
                <div key={field.id} className="flex items-center gap-1">
                  <div className="flex flex-1 relative">
                    <div className="relative">
                      <select
                        {...register(`socialLinks.${index}.platform`)}
                        className="w-[120px] appearance-none pl-8 pr-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-l-md text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:z-10 transition-colors"
                      >
                        {availablePlatforms.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <input
                      type="text"
                      {...register(`socialLinks.${index}.handle`)}
                      placeholder="username"
                      className={`w-full min-w-0 px-2.5 py-1.5 -ml-px bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-md placeholder-gray-400 focus:ring-2 focus:outline-none focus:z-10 ${errors.socialLinks?.[index]?.handle
                        ? 'focus:ring-red-500 focus:border-red-500'
                        : 'focus:ring-blue-500 focus:border-transparent'
                        } transition-colors`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label="Remove social media profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {getAvailablePlatforms().length > 0 && (
          <button
            type="button"
            onClick={handleAddPlatform}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add a social media profile
          </button>
        )}

        <div className="flex justify-end gap-4 pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 text-sm font-medium text-white 
        bg-blue-600 dark:bg-blue-500 
        rounded-lg shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-blue-500 dark:focus:ring-blue-400
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Next"
            )}
          </button>
        </div>
      </form>
    </>
  );
}