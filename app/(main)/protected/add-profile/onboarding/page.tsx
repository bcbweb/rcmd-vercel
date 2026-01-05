"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddProfileOnboardingStartPage() {
  const router = useRouter();

  useEffect(() => {
    // Retrieve the profile type from sessionStorage
    const profileType = sessionStorage.getItem("new_profile_type");

    if (!profileType) {
      // If no profile type, redirect back to selection
      router.push("/protected/add-profile");
      return;
    }

    // Redirect to the first step of onboarding based on profile type
    router.push(`/protected/add-profile/onboarding/basic-info`);
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="p-6 flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
