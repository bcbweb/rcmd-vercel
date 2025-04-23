"use client";

import { usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PublicProfileBlocks from "./profile-blocks";
import type { Collection, ProfileBlockType, RCMD, Link } from "@/types";
import NextLink from "next/link";
import { useState } from "react";

// We need to use type assertions to handle the direct entities

interface ProfilePage {
  id: string;
  name: string;
  slug: string;
  profile_id: string;
}

interface ProfileTabsServerProps {
  handle: string;
  pages: ProfilePage[];
  defaultPage: ProfilePage | null;
  pageBlocks: Record<string, ProfileBlockType[]>;
  rcmdBlocks: RCMD[];
  linkBlocks: Link[];
  collectionBlocks: Collection[];
  defaultPageType?: string;
}

// Define a more specific extended block type
interface ExtendedProfileBlock extends ProfileBlockType {
  entity_id?: string;
  rcmds?: RCMD;
  [key: string]: unknown;
}

export default function ProfileTabsServer({
  handle,
  pages,
  defaultPage,
  pageBlocks,
  rcmdBlocks,
  linkBlocks,
  collectionBlocks,
  defaultPageType = "custom",
}: ProfileTabsServerProps) {
  const pathname = usePathname();

  // Determine the active tab based on the current path
  const determineActiveTab = () => {
    // For the root profile path, return the default page
    if (pathname === `/${handle}`) {
      if (defaultPageType === "rcmd") return "rcmds";
      if (defaultPageType === "link") return "links";
      if (defaultPageType === "collection") return "collections";
      return defaultPage?.id || "";
    }

    // For the rcmds/links/collections paths
    if (pathname === `/${handle}/rcmds`) return "rcmds";
    if (pathname === `/${handle}/links`) return "links";
    if (pathname === `/${handle}/collections`) return "collections";

    // For custom pages, find the page by slug
    const slug = pathname.split("/").pop();
    const matchingPage = [...(defaultPage ? [defaultPage] : []), ...pages].find(
      (p) => p.slug === slug
    );
    return matchingPage?.id || "";
  };

  const [activeTab, setActiveTab] = useState<string>(determineActiveTab());

  // Get the URL for a given tab
  const getTabUrl = (tabKey: string) => {
    // For content type tabs
    if (tabKey === "rcmds") {
      return `/${handle}/rcmds`;
    }
    if (tabKey === "links") {
      return `/${handle}/links`;
    }
    if (tabKey === "collections") {
      return `/${handle}/collections`;
    }

    // For default page - if this is the homepage
    if (
      defaultPage &&
      tabKey === defaultPage.id &&
      defaultPageType === "custom"
    ) {
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Generate URL based on tab value
    let url = `/${handle}`;
    if (value !== defaultPage?.name) {
      if (value === "rcmds" || value === "links" || value === "collections") {
        url = `/${handle}/${value}`;
      } else {
        // For custom pages
        url = `/${handle}/${value}`;
      }
    }

    // Only redirect if we're not already on that path
    if (pathname !== url) {
      window.location.href = url;
    }
  };

  return (
    <div className="w-full">
      <Tabs
        defaultValue={activeTab}
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 flex w-full max-w-3xl mx-auto rounded-full overflow-x-auto flex-nowrap">
          {/* Default page tab */}
          {defaultPage && (
            <NextLink href={getTabUrl(defaultPage.id)} passHref>
              <TabsTrigger
                value={defaultPage.id}
                className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
              >
                {defaultPage.name || "Home"}
              </TabsTrigger>
            </NextLink>
          )}

          {/* Other pages tabs */}
          {pages && pages.length > 0 ? (
            pages.map((page) => (
              <NextLink key={page.id} href={getTabUrl(page.id)} passHref>
                <TabsTrigger
                  value={page.id}
                  className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                >
                  {page.name}
                </TabsTrigger>
              </NextLink>
            ))
          ) : (
            <div className="text-xs text-gray-500 py-1">No custom pages.</div>
          )}

          {/* Content type tabs */}
          <NextLink href={getTabUrl("rcmds")} passHref>
            <TabsTrigger
              value="rcmds"
              className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              RCMDs
            </TabsTrigger>
          </NextLink>
          <NextLink href={getTabUrl("links")} passHref>
            <TabsTrigger
              value="links"
              className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              Links
            </TabsTrigger>
          </NextLink>
          <NextLink href={getTabUrl("collections")} passHref>
            <TabsTrigger
              value="collections"
              className="flex-1 whitespace-nowrap rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            >
              Collections
            </TabsTrigger>
          </NextLink>
        </TabsList>

        {/* Default content based on defaultPageType - shown when on the main profile page */}
        {pathname.split("/").length === 2 && (
          <>
            {defaultPageType === "rcmd" && (
              <TabsContent
                value="rcmds"
                className="min-h-[300px] rounded-md pt-6"
              >
                {rcmdBlocks && rcmdBlocks.length > 0 ? (
                  <PublicProfileBlocks
                    blocks={rcmdBlocks as unknown as ProfileBlockType[]}
                  />
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    This profile doesn't have any RCMDs yet.
                  </div>
                )}
              </TabsContent>
            )}

            {defaultPageType === "link" && (
              <TabsContent value="links" className="space-y-4">
                {linkBlocks && linkBlocks.length > 0 ? (
                  <PublicProfileBlocks
                    blocks={linkBlocks as unknown as ProfileBlockType[]}
                  />
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    This profile doesn't have any Links yet.
                  </div>
                )}
              </TabsContent>
            )}

            {defaultPageType === "collection" && (
              <TabsContent value="collections" className="space-y-4">
                {collectionBlocks && collectionBlocks.length > 0 ? (
                  <PublicProfileBlocks
                    blocks={collectionBlocks as unknown as ProfileBlockType[]}
                  />
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    This profile doesn't have any Collections yet.
                  </div>
                )}
              </TabsContent>
            )}

            {defaultPageType === "custom" && defaultPage && (
              <TabsContent value={defaultPage.id} className="space-y-4">
                {pageBlocks &&
                defaultPage &&
                pageBlocks[defaultPage.id]?.length > 0 ? (
                  <PublicProfileBlocks blocks={pageBlocks[defaultPage.id]} />
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    This profile doesn't have any content on their default page
                    yet.
                  </div>
                )}
              </TabsContent>
            )}
          </>
        )}

        {/* Default page content when it's explicitly selected */}
        {defaultPage && (
          <TabsContent value={defaultPage.id} className="space-y-4">
            {pageBlocks &&
            defaultPage &&
            pageBlocks[defaultPage.id]?.length > 0 ? (
              <PublicProfileBlocks blocks={pageBlocks[defaultPage.id]} />
            ) : (
              <div className="text-center py-10 text-gray-500">
                This profile doesn't have any content on their default page yet.
              </div>
            )}
          </TabsContent>
        )}

        {/* Other pages content */}
        {pages &&
          pages.map((page) => (
            <TabsContent key={page.id} value={page.id} className="space-y-4">
              {pageBlocks && pageBlocks[page.id]?.length > 0 ? (
                <PublicProfileBlocks
                  blocks={pageBlocks[page.id].map((block) => {
                    // For RCMD blocks, add the actual RCMD entity data if available
                    if (block.type === "rcmd") {
                      const extendedBlock = block as ExtendedProfileBlock;
                      if (extendedBlock.entity_id) {
                        const rcmd = rcmdBlocks.find(
                          (r) => r.id === extendedBlock.entity_id
                        );
                        if (rcmd) {
                          return {
                            ...extendedBlock,
                            rcmds: rcmd,
                          };
                        }
                      }
                    }
                    return block;
                  })}
                />
              ) : (
                <div className="text-center py-10 text-gray-500">
                  This page doesn't have any content yet.
                </div>
              )}
            </TabsContent>
          ))}

        {/* Content type tabs content */}
        <TabsContent value="rcmds" className="min-h-[300px] rounded-md pt-6">
          {rcmdBlocks && rcmdBlocks.length > 0 ? (
            <PublicProfileBlocks
              blocks={rcmdBlocks as unknown as ProfileBlockType[]}
            />
          ) : (
            <div className="text-center py-10 text-gray-500">
              This profile doesn't have any RCMDs yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          {linkBlocks && linkBlocks.length > 0 ? (
            <PublicProfileBlocks
              blocks={linkBlocks as unknown as ProfileBlockType[]}
            />
          ) : (
            <div className="text-center py-10 text-gray-500">
              This profile doesn't have any Links yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          {collectionBlocks && collectionBlocks.length > 0 ? (
            <PublicProfileBlocks
              blocks={collectionBlocks as unknown as ProfileBlockType[]}
            />
          ) : (
            <div className="text-center py-10 text-gray-500">
              This profile doesn't have any Collections yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
