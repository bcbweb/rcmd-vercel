"use client";

import Link from "next/link";
import {
  Rows3,
  SquarePlus,
  Link as LinkIcon,
  BriefcaseBusiness
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button title="Add item" className="outline-none">
          <SquarePlus className="mr-2 h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="px-2 py-1.5 text-sm font-medium">
          Add item
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/protected/profile/rcmds" className="flex items-center cursor-pointer">
              <Rows3 className="mr-2 h-4 w-4" />
              RCMD
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/protected/profile/rcmds" className="flex items-center cursor-pointer">
              <LinkIcon className="mr-2 h-4 w-4" />
              Link
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/protected/profile/rcmds" className="flex items-center cursor-pointer">
              <BriefcaseBusiness className="mr-2 h-4 w-4" />
              Business
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}