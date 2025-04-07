import Header from "@/components/layout/header";
import { GlobalModals } from "@/components/common/modals";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { RootAuthInitializer } from "@/components/features/auth";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import "../globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "RCMD",
  description: "Recommend your world",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
          <footer className="px-6 py-2 flex justify-between items-center text-xs text-gray-500 relative w-full border-t">
            <div>© {new Date().getFullYear()} RCMD</div>
            <ThemeSwitcher />
          </footer>
          <RootAuthInitializer initialSession={{ userId: user?.id || null }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
