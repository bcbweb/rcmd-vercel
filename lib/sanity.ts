import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

// Define a type for Sanity image sources
type SanityImageSource = {
  _type: string;
  asset: {
    _ref: string;
    _type: string;
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
};

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2023-10-10",
  useCdn: process.env.NODE_ENV === "production",
});

// Helper function for generating image URLs
const builder = imageUrlBuilder(client);

// We disable the no-explicit-any rule for this specific case as the image-url library accepts various input types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: SanityImageSource | Record<string, any>) {
  return builder.image(source);
}

// Helper functions for fetching data
export async function getRCMDs() {
  return client.fetch(`*[_type == "rcmd"]`);
}

export async function getRCMDBySlug(slug: string) {
  return client.fetch(`*[_type == "rcmd" && slug.current == $slug][0]`, {
    slug,
  });
}

export async function getCollections() {
  return client.fetch(`*[_type == "collection"]`);
}

export async function getCollectionBySlug(slug: string) {
  return client.fetch(`*[_type == "collection" && slug.current == $slug][0]`, {
    slug,
  });
}

export async function getCategories() {
  return client.fetch(`*[_type == "category"]`);
}

export async function getHomepage() {
  return client.fetch(`*[_type == "homepage"][0]`);
}
