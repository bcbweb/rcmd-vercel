import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { RootAuthInitializer } from "@/components/features/auth";
import "../globals.css";

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
