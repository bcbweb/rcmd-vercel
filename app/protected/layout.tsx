import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { InitAuthStore } from './init-auth-store';

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

  return (
    <>
      <InitAuthStore userId={user.id} />
      {children}
    </>
  );
}