/**
 * Extracts a clean domain name from a URL
 */
export function getDomain(url: string): string {
  if (!url) return "";
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, "");
  } catch (error) {
    return url;
  }
}

/**
 * Determines if a URL is for a specific service
 */
export function isServiceUrl(url: string, service: string): boolean {
  if (!url) return false;
  try {
    const domain = getDomain(url).toLowerCase();
    return domain.includes(service.toLowerCase());
  } catch (error) {
    return false;
  }
}

/**
 * Returns an appropriate icon URL for common services
 */
export function getLinkIconUrl(url: string): string {
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
  if (domain.includes("github")) {
    return "/images/icons/github-logo.png";
  }

  // For any other domain, return a default or empty string
  return "";
}
