import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Keep track of recent auth session checks to prevent redirect loops
const recentChecks = new Map<string, { time: number; hasCookies: boolean }>();

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Check for auth cookie existence - more reliable than session check
    const authCookie =
      request.cookies.get("sb-access-token") ||
      request.cookies.get("sb-refresh-token");

    // Special handling for redirects after sign in
    const url = new URL(request.url);
    const isSignInRedirect = url.searchParams.get("from") === "signin";

    // Track check for this URL with cache
    const requestKey = request.nextUrl.pathname;
    const now = Date.now();

    // Clear expired entries from the map (older than 5 minutes)
    // Use Array.from to avoid iterator issues
    Array.from(recentChecks.keys()).forEach((key) => {
      const value = recentChecks.get(key);
      if (value && now - value.time > 300000) {
        recentChecks.delete(key);
      }
    });

    // Record this check
    recentChecks.set(requestKey, {
      time: now,
      hasCookies: !!authCookie,
    });

    // MUCH MORE CONSERVATIVE approach to redirecting from protected routes:
    // Only redirect if:
    // 1. We're on a protected route
    // 2. No auth cookie exists AND no user from getUser()
    // 3. Not right after sign-in
    // 4. No recent check showed cookies for this path in the last 30 seconds
    const previousCheck = recentChecks.get(requestKey);
    if (
      request.nextUrl.pathname.startsWith("/protected") &&
      !authCookie &&
      !user && // Only redirect if both cookie AND user check fail
      !isSignInRedirect &&
      !(
        (
          previousCheck &&
          previousCheck.hasCookies &&
          now - previousCheck.time < 30000
        ) // Increased time window
      )
    ) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // If we're clearly signed in after checking cookies and user
    // And we're on the home page, redirect to profile
    if (request.nextUrl.pathname === "/" && authCookie && user && !error) {
      // Don't redirect if we're coming from sign-in and already on a protected path
      if (
        isSignInRedirect &&
        request.nextUrl.pathname.startsWith("/protected")
      ) {
        return response;
      }

      // Preserve the from=signin parameter if it exists
      const redirectUrl = new URL("/protected/profile", request.url);
      if (isSignInRedirect) {
        redirectUrl.searchParams.set("from", "signin");
      }
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (e) {
    console.error("Middleware error:", e);
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
