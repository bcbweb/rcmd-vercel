import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getMetadataBase } from "@/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/sign-in");
  }

  return {
    metadataBase: getMetadataBase(),
    title: `Create New Profile`,
    description: "Set up your additional profile",
  };
}

export default function AddProfileOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
