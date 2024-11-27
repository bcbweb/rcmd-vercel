import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const origin = requestUrl.origin;
	const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

	if (code) {
		const supabase = await createClient();
		await supabase.auth.exchangeCodeForSession(code);

		// After session exchange, check onboarding status
		const { data: profile } = await supabase
			.from('profiles')
			.select('is_onboarded')
			.single();

		console.log('profile after auth callback', profile);

		// Redirect based on onboarding status
		if (!profile?.is_onboarded) {
			return NextResponse.redirect(`${origin}/protected/onboarding`);
		}
	}

	if (redirectTo) {
		return NextResponse.redirect(`${origin}${redirectTo}`);
	}

	// Only redirect to profile if we couldn't determine onboarding status
	// or if user is already onboarded
	return NextResponse.redirect(`${origin}/protected/profile`);
}