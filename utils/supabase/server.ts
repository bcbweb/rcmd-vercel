import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();

  // Support both publishable key (new) and anon key (legacy) for backward compatibility
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiKey) {
    throw new Error("Missing Supabase API key. Please set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    apiKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};
