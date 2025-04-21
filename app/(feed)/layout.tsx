import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { RootAuthInitializer } from "@/components/features/auth";
import "../globals.css";

// Determine the base URL for metadata and Open Graph/Twitter images
const metadataBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  (process.env.NEXT_PUBLIC_VERCEL_URL &&
    `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`) ||
  "https://rcmd.app";

export const metadata = {
  metadataBase: new URL(metadataBaseUrl),
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default async function FeedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-black">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RootAuthInitializer initialSession={{ userId: user?.id || null }} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
