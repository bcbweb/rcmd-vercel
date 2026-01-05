"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Newspaper } from "lucide-react";
import Link from "next/link";

type ProfileType = "business" | "creator" | null;

export default function AddProfilePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ProfileType>(null);

  const handleProfileTypeSelect = (type: ProfileType) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (!selectedType) return;

    // Store the selected profile type in sessionStorage so it's available during onboarding
    sessionStorage.setItem("new_profile_type", selectedType);

    // Redirect to the first step of the onboarding flow for the new profile
    router.push(`/protected/add-profile/onboarding`);
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add a New Profile
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose the type of profile you want to create
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                  selectedType === "business"
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => handleProfileTypeSelect("business")}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                    <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <h3 className="text-lg font-medium">Business</h3>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Create a profile for your business or organization. Showcase
                  services, products, and connect with customers.
                </p>
              </div>

              <div
                className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                  selectedType === "creator"
                    ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => handleProfileTypeSelect("creator")}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
                    <Newspaper className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <h3 className="text-lg font-medium">Content Creator</h3>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Ideal for content creators, influencers, and artists. Share
                  your work, build your audience, and connect with followers.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/protected/profile"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </Link>
              <button
                onClick={handleContinue}
                disabled={!selectedType}
                className="px-4 py-2 text-sm font-medium text-white 
                bg-blue-600 dark:bg-blue-500 
                rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-blue-500 dark:focus:ring-blue-400
                disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
