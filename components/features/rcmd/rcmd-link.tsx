import React from "react";
import Link from "next/link";
import { RCMD } from "@/types";
import { getShortIdFromUUID } from "@/lib/utils/short-id";

interface RCMDLinkProps {
  rcmd: RCMD;
  className?: string;
  children?: React.ReactNode;
  isExternal?: boolean;
}

export function RCMDLink({
  rcmd,
  className = "",
  children,
  isExternal = false,
}: RCMDLinkProps) {
  // Generate the short ID from the UUID
  const shortId = getShortIdFromUUID(rcmd.id);

  // Create the URL path
  const href = `/rcmd/${shortId}`;

  // If no children are provided, use the RCMD title
  const content = children || rcmd.title;

  // Add target and rel attributes for external links
  const externalProps = isExternal
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link href={href} className={className} {...externalProps}>
      {content}
    </Link>
  );
}

// Function to generate a RCMD short link URL
export function getRCMDShortLink(rcmdId: string, baseUrl = ""): string {
  const shortId = getShortIdFromUUID(rcmdId);
  return `${baseUrl}/rcmd/${shortId}`;
}
