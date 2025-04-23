import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
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

    // protected routes - only redirect if clearly not authenticated
    // and this isn't a redirect immediately after sign in
    if (
      request.nextUrl.pathname.startsWith("/protected") &&
      !authCookie &&
      !isSignInRedirect
    ) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // If we're clearly signed in after checking cookies and user
    // And we're on the home page, redirect to profile
    if (request.nextUrl.pathname === "/" && authCookie && user && !error) {
      // Preserve the from=signin parameter if it exists
      const redirectUrl = new URL("/protected/profile", request.url);
      if (isSignInRedirect) {
        redirectUrl.searchParams.set("from", "signin");
      }
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
