import type { Metadata } from 'next';
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_onboarded")
    .single();

  if (profile?.is_onboarded) {
    redirect("/protected/profile");
  }

  return {
    title: `Complete Your Profile`,
    description: 'Set up your account',
  };
}

export default function OnboardingLayout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 py-8 min-w-96 max-w-96 min-h-96">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}