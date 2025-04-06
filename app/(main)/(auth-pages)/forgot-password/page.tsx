"use client";

import { forgotPasswordAction } from "@/app/(main)/actions";
import { FormMessage, type Message } from "@/components/common/forms";
import { SubmitButton } from "@/components/common/forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ForgotPassword() {
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
    <>
      <form className="flex flex-col min-w-64 max-w-64 mx-auto">
        <h1 className="text-2xl font-medium">Forgot password</h1>
        <p className="text-sm text-foreground">
          Enter your email address and we will send you a link to reset your
          password.
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8 w-full">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <input
            type="hidden"
            name="callbackUrl"
            value="/protected/reset-password"
          />
          <SubmitButton
            formAction={forgotPasswordAction}
            pendingText="Sending email..."
          >
            Send reset email
          </SubmitButton>
          <div className="text-center">
            <Link className="text-xs text-foreground underline" href="/sign-in">
              Back to sign in
            </Link>
          </div>
          {message && <FormMessage message={message} />}
        </div>
      </form>
    </>
  );
}
