"use client";

import React from "react";
import Link from "next/link";
import { Collection } from "@/types";
import { getShortIdFromUUID } from "@/lib/utils/short-id";

interface CollectionLinkProps {
  collection: Collection;
  className?: string;
  children: React.ReactNode;
}

export function CollectionLink({
  collection,
  className,
  children,
}: CollectionLinkProps) {
  // Only generate link for public collections
  if (collection.visibility !== "public") {
    return <span className={className}>{children}</span>;
  }

  const shortId = getShortIdFromUUID(collection.id);

  return (
    <Link href={`/collection/${shortId}`} className={className}>
      {children}
    </Link>
  );
}
