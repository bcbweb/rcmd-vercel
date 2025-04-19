"use client";

import { ProfileBlockType } from "@/types";
import { Suspense, useEffect, useState } from "react";
import ProfileTabs from "@/components/features/profile/public/profile-tabs";
import { createClient } from "@/utils/supabase/client";

interface WrapperProfilePage {
  id: string;
  name: string;
  slug: string;
}

interface TabsProfilePage extends WrapperProfilePage {
  profile_id: string;
  blocks?: ProfileBlockType[];
}

interface ProfileTabsWrapperProps {
  profileId: string;
  defaultBlocks: ProfileBlockType[];
  activePage?: WrapperProfilePage;
  defaultPage?: WrapperProfilePage | null;
  activeTab?: string;
}

export default function ProfileTabsWrapper({
  profileId,
  defaultBlocks,
  activePage,
  defaultPage,
  activeTab,
}: ProfileTabsWrapperProps) {
  const [defaultPageType, setDefaultPageType] = useState<string | null>(null);
  const [defaultPageId, setDefaultPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedActivePage, setUpdatedActivePage] = useState<
    WrapperProfilePage | undefined
  >(activePage);
  const [updatedDefaultPage, setUpdatedDefaultPage] =
    useState<WrapperProfilePage | null>(defaultPage || null);

  useEffect(() => {
    async function fetchProfileDefaultInfo() {
      if (!profileId) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("default_page_type, default_page_id")
          .eq("id", profileId)
          .single();

        if (error) {
          console.error("Error fetching profile default info:", error);
          return;
        }

        if (data) {
          // Use the actual values from database
          setDefaultPageType(data.default_page_type || null);
          setDefaultPageId(data.default_page_id || null);
        }
      } catch (err) {
        console.error("Error in fetchProfileDefaultInfo:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileDefaultInfo();

    // Set up real-time subscriptions
    const supabase = createClient();

    // Subscribe to profile changes (for default page changes)
    const profileSubscription = supabase
      .channel("profile-default-changes")
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
            const { default_page_type, default_page_id } = payload.new;
            setDefaultPageType(default_page_type || null);
            setDefaultPageId(default_page_id || null);
          }
        }
      )
      .subscribe();

    // Subscribe to page changes (for page name updates)
    const pagesSubscription = supabase
      .channel("page-name-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profile_pages",
          filter: `profile_id=eq.${profileId}`,
        },
        async (payload) => {
          if (payload.new) {
            const updatedPage = payload.new as WrapperProfilePage;

            // Update the active page if it's the one that was changed
            if (activePage && activePage.id === updatedPage.id) {
              setUpdatedActivePage({
                ...activePage,
                name: updatedPage.name,
                slug: updatedPage.slug,
              });
            }

            // Update the default page if it's the one that was changed
            if (defaultPage && defaultPage.id === updatedPage.id) {
              setUpdatedDefaultPage({
                ...defaultPage,
                name: updatedPage.name,
                slug: updatedPage.slug,
              });
            }

            // Fetch all pages to ensure the tabs list is up-to-date
            // This is more efficient than a full page reload
            await fetchProfilePages();
          }
        }
      )
      .subscribe();

    // Function to fetch profile pages when needed
    async function fetchProfilePages() {
      if (!profileId) return;

      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("profile_pages")
          .select("id, name, slug")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching profile pages:", error);
          return;
        }

        // We don't need to do anything with the data here
        // The ProfileTabs component will refetch this data when it renders
      } catch (err) {
        console.error("Error fetching profile pages:", err);
      }
    }

    // Clean up subscriptions on component unmount
    return () => {
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(pagesSubscription);
    };
  }, [profileId, activePage, defaultPage, activeTab]);

  const convertedActivePage = updatedActivePage
    ? ({ ...updatedActivePage, profile_id: profileId } as TabsProfilePage)
    : undefined;

  const convertedDefaultPage = updatedDefaultPage
    ? ({ ...updatedDefaultPage, profile_id: profileId } as TabsProfilePage)
    : null;

  if (loading) {
    return <TabsLoadingSkeleton />;
  }

  // Add a visible debug element when in development
  const isDevEnvironment = process.env.NODE_ENV === "development";

  return (
    <>
      {isDevEnvironment && (
        <div className="bg-black text-white p-2 text-xs mb-4">
          <div>DefaultPageType: {defaultPageType || "null"}</div>
          <div>DefaultPageId: {defaultPageId || "null"}</div>
          <div>ActiveTab: {activeTab || "null"}</div>
          <div>DefaultPage: {convertedDefaultPage?.name || "null"}</div>
          <div>ActivePage: {convertedActivePage?.name || "null"}</div>
        </div>
      )}
      <Suspense fallback={<TabsLoadingSkeleton />}>
        <ProfileTabs
          profileId={profileId}
          defaultBlocks={defaultBlocks}
          activePage={convertedActivePage}
          defaultPage={convertedDefaultPage}
          activeTab={activeTab}
          defaultPageType={defaultPageType}
          defaultPageId={defaultPageId}
        />
      </Suspense>
    </>
  );
}

function TabsLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-full w-full max-w-3xl mx-auto mb-8"></div>
      <div className="space-y-8">
        <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg w-full"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg w-full"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg w-full"></div>
      </div>
    </div>
  );
}
