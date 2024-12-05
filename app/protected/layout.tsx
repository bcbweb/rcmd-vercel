import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { InitAuthStore } from './init-auth-store';
import RCMDModal from "@/components/rcmds/modals/rcmd-modal";
import LinkModal from "@/components/links/modals/link-modal";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/sign-in");
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_onboarded")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    throw new Error("Failed to fetch user profile");
  }

  // Handle onboarding redirect
  if (!profile || !profile.is_onboarded) {
    redirect("/protected/onboarding");
  }

  return (
    <>
      <InitAuthStore userId={user.id} />
      {children}
      <RCMDModal />
      <LinkModal />
    </>
  );
}