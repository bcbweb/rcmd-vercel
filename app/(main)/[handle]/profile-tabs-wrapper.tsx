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
          console.log("[profile-tabs-wrapper] Fetched default page info:", {
            profileId,
            default_page_type: data.default_page_type,
            default_page_id: data.default_page_id,
            activePage,
            defaultPage,
            activeTab,
          });

          // Add specific debug for collections
          if (data.default_page_type === "collection") {
            console.log(
              "%c COLLECTIONS DEFAULT PAGE DETECTED in wrapper",
              "background: #f00; color: #fff; font-size: 16px",
              {
                default_page_type: data.default_page_type,
                default_page_id: data.default_page_id,
              }
            );
          }

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
          console.log(
            "[profile-tabs-wrapper] Profile update received:",
            payload
          );
          if (payload.new) {
            const { default_page_type, default_page_id } = payload.new;
            setDefaultPageType(default_page_type || null);
            setDefaultPageId(default_page_id || null);

            console.log("[profile-tabs-wrapper] Real-time update received:", {
              default_page_type,
              default_page_id,
            });
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
        (payload) => {
          console.log("[profile-tabs-wrapper] Page update received:", payload);
          if (payload.new) {
            // When a page is updated, we need to refresh the whole data
            // by navigating to trigger a server component reload
            // This ensures both name and default status changes are reflected immediately
            console.log(
              "[profile-tabs-wrapper] Page update detected, triggering refresh"
            );

            // Use window.location to force a full refresh to get the latest data
            // This is an SPA-breaking approach but ensures consistency
            window.location.reload();
          }
        }
      )
      .subscribe();

    // Clean up subscriptions on component unmount
    return () => {
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(pagesSubscription);
    };
  }, [profileId, activePage, defaultPage, activeTab]);

  const convertedActivePage = activePage
    ? ({ ...activePage, profile_id: profileId } as TabsProfilePage)
    : undefined;

  const convertedDefaultPage = defaultPage
    ? ({ ...defaultPage, profile_id: profileId } as TabsProfilePage)
    : null;

  if (loading) {
    return <TabsLoadingSkeleton />;
  }

  console.log("[profile-tabs-wrapper] Rendering with:", {
    profileId,
    defaultPageType,
    defaultPageId,
    convertedActivePage,
    convertedDefaultPage,
    activeTab,
  });

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
