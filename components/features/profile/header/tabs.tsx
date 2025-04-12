import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Pencil, Trash, Home } from "lucide-react";
import AddPageModal from "../modals/add-page-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { RenamePageModal } from "../modals/rename-page-modal";
import { DeletePageModal } from "../modals/delete-page-modal";

interface ProfileTab {
  name: string;
  href: string;
}

interface CustomPage {
  id: string;
  name: string;
  slug: string;
}

interface ProfileTabsProps {
  tabs: ProfileTab[];
  customPages: CustomPage[];
  currentPath: string;
  onAddPage: (pageName: string) => Promise<boolean>;
  isAddingPage: boolean;
  onStartAddPage: () => void;
  onCancelAdd: () => void;
  defaultPageId: string | null;
  onPageDeleted: (deletedPageId: string) => void;
  onPageRenamed: () => void;
  onMakeDefault: (pageId: string) => void;
}

export function ProfileTabs({
  tabs,
  customPages,
  currentPath,
  onAddPage,
  isAddingPage,
  onStartAddPage,
  onCancelAdd,
  defaultPageId,
  onPageDeleted,
  onPageRenamed,
  onMakeDefault,
}: ProfileTabsProps) {
  const [renamingPage, setRenamingPage] = useState<CustomPage | null>(null);
  const [deletingPage, setDeletingPage] = useState<CustomPage | null>(null);
  const pathname = usePathname();

  const sortedCustomPages = [...customPages].sort((a, b) => {
    if (a.id === defaultPageId) return -1;
    if (b.id === defaultPageId) return 1;
    return 0;
  });

  return (
    <div className="mt-4 overflow-x-auto">
      <nav className="flex space-x-8 min-w-max">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }
              `}
            >
              {tab.name}
            </Link>
          );
        })}

        {sortedCustomPages.map((page) => {
          const pageUrl = `/protected/profile/pages/${page.slug}`;
          const isActive = pathname === pageUrl;
          const isDefault = page.id === defaultPageId;

          return (
            <div key={page.id} className="flex items-center group relative">
              <Link
                href={pageUrl}
                className={`
                  relative inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    isActive
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                  }
                `}
              >
                <span className="inline-flex items-center">
                  {page.name}
                  {isDefault && (
                    <span
                      className="inline-flex ml-1.5"
                      aria-label="Default page"
                    >
                      <Home className="h-3.5 w-3.5 text-amber-500" />
                    </span>
                  )}
                </span>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild className="ml-1 -mr-1.5">
                  <button
                    className="inline-flex items-center justify-center rounded-full p-1
          text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-colors h-6 w-6"
                  >
                    <MoreVertical className="h-4 w-4 relative top-[1px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isDefault && (
                    <DropdownMenuItem onClick={() => onMakeDefault(page.id)}>
                      <Home className="mr-2 h-4 w-4 text-amber-500" />
                      Set as Default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setRenamingPage(page)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeletingPage(page)}
                    className="text-red-600 focus:text-red-700 dark:text-red-400"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}

        {customPages.length < 5 && (
          <div className="relative border-b-2 border-transparent flex items-center">
            <Button
              onClick={onStartAddPage}
              className="flex items-center gap-2 h-[42px] -mb-[2px]"
            >
              <PlusCircle className="w-4 h-4" />
              Add page
            </Button>
          </div>
        )}
      </nav>

      <RenamePageModal
        page={renamingPage}
        isOpen={!!renamingPage}
        onClose={() => setRenamingPage(null)}
        onSuccess={() => {
          onPageRenamed();
          setRenamingPage(null);
        }}
      />

      <DeletePageModal
        page={deletingPage}
        isOpen={!!deletingPage}
        onClose={() => setDeletingPage(null)}
        onSuccess={() => {
          if (deletingPage) {
            onPageDeleted(deletingPage.id);
            setDeletingPage(null);
          }
        }}
      />

      <AddPageModal
        isOpen={isAddingPage}
        onClose={onCancelAdd}
        onAdd={onAddPage}
      />
    </div>
  );
}
