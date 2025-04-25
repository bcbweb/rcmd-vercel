"use client";

import type { Link } from "@/types";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

interface Props {
  links: Link[];
}

// Function to get domain and icon for a link
function getDomain(url: string): string {
  if (!url) return "";
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Gets an icon URL for a known service
function getLinkIconUrl(url: string): string {
  if (!url) return "";

  const domain = getDomain(url).toLowerCase();

  // Check for common domains
  if (domain.includes("amazon")) {
    return "/images/icons/amazon-logo.png";
  }
  if (domain.includes("instagram")) {
    return "/images/icons/instagram-logo.png";
  }
  if (domain.includes("twitter") || domain.includes("x.com")) {
    return "/images/icons/twitter-logo.png";
  }
  if (domain.includes("youtube")) {
    return "/images/icons/youtube-logo.png";
  }
  if (domain.includes("facebook")) {
    return "/images/icons/facebook-logo.png";
  }
  if (domain.includes("tiktok")) {
    return "/images/icons/tiktok-logo.png";
  }
  if (domain.includes("linkedin")) {
    return "/images/icons/linkedin-logo.png";
  }

  // For any other domain, return empty string
  return "";
}

export default function PublicLinkBlocks({ links }: Props) {
  // Early return if no links
  if (!links || links.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-2">No links found</h2>
        <p className="text-muted-foreground">
          No public links have been shared yet. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {links.map((link, index) => {
        const domain = getDomain(link.url);
        const iconUrl = getLinkIconUrl(link.url);
        const isEven = index % 2 === 0;

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-all hover:shadow-md">
              <div
                className={`flex flex-col sm:flex-row ${isEven ? "" : "sm:flex-row-reverse"}`}
              >
                {/* Image/Icon side */}
                <div className="sm:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    {iconUrl ? (
                      <Image
                        src={iconUrl}
                        alt={domain}
                        width={200}
                        height={200}
                        className="object-contain"
                        onError={(e) => {
                          // Fallback to domain text if image fails to load
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-6xl font-bold text-gray-400 dark:text-gray-600 text-center uppercase">
                        {domain.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Text side */}
                <div className="sm:w-1/2 p-8 flex flex-col justify-center">
                  <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200">
                    {link.title || domain}
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {link.description || `Visit ${domain}`}
                  </p>
                  {/* URL display - hidden for now but code kept for later conditional logic */}
                  {false && (
                    <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{link.url}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
