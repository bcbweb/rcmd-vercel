"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { StepProgress } from "@/components/step-progress";
import UsernameInput from "@/components/username-input";
import { personalInfoSchema, type PersonalInfoFormData } from "@/lib/schemas/onboarding";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";

const STORAGE_KEY = 'onboarding_personal_info';

const inputClasses = {
  default: `mt-1 block w-full rounded-md shadow-sm px-3 py-2
    bg-white dark:bg-gray-700
    text-gray-900 dark:text-gray-100 
    border border-gray-300 dark:border-gray-600
    placeholder:text-gray-400 dark:placeholder:text-gray-400
    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
    focus:border-blue-500 dark:focus:border-blue-400`,
  error: `mt-1 block w-full rounded-md shadow-sm px-3 py-2
    bg-white dark:bg-gray-700
    text-gray-900 dark:text-gray-100 
    border-2 border-red-500 dark:border-red-400
    placeholder:text-gray-400 dark:placeholder:text-gray-400
    focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 
    focus:border-red-500 dark:focus:border-red-400`
};

export default function PersonalInfoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
  });

  // Load existing data if available
  useEffect(() => {
    const loadExistingData = async () => {
      // First try to load from localStorage
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setOriginalUsername(parsedData.username || '');
        setUsername(parsedData.username || '');
        setValue('username', parsedData.username);
        setValue('first_name', parsedData.first_name);
        setValue('last_name', parsedData.last_name);
        setValue('bio', parsedData.bio);
        return; // Exit early if we found localStorage data
      }

      // If no localStorage data, try to load from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, first_name, last_name, bio')
        .eq('auth_user_id', user.id)
        .single();

      if (profile) {
        setOriginalUsername(profile.username || '');
        setUsername(profile.username || '');
        setValue('username', profile.username);
        setValue('first_name', profile.first_name);
        setValue('last_name', profile.last_name);
        setValue('bio', profile.bio);
      }
    };

    loadExistingData();
  }, [setValue, supabase]);

  const onSubmit = async (data: PersonalInfoFormData) => {
    try {
      if (!isUsernameValid) {
        toast.error("Please choose a valid username");
        return;
      }

      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Save to profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          auth_user_id: user.id,
          email: user.email,
          username: username,
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'auth_user_id'
        });

      if (error) throw error;

      // Store complete form data in localStorage
      const formData = {
        username,
        first_name: data.first_name,
        last_name: data.last_name,
        bio: data.bio
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));

      router.push("/protected/onboarding/profile-photo");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save personal information");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h2>
        <StepProgress currentStep={1} totalSteps={3} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <UsernameInput
          value={username}
          onChange={(value, isValid) => {
            setUsername(value);
            setIsUsernameValid(isValid);
            setValue('username', value); // Update form value
          }}
          currentUsername={originalUsername}
          className={inputClasses.default}
        />
        <div>
          <label
            htmlFor="first_name"
            className={`block text-sm font-medium ${errors.first_name
              ? "text-red-600 dark:text-red-400"
              : "text-gray-700 dark:text-gray-200"
              }`}
          >
            First Name
            {errors.first_name && (
              <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                *
              </span>
            )}
          </label>
          <input
            id="first_name"
            type="text"
            {...register("first_name")}
            className={errors.first_name ? inputClasses.error : inputClasses.default}
            aria-invalid={errors.first_name ? "true" : "false"}
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.first_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="last_name"
            className={`block text-sm font-medium ${errors.last_name
              ? "text-red-600 dark:text-red-400"
              : "text-gray-700 dark:text-gray-200"
              }`}
          >
            Last Name
            {errors.last_name && (
              <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                *
              </span>
            )}
          </label>
          <input
            id="last_name"
            type="text"
            {...register("last_name")}
            className={errors.last_name ? inputClasses.error : inputClasses.default}
            aria-invalid={errors.last_name ? "true" : "false"}
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.last_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="bio"
            className={`block text-sm font-medium ${errors.bio
              ? "text-red-600 dark:text-red-400"
              : "text-gray-700 dark:text-gray-200"
              }`}
          >
            Bio
            {errors.bio && (
              <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                *
              </span>
            )}
          </label>
          <textarea
            id="bio"
            rows={4}
            {...register("bio")}
            className={errors.bio ? inputClasses.error : inputClasses.default}
            aria-invalid={errors.bio ? "true" : "false"}
            placeholder="Tell us a bit about yourself..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.bio.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isSubmitting || !isUsernameValid}
            className="px-4 py-2 text-sm font-medium text-white 
              bg-blue-600 dark:bg-blue-500 
              rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 
              focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-blue-500 dark:focus:ring-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-500"
          >
            {isSubmitting ? "Saving..." : "Next"}
          </button>
        </div>
      </form>
    </>
  );
}