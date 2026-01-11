"use client";

import { signInAction } from "@/app/(main)/actions";
import { FormMessage, type Message } from "@/components/common/forms";
import { SubmitButton } from "@/components/common/forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SSOButtons } from "@/components/features/auth/sso-buttons";

export default function Login() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  // Create a message object from search params
  let message: Message | null = null;

  if (error) {
    message = { error };
  } else if (success) {
    message = { success };
  }

  return (
    <div className="flex-1 flex flex-col min-w-64 max-w-64 mx-auto">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="text-sm text-foreground">
        Don't have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Sign up
        </Link>
      </p>
      
      <SSOButtons className="mt-8" />

      <form className="flex flex-col gap-2 [&>input]:mb-3 mt-6 w-full">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          required
        />
        <SubmitButton pendingText="Signing In..." formAction={signInAction}>
          Sign in
        </SubmitButton>
        {message && <FormMessage message={message} />}
      </form>
    </div>
  );
}
