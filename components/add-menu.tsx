"use client";

import { useRouter } from "next/navigation";
import {
  Rows3,
  SquarePlus,
  Link as LinkIcon,
  // BriefcaseBusiness
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModalStore } from "@/stores/modal-store";

export default function UserMenu() {
  const router = useRouter();

  const handleRCMDClick = () => {
    try {
      useModalStore.setState(
        {
          isRCMDModalOpen: true,
          onModalSuccess: () => router.push('/protected/profile/rcmds')
        },
        false,
        'modal/handleRCMDClick'
      );
    } catch (error) {
      console.error("Error in handleRCMDClick:", error);
      useModalStore.setState({}, false, 'modal/handleRCMDClick/error');
    }
  };

  const handleLinkClick = () => {
    try {
      useModalStore.setState(
        {
          isLinkModalOpen: true,
          onModalSuccess: () => router.push('/protected/profile/links')
        },
        false,
        'modal/handleLinkClick'
      );
    } catch (error) {
      console.error("Error in handleLinkClick:", error);
      useModalStore.setState({}, false, 'modal/handleLinkClick/error');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Add item"
          className="outline-none cursor-pointer"
        >
          <SquarePlus className="mr-2 h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="px-2 py-1.5 text-sm font-medium">
          Add item
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={handleRCMDClick}
            className="cursor-pointer flex items-center"
          >
            <Rows3 className="mr-2 h-4 w-4" />
            RCMD
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleLinkClick}
            className="cursor-pointer flex items-center"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Link
          </DropdownMenuItem>
          {/* <DropdownMenuItem asChild>
            <Link href="/protected/profile/rcmds" className="flex items-center cursor-pointer">
              <BriefcaseBusiness className="mr-2 h-4 w-4" />
              Business
            </Link>
          </DropdownMenuItem> */}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}