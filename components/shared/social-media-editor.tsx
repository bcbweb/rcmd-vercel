"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";

export const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
] as const;

const platformEnum = z.enum(['instagram', 'twitter', 'youtube', 'tiktok', 'linkedin', 'facebook']);
export type Platform = z.infer<typeof platformEnum>;

export const socialMediaSchema = z.object({
  socialLinks: z.array(z.object({
    platform: platformEnum,
    handle: z.string().min(1, "Handle is required"),
  })).optional().default([])
});

export type SocialMediaFormData = z.infer<typeof socialMediaSchema>;

interface SocialMediaEditorProps {
  initialData?: SocialMediaFormData;
  onSubmit: (data: SocialMediaFormData) => Promise<void>;
  isLoading?: boolean;
}

export function SocialMediaEditor({ initialData, onSubmit, isLoading = false }: SocialMediaEditorProps) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SocialMediaFormData>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: initialData || {
      socialLinks: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinks"
  });

  const usedPlatforms = new Set(
    fields.map((field, index) => watch(`socialLinks.${index}.platform`))
  );

  const getAvailablePlatforms = (currentPlatform?: Platform) => {
    return PLATFORM_OPTIONS.filter(option =>
      option.value === currentPlatform || !usedPlatforms.has(option.value)
    );
  };

  const handleAddPlatform = () => {
    const availablePlatforms = getAvailablePlatforms();
    if (availablePlatforms.length > 0) {
      append({ platform: availablePlatforms[0].value, handle: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}