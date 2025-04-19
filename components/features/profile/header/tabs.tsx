"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Home } from "lucide-react";
import AddPageModal from "../modals/add-page-modal";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { RenamePageModal } from "../modals/rename-page-modal";
import { DeletePageModal } from "../modals/delete-page-modal";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

interface ProfileTab {
  name: string;
  href: string;
  key: string;
}

interface CustomPage {
  id: string;
  name: string;
  slug: string;
  profile_id?: string;
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
  defaultPageType: string | null;
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
  defaultPageType,
  onPageDeleted,
  onPageRenamed,
  onMakeDefault,
}: ProfileTabsProps) {
  // Check if we're on a custom page path
  const isOnCustomPagePath = currentPath.includes("/protected/profile/pages/");

  const getPageSlugFromPath = () => {
    if (isOnCustomPagePath) {
      const parts = currentPath.split("/");
      return parts[parts.length - 1];
    }
    return null;
  };

  // Get the slug from the path if we're on a custom page
  const currentPageSlug = getPageSlugFromPath();

  // Find which tab should be active based on the current path
  const getActiveTabKey = () => {
    if (isOnCustomPagePath) return "custom";

    for (const tab of tabs) {
      if (currentPath === tab.href) {
        return tab.key;
      }
    }

    // Default tab handling
    if (defaultPageType && defaultPageId) {
      return defaultPageType;
    }

    return tabs[0]?.key;
  };

  const activeTabKey = getActiveTabKey();

  const [renamingPage, setRenamingPage] = useState<CustomPage | null>(null);
  const [deletingPage, setDeletingPage] = useState<CustomPage | null>(null);
  const pathname = usePathname();
  const [localPages, setLocalPages] = useState<CustomPage[]>(customPages);
  const [localDefaultPageId, setLocalDefaultPageId] = useState<string | null>(
    defaultPageId
  );
  const [localDefaultPageType, setLocalDefaultPageType] = useState<
    string | null
  >(defaultPageType);
  const userId = useAuthStore((state) => state.userId);

  // Save profile ID in a ref to avoid infinite loops
  const profileIdRef = useRef<string | null>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalPages(customPages);
    setLocalDefaultPageId(defaultPageId);
    setLocalDefaultPageType(defaultPageType);

    // Extract profile ID if available from custom pages
    if (customPages.length > 0 && customPages[0].profile_id) {
      profileIdRef.current = customPages[0].profile_id;
    }
  }, [customPages, defaultPageId, defaultPageType]);

  // Set up real-time subscriptions to profile page updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const supabase = createClient();
      // If we don't have profile ID from pages, get it from the auth user
      if (!profileIdRef.current) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, default_page_id, default_page_type")
            .eq("auth_user_id", userId)
            .single();

          if (profile) {
            profileIdRef.current = profile.id;
            // While we have fresh data, update local state
            if (
              profile.default_page_id !== localDefaultPageId ||
              profile.default_page_type !== localDefaultPageType
            ) {
              setLocalDefaultPageId(profile.default_page_id);
              setLocalDefaultPageType(profile.default_page_type);
            }
          } else {
            return; // Can't continue without profile ID
          }
        } catch (error) {
          return;
        }
      }

      // Now set up the subscriptions with the valid profile ID
      const profileId = profileIdRef.current;

      // Listen for page renames and modifications
      const pagesSubscription = supabase
        .channel("tabs-page-updates")
        .on(
          "postgres_changes",
          {
            event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "profile_pages",
            filter: `profile_id=eq.${profileId}`,
          },
          (payload) => {
            // Handle different types of events
            if (payload.eventType === "INSERT") {
              // New page added
              if (payload.new) {
                setLocalPages((current) => [
                  ...current,
                  payload.new as CustomPage,
                ]);
              }
            } else if (payload.eventType === "UPDATE") {
              // Page updated (e.g., name changed)
              if (payload.new && payload.old) {
                setLocalPages((current) =>
                  current.map((page) =>
                    page.id === payload.new.id
                      ? { ...page, ...payload.new }
                      : page
                  )
                );
              }
            } else if (payload.eventType === "DELETE") {
              // Page deleted
              if (payload.old) {
                setLocalPages((current) =>
                  current.filter((page) => page.id !== payload.old.id)
                );

                // If the deleted page was the default page, update default page state
                if (
                  localDefaultPageId === payload.old.id &&
                  localDefaultPageType === "custom"
                ) {
                  setLocalDefaultPageId(null);
                  setLocalDefaultPageType(null);
                }
              }
            }
          }
        )
        .subscribe();

      // Listen for default page changes
      const profileSubscription = supabase
        .channel("tabs-default-page-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${profileId}`,
          },
          (payload) => {
            if (payload.new) {
              setLocalDefaultPageId(payload.new.default_page_id);
              setLocalDefaultPageType(payload.new.default_page_type);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(pagesSubscription);
        supabase.removeChannel(profileSubscription);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
    };
  }, [userId, localDefaultPageId, localDefaultPageType]);

  // Function to handle page context menu options
  const handlePageMenu = (
    page: CustomPage,
    action: "rename" | "delete" | "default"
  ) => {
    if (action === "rename") {
      setRenamingPage(page);
    } else if (action === "delete") {
      setDeletingPage(page);
    } else if (action === "default") {
      // Call the parent's onMakeDefault function
      onMakeDefault(page.id);
    }
  };

  const sortedCustomPages = [...localPages].sort((a, b) => {
    if (a.id === localDefaultPageId) return -1;
    if (b.id === localDefaultPageId) return 1;
    return 0;
  });

  return (
    <div className="mt-4 overflow-x-auto">
      <nav className="flex space-x-8 min-w-max">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.href;
          const isDefault = localDefaultPageType === tab.key;

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
              <span className="inline-flex items-center">
                {tab.name}
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
          );
        })}

        {sortedCustomPages.map((page) => {
          const pageUrl = `/protected/profile/pages/${page.slug}`;
          const isActive = pathname === pageUrl;
          const isDefault =
            localDefaultPageType === "custom" && page.id === localDefaultPageId;

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

              {/* Optional: Add context menu for page operations */}
              <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md p-1 z-10">
                <button
                  onClick={() => handlePageMenu(page, "default")}
                  className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                >
                  Set as default
                </button>
              </div>
            </div>
          );
        })}

        {localPages.length < 5 && (
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
        hasDefaultPage={!!localDefaultPageId}
      />
    </div>
  );
}
