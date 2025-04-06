"use client";

import Link from "next/link";
import { MainNav } from "./main-nav";
import { mainNavItems } from "@/config/navigation";
import UserMenu, { AuthButtons } from "./header/user-menu";
import { useAuthStore } from "@/stores/auth-store";

export default function Header() {
  // Access auth store to determine whether to show auth buttons
  // reusing the same store that UserMenu uses
  const { userId, isInitialized } = useAuthStore();

  return (
    <header className="border-b relative z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
        {/* Logo and Desktop Nav (left side) */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[#3B82C4] text-2xl font-bold">
            RCMD
          </Link>

          {/* Desktop Navigation - Only visible on desktop */}
          <div className="hidden md:block">
            <MainNav items={mainNavItems} authButtons={null} />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Mobile Navigation Button + User Menu (right side) */}
        <div className="flex items-center">
          {/* Mobile Only Navigation */}
          <div className="md:hidden">
            <MainNav
              items={mainNavItems}
              authButtons={
                !userId && isInitialized ? (
                  <AuthButtons className="flex-col items-start gap-4" />
                ) : null
              }
            />
          </div>

          {/* User Menu (with desktop auth buttons inside) */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
