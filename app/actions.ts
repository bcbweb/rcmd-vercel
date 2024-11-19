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
			"Email and password are required",
		);
	}

	// First, create the auth user
	const { data: authData, error: authError } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${origin}/auth/callback`,
			data: {
				profile_created: false, // Add metadata to track profile creation
				onboarding_completed: false // Add metadata to track profile creation
			}
		},
	});

	if (authError) {
		console.error(authError.code + " " + authError.message);
		return encodedRedirect("error", "/sign-up", authError.message);
	}

	// If auth user was created successfully, create the profile
	if (authData.user) {
		const { error: profileError } = await supabase
			.from('profiles')
			.insert([
				{
					auth_user_id: authData.user.id,
					email: authData.user.email,
					// Add any other default profile fields you need
				}
			]);

		if (profileError) {
			console.error("Profile creation failed:", profileError);
			// You might want to delete the auth user here if profile creation fails
			// Or implement a cleanup job for auth users without profiles
			return encodedRedirect(
				"error",
				"/sign-up",
				"Account creation failed"
			);
		}
	}

	return encodedRedirect(
		"success",
		"/sign-up",
		"Thanks for signing up! Please check your email for a verification link.",
	);
};

export const signInAction = async (formData: FormData) => {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const supabase = await createClient();

	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return encodedRedirect("error", "/sign-in", error.message);
	}

	return redirect("/protected/profile");
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
			"Could not reset password",
		);
	}

	if (callbackUrl) {
		return redirect(callbackUrl);
	}

	return encodedRedirect(
		"success",
		"/forgot-password",
		"Check your email for a link to reset your password.",
	);
};

export const resetPasswordAction = async (formData: FormData) => {
	const supabase = await createClient();

	const password = formData.get("password") as string;
	const confirmPassword = formData.get("confirmPassword") as string;

	if (!password || !confirmPassword) {
		encodedRedirect(
			"error",
			"/protected/reset-password",
			"Password and confirm password are required",
		);
	}

	if (password !== confirmPassword) {
		encodedRedirect(
			"error",
			"/protected/reset-password",
			"Passwords do not match",
		);
	}

	const { error } = await supabase.auth.updateUser({
		password: password,
	});

	if (error) {
		encodedRedirect(
			"error",
			"/protected/reset-password",
			"Password update failed",
		);
	}

	encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
	const supabase = await createClient();
	await supabase.auth.signOut();
	return redirect("/sign-in");
};
