"use client";

import { useRouter } from "next/navigation";
import { Rows3, SquarePlus, Link as LinkIcon, FolderPlus } from "lucide-react";
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
      // Close dropdown first to avoid UI stacking issues
      // Then open modal after DOM updates
      setTimeout(() => {
        useModalStore.setState(
          {
            isRCMDModalOpen: true,
            onModalSuccess: () => router.push("/protected/profile/rcmds"),
          },
          false,
          "modal/handleRCMDClick"
        );
      }, 10);
    } catch (error) {
      console.error("Error in handleRCMDClick:", error);
      useModalStore.setState({}, false, "modal/handleRCMDClick/error");
    }
  };

  const handleLinkClick = () => {
    try {
      // Close dropdown first to avoid UI stacking issues
      // Then open modal after DOM updates
      setTimeout(() => {
        useModalStore.setState(
          {
            isLinkModalOpen: true,
            onModalSuccess: () => router.push("/protected/profile/links"),
          },
          false,
          "modal/handleLinkClick"
        );
      }, 10);
    } catch (error) {
      console.error("Error in handleLinkClick:", error);
      useModalStore.setState({}, false, "modal/handleLinkClick/error");
    }
  };

  const handleCollectionClick = () => {
    try {
      // Close dropdown first to avoid UI stacking issues
      // Then open modal after DOM updates
      setTimeout(() => {
        useModalStore.setState(
          {
            isCollectionModalOpen: true,
            onModalSuccess: () => router.push("/protected/profile/collections"),
          },
          false,
          "modal/handleCollectionClick"
        );
      }, 10);
    } catch (error) {
      console.error("Error in handleCollectionClick:", error);
      useModalStore.setState({}, false, "modal/handleCollectionClick/error");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button title="Add item" className="outline-none cursor-pointer">
          <SquarePlus className="mr-2 h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="px-2 py-1.5 text-sm font-medium">Add item</div>
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
          <DropdownMenuItem
            onSelect={handleCollectionClick}
            className="cursor-pointer flex items-center"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Collection
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
