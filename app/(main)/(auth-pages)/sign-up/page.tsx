"use client";

import { signUpAction } from "@/app/(main)/actions";
import { FormMessage, type Message } from "@/components/common/forms";
import { SubmitButton } from "@/components/common/forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { SSOButtons } from "@/components/features/auth/sso-buttons";

export default function Signup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useAuthStore();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  // Redirect to profile page if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/protected/profile");
    }
  }, [status, router]);

  // Create a message object from search params
  let message: Message | null = null;

  if (error) {
    message = { error };
  } else if (success) {
    message = { success };
  }

  return (
    <div className="flex flex-col min-w-64 max-w-64 mx-auto">
      <h1 className="text-2xl font-medium">Sign up</h1>
      <p className="text-sm text text-foreground">
        Already have an account?{" "}
        <Link className="text-primary font-medium underline" href="/sign-in">
          Sign in
        </Link>
      </p>
      
      <form className="flex flex-col gap-2 [&>input]:mb-3 mt-8 w-full">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <Label htmlFor="password">Password</Label>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          minLength={6}
          required
        />
        <SubmitButton formAction={signUpAction} pendingText="Signing up...">
          Sign up
        </SubmitButton>
        {message && <FormMessage message={message} />}
      </form>

      <SSOButtons className="mt-6" />
    </div>
  );
}
