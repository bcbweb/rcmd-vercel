import Link from "next/link";
import AuthButtons from "@/components/header-auth";
import { MainNav } from "./main-nav";
import { mainNavItems } from "@/config/navigation";

export default function Header() {
  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[#3B82C4] text-2xl font-bold">
            RCMD
          </Link>
          <MainNav items={mainNavItems} />
        </div>
        <AuthButtons />
      </div>
    </header>
  );
}