import Header from "@/components/layout/header";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import Modals from "@/components/global-modals";
import { createClient } from "@/utils/supabase/server";
import { RootAuthInitializer } from "@/components/root-auth-initializer";
import "../globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "RCMD",
  description: "Recommend your world",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RootAuthInitializer initialSession={{ userId: user?.id || null }} />

          <Header />
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col items-center">
              <div className="w-full flex flex-col gap-20 p-5">
                {children}
              </div>
              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
                <p>RCMD is powered by NEXU. RCMD is a trading name of Recommend Ltd. 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, UK. Registration No: 12578369. Copyright © 2021 All rights reserved.</p>
                <ThemeSwitcher />
              </footer>
            </div>
          </main>
        </ThemeProvider>
        <Modals />
      </body>
    </html>
  );
}