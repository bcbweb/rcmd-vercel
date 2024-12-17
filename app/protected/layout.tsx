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

  return (
    <>
      <InitAuthStore userId={user.id} />
      {children}
    </>
  );
}