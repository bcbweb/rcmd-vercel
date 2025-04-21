import Header from "@/components/layout/header";
import { GlobalModals } from "@/components/common/modals";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { RootAuthInitializer } from "@/components/features/auth";
import "../globals.css";
import FooterWrapper from "@/components/layout/footer/footer-wrapper";

// Determine the base URL for metadata and Open Graph/Twitter images
const metadataBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  (process.env.NEXT_PUBLIC_VERCEL_URL &&
    `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`) ||
  "https://rcmd.app";

export const metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: "RCMD",
  description: "Recommend your world",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
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
      <body
        className={`${GeistSans.className} antialiased bg-background flex flex-col relative min-h-screen`}
      >
        <ThemeProvider attribute="class" enableSystem>
          <Header />
          <div className="flex-1 mx-auto w-full">{children}</div>
          <GlobalModals />
          <FooterWrapper />
          <RootAuthInitializer initialSession={{ userId: user?.id || null }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
