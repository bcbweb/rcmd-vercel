"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { useEffect, useState } from "react";

// Pages where the footer should appear
const footerEnabledPaths = [
  "/", // Home page
  "/help",
  "/for-individuals",
  "/for-content-creators",
  "/for-businesses",
  "/community",
  "/blog",
  "/docs",
  "/privacy",
  "/terms",
  "/cookies",
  "/contact",
  "/support",
  "/careers",
  "/invite",
];

export default function FooterWrapper() {
  const pathname = usePathname();
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    async function checkFooterVisibility() {
      try {
        // Default to false (footer hidden)
        let shouldShowFooter = false;

        // Check if current path is in the default list of enabled paths
        const isDefaultEnabledPath = footerEnabledPaths.some(
          (path) =>
            // Exact match or starts with one of the marketing paths
            pathname === path || (path !== "/" && pathname.startsWith(path))
        );

        // Check for special conditions that always hide the footer
        const isAlwaysHidden =
          pathname.startsWith("/protected") || pathname.match(/^\/[^/]+$/); // Exclude public user pages with handle pattern

        if (isAlwaysHidden) {
          setShowFooter(false);
          return;
        }

        if (pathname === "/") {
          // For homepage, fetch from Sanity homepage document
          const res = await fetch("/api/sanity/homepage?fields=showFooter");
          if (res.ok) {
            const data = await res.json();
            shouldShowFooter = data.showFooter === true;
          }
        } else {
          // For other pages, try to fetch page by slug
          // Extract slug from pathname
          const slug = pathname.split("/").pop() || pathname.substring(1);
          if (slug) {
            const res = await fetch(
              `/api/sanity/page?slug=${slug}&fields=showFooter`
            );
            if (res.ok) {
              const data = await res.json();
              shouldShowFooter = data.showFooter === true;
            } else {
              // Fallback to default enabled paths if no Sanity data
              shouldShowFooter = isDefaultEnabledPath && !isAlwaysHidden;
            }
          }
        }

        setShowFooter(shouldShowFooter);
      } catch (error) {
        console.error("Error checking footer visibility:", error);
        // Fallback to the original logic if there's an error
        const shouldShowFooter =
          footerEnabledPaths.some(
            (path) =>
              pathname === path || (path !== "/" && pathname.startsWith(path))
          ) &&
          !pathname.startsWith("/protected") &&
          !pathname.match(/^\/[^/]+$/);
        setShowFooter(shouldShowFooter);
      }
    }

    checkFooterVisibility();
  }, [pathname]);

  if (!showFooter) {
    return null;
  }

  return <Footer />;
}
