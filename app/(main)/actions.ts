"use server";

import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link."
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  // Check for empty inputs first
  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "Email and password are required"
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  if (!data?.user) {
    return encodedRedirect("error", "/sign-in", "Invalid login credentials");
  }

  // Check onboarding status - get active profile
  let activeProfileId: string | null = null;
  const { data: activeProfile } = await supabase
    .from("user_active_profiles")
    .select("profile_id")
    .eq("auth_user_id", data.user.id)
    .single();

  if (activeProfile) {
    activeProfileId = activeProfile.profile_id;
  } else {
    // Fallback: get the first profile for the user
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", data.user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (profiles && profiles.length > 0) {
      activeProfileId = profiles[0].id;
    }
  }

  // Add a query parameter to indicate this is a redirect from sign-in
  // This helps middleware avoid premature redirects

  // Redirect based on onboarding status of active profile
  if (activeProfileId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_onboarded")
      .eq("id", activeProfileId)
      .single();

    if (!profile?.is_onboarded) {
      return redirect("/protected/onboarding?from=signin");
    }
  }

  return redirect("/protected/profile?from=signin");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed"
    );
  }

  return encodedRedirect(
    "success",
    "/protected/reset-password",
    "Password updated"
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
