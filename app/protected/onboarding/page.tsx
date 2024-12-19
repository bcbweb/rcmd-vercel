import { redirect } from "next/navigation";

export default function OnboardingPage() {
  redirect("/protected/onboarding/social-media");
}