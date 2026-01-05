"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepProgress } from "@/components/common";
import { toast } from "sonner";
import { TagInput, LinkInput } from "@/components/common/forms";
import countries from "@/data/countries.json";

const STORAGE_KEY = "add_profile_business_details";
// Key for storing all profile data until final submission
const PROFILE_DATA_KEY = "add_profile_data";

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
    focus:border-red-500 dark:focus:border-red-400`,
};

interface BusinessDetailsFormData {
  location: string;
  industry: string;
  website: string;
  contactEmail: string;
  tags: string[];
}

export default function BusinessDetailsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [formData, setFormData] = useState<BusinessDetailsFormData>({
    location: "",
    industry: "",
    website: "",
    contactEmail: "",
    tags: [],
  });

  // Load from session storage and localStorage
  useEffect(() => {
    // Get profile ID from session storage
    const newProfileId = sessionStorage.getItem("new_profile_id");
    if (!newProfileId) {
      router.push("/protected/add-profile");
      return;
    }

    setProfileId(newProfileId);

    // Try to load from localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error("Error parsing saved data:", error);
      }
    }

    setIsLoading(false);
  }, [router]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isLoading]);

  const isFormValid = Boolean(formData.location && formData.industry);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileId) {
      toast.error("Profile ID not found. Please restart the process.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Get the existing profile data from session storage
      const profileDataStr = sessionStorage.getItem(PROFILE_DATA_KEY);
      if (!profileDataStr) {
        throw new Error("Profile data not found. Please restart the process.");
      }

      const profileData = JSON.parse(profileDataStr);

      // Add business details to the profile data
      profileData.businessDetails = {
        location: formData.location,
        industry: formData.industry,
        website: formData.website || null,
        contactEmail: formData.contactEmail || null,
        tags: formData.tags,
      };

      // Save the updated profile data back to session storage
      sessionStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(profileData));

      toast.success("Business details saved!");
      router.push("/protected/add-profile/onboarding/profile-photo");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save business details");
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
          Business Details
        </h2>
        <StepProgress currentStep={2} totalSteps={3} />
      </div>

      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Location
            </label>
            <div className="relative mt-1">
              <select
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                className={inputClasses.default}
                required
              >
                <option value="" className="bg-white dark:bg-gray-800">
                  Select a country
                </option>
                {countries.map((country) => (
                  <option
                    key={country.code}
                    value={country.code}
                    className="bg-white dark:bg-gray-800"
                  >
                    {country.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Industry
            </label>
            <div className="mt-1">
              <input
                type="text"
                value={formData.industry}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, industry: e.target.value }))
                }
                className={inputClasses.default}
                placeholder="e.g. Technology, Retail, Healthcare"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Website (optional)
            </label>
            <div className="mt-1">
              <LinkInput
                value={formData.website}
                onChange={(url: string) =>
                  setFormData((prev) => ({ ...prev, website: url }))
                }
                placeholder="https://yourbusiness.com"
                className={inputClasses.default}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Contact Email (optional)
            </label>
            <div className="mt-1">
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                className={inputClasses.default}
                placeholder="contact@yourbusiness.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tags (optional)
            </label>
            <TagInput
              tags={formData.tags}
              onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
              placeholder="Add tags..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Add tags to help customers find your business (e.g. ecommerce,
              b2b, local)
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/protected/add-profile/onboarding/basic-info"
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
              {isSubmitting ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
