import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Creates a Supabase client with a shared instance to avoid connection issues
 */
export const createClient = () => {
  // Use a cached client if available to reduce connection overhead
  if (supabaseClient) return supabaseClient;

  try {
    // Support both publishable key (new) and anon key (legacy) for backward compatibility
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!apiKey) {
      throw new Error("Missing Supabase API key. Please set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      apiKey
    );
    return supabaseClient;
  } catch (error) {
    console.error("[Supabase Client] Error creating client:", error);
    // Create a new client as a fallback
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      apiKey!
    );
  }
};

/**
 * Wrapper utility for retrying Supabase operations when they fail
 * @param operation - The async Supabase operation to perform
 * @param maxRetries - Maximum number of retry attempts
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait with exponential backoff if this is a retry
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(100 * Math.pow(2, attempt), 3000))
        );
      }

      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(
        `[Supabase] Operation failed (attempt ${attempt + 1}/${maxRetries}):`,
        error
      );
    }
  }

  // If we get here, all retries failed
  throw lastError;
}
