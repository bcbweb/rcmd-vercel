"use client";

import Link from "next/link";
import { MainNav } from "./main-nav";
import UserMenu, { AuthButtons } from "./user-menu";
import { ModeToggle } from "@/components/ui/mode-toggle";
import MobileMenu from "./mobile-menu";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

export default function Header() {
  const { status } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Only show auth-specific components after component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("Header - Current auth status:", status);
  }, [status]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <span className="hidden font-bold sm:inline-block">RCMD</span>
        </Link>
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            {mounted &&
              (status === "authenticated" ? <UserMenu /> : <AuthButtons />)}
            <MobileMenu />
          </nav>
        </div>
      </div>
    </header>
  );
}
