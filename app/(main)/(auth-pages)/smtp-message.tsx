import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function SmtpMessage() {
  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-5 py-3 rounded-md flex items-start gap-3 w-full">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mt-0.5 text-blue-600"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex flex-col gap-1">
        <div className="text-sm">
          <strong>Note:</strong> Emails are rate limited. Enable Custom SMTP to
          increase the rate limit.
        </div>
        <div>
          <Link
            href="https://supabase.com/docs/guides/auth/auth-smtp"
            target="_blank"
            className="text-blue-600 hover:text-blue-700 flex items-center text-sm gap-1"
          >
            Learn more <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
