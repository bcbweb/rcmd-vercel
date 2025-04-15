"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PublicProfileBlocks from "./profile-blocks";
import { ProfileBlockType } from "@/types";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

interface ProfilePage {
  id: string;
  name: string;
  slug: string;
  profile_id: string;
  blocks?: ProfileBlockType[];
}

interface ProfileTabsProps {
  profileId: string;
  defaultBlocks: ProfileBlockType[];
  activePage?: ProfilePage;
  defaultPage?: ProfilePage | null;
  activeTab?: string;
  defaultPageType?: string | null;
  defaultPageId?: string | null;
}

export default function ProfileTabs({
  profileId,
  defaultBlocks,
  activePage,
  defaultPage: propDefaultPage,
  activeTab: propActiveTab,
  defaultPageType: propDefaultPageType,
  defaultPageId: propDefaultPageId,
}: ProfileTabsProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const pageSlug = searchParams.get("page");

  // Extract the handle from the pathname (format: /[handle] or /[handle]/[slug])
  const handle = pathname.split("/")[1];

  const [activeTab, setActiveTab] = useState<string>(
    propActiveTab || "default"
  );
  const [pages, setPages] = useState<ProfilePage[]>([]);
  const [defaultPage, setDefaultPage] = useState<ProfilePage | null>(null);
  const [pageBlocks, setPageBlocks] = useState<
    Record<string, ProfileBlockType[]>
  >({});

  const [rcmdBlocks, setRcmdBlocks] = useState<ProfileBlockType[]>([]);
  const [linkBlocks, setLinkBlocks] = useState<ProfileBlockType[]>([]);
  const [collectionBlocks, setCollectionBlocks] = useState<ProfileBlockType[]>(
    []
  );

  const [isLoading, setIsLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [defaultPageType, setDefaultPageType] = useState<string | null>(
    propDefaultPageType || null
  );
  const [defaultPageId, setDefaultPageId] = useState<string | null>(
    propDefaultPageId || null
  );

  // Add a clear, prominent debug log for collections default
  console.log(
    "%c COLLECTIONS DEFAULT CHECK",
    "background: #ff0; color: #000; font-size: 16px",
    {
      defaultPageType,
      defaultPageId,
      propDefaultPageType,
      propDefaultPageId,
      isCollectionsDefault:
        propDefaultPageType === "collection" ||
        defaultPageType === "collection",
    }
  );

  // Log incoming props
  if (process.env.NODE_ENV === "development") {
    console.log("[ProfileTabs] Received props:", {
      profileId,
      defaultBlocksCount: defaultBlocks?.length,
      activePage,
      propDefaultPage,
      propActiveTab,
      propDefaultPageType,
      propDefaultPageId,
    });

    // Force log the default page type to directly check its value
    console.log("DEFAULT PAGE TYPE DIRECT CHECK:", {
      defaultPageType: propDefaultPageType,
      defaultPageId: propDefaultPageId,
      defaultPageAfterState: defaultPageType,
    });
  }

  // Generate URLs for different tabs
  const getTabUrl = (tabKey: string) => {
    if (tabKey === "rcmds" || tabKey === "links" || tabKey === "collections") {
      return `/${handle}/${tabKey}`;
    }

    // For the default page (first page)
    if (defaultPage && tabKey === defaultPage.id) {
      return `/${handle}`;
    }

    // For other pages
    const targetPage = [...(defaultPage ? [defaultPage] : []), ...pages].find(
      (p) => p.id === tabKey
    );
    if (targetPage) {
      return `/${handle}/${targetPage.slug}`;
    }

    return pathname;
  };

  // Fetch all profile pages
  useEffect(() => {
    async function fetchProfilePages() {
      console.log("fetchProfilePages running with:", {
        propDefaultPage,
        activePage,
        profileId,
      });

      // Always fetch all pages for this profile to ensure we have all titles
      setIsLoading(true);
      const supabase = createClient();

      try {
        // Fetch all pages for this profile
        const { data: pagesData, error: pagesError } = await supabase
          .from("profile_pages")
          .select("*")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: true });

        if (pagesError) throw pagesError;

        console.log("Fetched pages data:", pagesData);

        if (pagesData && pagesData.length > 0) {
          // IMPORTANT: Always set all pages properly
          if (pagesData.length === 1) {
            // If only one page, it's the default
            setDefaultPage(pagesData[0]);
            setPages([]);
          } else if (pagesData.length > 1) {
            // First page is default, all others are shown in tabs
            setDefaultPage(pagesData[0]);
            setPages(pagesData.slice(1));
          }

          // If we have defaultBlocks from the parent, assign them to the appropriate page
          if (defaultBlocks.length > 0) {
            // If we have an active page, that's the one receiving blocks
            if (activePage) {
              setPageBlocks((prev) => ({
                ...prev,
                [activePage.id]: defaultBlocks,
              }));
            } else if (propDefaultPage) {
              // If we have a prop default page, assign blocks to it
              setPageBlocks((prev) => ({
                ...prev,
                [propDefaultPage.id]: defaultBlocks,
              }));
            } else if (pagesData[0]) {
              // Otherwise assign to first page
              setPageBlocks((prev) => ({
                ...prev,
                [pagesData[0].id]: defaultBlocks,
              }));
            }
          }

          // Set active tab based on props or current path
          if (propActiveTab) {
            setActiveTab(propActiveTab);
          } else {
            const currentPath = pathname.split("/");

            // Check if we're on a tab path like /[handle]/rcmds
            if (currentPath.length > 2) {
              const tabSlug = currentPath[2];

              if (
                tabSlug === "rcmds" ||
                tabSlug === "links" ||
                tabSlug === "collections"
              ) {
                setActiveTab(tabSlug);
              } else {
                // We're on a page slug, find the matching page
                const matchingPage = pagesData.find(
                  (page) => page.slug === tabSlug
                );
                if (matchingPage) {
                  setActiveTab(matchingPage.id);
                } else if (propDefaultPage) {
                  setActiveTab(propDefaultPage.id);
                } else {
                  // Fallback to first page if no matching page found
                  setActiveTab(pagesData[0].id);
                }
              }
            } else if (currentPath.length === 2 && currentPath[1]) {
              // We're on the handle path (default page)
              if (propDefaultPage) {
                setActiveTab(propDefaultPage.id);
              } else {
                setActiveTab(pagesData[0].id);
              }
            } else {
              // Fallback to default page
              if (propDefaultPage) {
                setActiveTab(propDefaultPage.id);
              } else {
                setActiveTab(pagesData[0].id);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile pages:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfilePages();
  }, [
    profileId,
    defaultBlocks,
    pageSlug,
    activePage,
    propDefaultPage,
    pathname,
    propActiveTab,
  ]);

  // Fetch blocks for active page or content type
  useEffect(() => {
    async function fetchPageContent() {
      // Skip if already loaded, default page, or content tab
      const isContentTab = ["rcmds", "links", "collections"].includes(
        activeTab
      );
      const isPageTab = !isContentTab && activeTab !== "default";

      // For default page, we already have the blocks from props
      if (
        activeTab === "default" ||
        (defaultPage && activeTab === defaultPage.id && pageBlocks[activeTab])
      ) {
        return;
      }

      // Skip if we already have this page's blocks loaded
      if (
        isPageTab &&
        pageBlocks[activeTab] &&
        pageBlocks[activeTab].length > 0
      ) {
        return;
      }

      setContentLoading(true);
      const supabase = createClient();

      try {
        if (isPageTab) {
          // Fetch blocks for the specific page
          const { data, error } = await supabase
            .from("profile_blocks")
            .select("*")
            .eq("profile_id", profileId)
            .eq("page_id", activeTab)
            .order("display_order", { ascending: true });

          if (error) throw error;
          setPageBlocks((prev) => ({
            ...prev,
            [activeTab]: data || [],
          }));
        } else {
          // Fetch blocks for a content type
          const blockType =
            activeTab === "rcmds"
              ? "rcmd"
              : activeTab === "links"
                ? "link"
                : "collection";

          const { data, error } = await supabase
            .from("profile_blocks")
            .select("*")
            .eq("profile_id", profileId)
            .eq("type", blockType)
            .order("display_order", { ascending: true });

          if (error) throw error;

          if (activeTab === "rcmds") {
            setRcmdBlocks(data || []);
          } else if (activeTab === "links") {
            setLinkBlocks(data || []);
          } else if (activeTab === "collections") {
            setCollectionBlocks(data || []);
          }
        }
      } catch (error) {
        console.error(`Error fetching content for tab ${activeTab}:`, error);
      } finally {
        setContentLoading(false);
      }
    }

    fetchPageContent();
  }, [activeTab, profileId, defaultPage, pageBlocks]);

  // Fetch profile info to get default page type and ID
  useEffect(() => {
    async function fetchProfileInfo() {
      // Skip if we already have default page info from props
      if (
        propDefaultPageType !== undefined ||
        propDefaultPageId !== undefined
      ) {
        return;
      }

      if (!profileId) return;

      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("default_page_type, default_page_id")
          .eq("id", profileId)
          .single();

        if (error) {
          console.error("Error fetching profile default page info:", error);
          return;
        }

        if (data) {
          setDefaultPageType(data.default_page_type || null);
          setDefaultPageId(data.default_page_id || null);
        }
      } catch (error) {
        console.error("Error in fetchProfileInfo:", error);
      }
    }

    fetchProfileInfo();
  }, [profileId, propDefaultPageType, propDefaultPageId]);

  useEffect(() => {
    // Debug logs
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      if (defaultPage?.name) {
        console.log("Rendering default page tab:", defaultPage.name);
      }
      if (pages.length > 0) {
        console.log(
          "Pages state for tabs:",
          pages.map((p) => p.name)
        );
      }
    }
  }, [defaultPage, pages]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 h-10 rounded-full w-full max-w-md mx-auto mb-6"></div>
        <div className="space-y-8">
          <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
      <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 flex w-full max-w-3xl mx-auto rounded-full overflow-x-auto flex-nowrap">
        {/* Default page tab */}
        {defaultPage && (
          <>
            <Link href={getTabUrl(defaultPage.id)} passHref legacyBehavior>
              <TabsTrigger
                value={defaultPage.id}
                className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                asChild
              >
                <a className="inline-flex items-center">
                  {defaultPage.name || "Home"}
                  {/* Default page icon */}
                  {((defaultPageType === "custom" &&
                    defaultPageId === defaultPage.id) ||
                    (!defaultPageType && !defaultPageId && defaultPage)) && (
                    <Home className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
                  )}
                </a>
              </TabsTrigger>
            </Link>
          </>
        )}

        {/* Other pages tabs */}
        {pages.length > 0 ? (
          pages.map((page) => (
            <Link
              href={getTabUrl(page.id)}
              passHref
              legacyBehavior
              key={page.id}
            >
              <TabsTrigger
                value={page.id}
                className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                asChild
              >
                <a className="inline-flex items-center">
                  {page.name}
                  {/* Show home icon if this is the default page */}
                  {defaultPageType === "custom" &&
                    defaultPageId === page.id && (
                      <Home className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
                    )}
                </a>
              </TabsTrigger>
            </Link>
          ))
        ) : (
          <div className="text-xs text-gray-500 py-1">No custom pages.</div>
        )}

        {/* Content type tabs */}
        <Link href={getTabUrl("rcmds")} passHref legacyBehavior>
          <TabsTrigger
            value="rcmds"
            className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            asChild
          >
            <a className="inline-flex items-center">
              RCMDs
              {/* Show home icon if rcmds is default */}
              {defaultPageType === "rcmd" && (
                <Home className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
              )}
            </a>
          </TabsTrigger>
        </Link>
        <Link href={getTabUrl("links")} passHref legacyBehavior>
          <TabsTrigger
            value="links"
            className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            asChild
          >
            <a className="inline-flex items-center">
              Links
              {/* Show home icon if links is default */}
              {defaultPageType === "link" && (
                <Home className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
              )}
            </a>
          </TabsTrigger>
        </Link>
        <Link href={getTabUrl("collections")} passHref legacyBehavior>
          <TabsTrigger
            value="collections"
            className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            asChild
          >
            <a className="inline-flex items-center">
              Collections
              {/* Show home icon if collections is default */}
              {defaultPageType === "collection" && (
                <Home className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
              )}
            </a>
          </TabsTrigger>
        </Link>
      </TabsList>

      {/* Default page content */}
      {defaultPage && (
        <TabsContent value={defaultPage.id} className="space-y-4">
          {pageBlocks[defaultPage.id]?.length > 0 ? (
            <PublicProfileBlocks blocks={pageBlocks[defaultPage.id]} />
          ) : (
            <div className="text-center py-10 text-gray-500">
              This profile doesn't have any content on their default page yet.
            </div>
          )}
        </TabsContent>
      )}

      {/* Other pages content */}
      {pages.map((page) => (
        <TabsContent key={page.id} value={page.id} className="space-y-4">
          {contentLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : pageBlocks[page.id]?.length > 0 ? (
            <PublicProfileBlocks blocks={pageBlocks[page.id]} />
          ) : (
            <div className="text-center py-10 text-gray-500">
              This profile doesn't have any content on this page yet.
            </div>
          )}
        </TabsContent>
      ))}

      {/* Content type tabs content */}
      <TabsContent value="rcmds" className="space-y-4">
        {contentLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : rcmdBlocks.length > 0 ? (
          <PublicProfileBlocks blocks={rcmdBlocks} />
        ) : (
          <div className="text-center py-10 text-gray-500">
            This profile doesn't have any RCMDs yet.
          </div>
        )}
      </TabsContent>

      <TabsContent value="links" className="space-y-4">
        {contentLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : linkBlocks.length > 0 ? (
          <PublicProfileBlocks blocks={linkBlocks} />
        ) : (
          <div className="text-center py-10 text-gray-500">
            This profile doesn't have any Links yet.
          </div>
        )}
      </TabsContent>

      <TabsContent value="collections" className="space-y-4">
        {contentLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : collectionBlocks.length > 0 ? (
          <PublicProfileBlocks blocks={collectionBlocks} />
        ) : (
          <div className="text-center py-10 text-gray-500">
            This profile doesn't have any Collections yet.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
