import Link from "next/link";
import { MainNav } from "./main-nav";
import { mainNavItems } from "@/config/navigation";
import UserMenu from "./user-menu";

export default function Header() {
  return (
    <header className="border-b relative z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[#3B82C4] text-2xl font-bold">
            RCMD
          </Link>
          <MainNav items={mainNavItems} />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
