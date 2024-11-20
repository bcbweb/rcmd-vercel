import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function ProtectedPage() {
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
		// Handle database error appropriately
		throw new Error("Failed to fetch user profile");
	}

	// Redirect based on onboarding status
	if (!profile || !profile.is_onboarded) {
		redirect("/protected/onboarding");
	} else {
		redirect("/protected/profile");
	}
}