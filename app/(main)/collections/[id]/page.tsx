import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { RCMDCard } from "@/components/common/carousel";
import { GenericCarousel } from "@/components/common/carousel";
import { formatDistance } from "date-fns";

// Set revalidation period for ISR
export const revalidate = 60;

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const supabase = await createClient();

  try {
    const { data: collection } = await supabase
      .from("collections")
      .select("name, description")
      .eq("id", id)
      .single();

    if (!collection) {
      return {
        title: "Collection Not Found",
        description: "The collection you are looking for could not be found.",
      };
    }

    return {
      title: `${collection.name} | RCMD Collection`,
      description:
        collection.description || `View ${collection.name} collection on RCMD`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "RCMD Collection",
      description: "View this collection on RCMD",
    };
  }
}

export default async function CollectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient();

  // Fetch the collection with its items
  const { data: collection, error } = await supabase
    .from("collections")
    .select(
      `
      *,
      profiles (id, handle, first_name, last_name, profile_picture_url),
      collection_items (
        id,
        item_type,
        position,
        rcmd_id,
        link_id,
        rcmds (*),
        links (*)
      )
    `
    )
    .eq("id", id)
    .eq("visibility", "public")
    .single();

  if (error || !collection) {
    console.error("Error fetching collection:", error);
    return notFound();
  }

  // Try to increment the view count
  try {
    await supabase.rpc("increment_collection_view", { collection_id: id });
  } catch (error) {
    console.error("Failed to increment view count:", error);
  }

  // Sort the items by position
  const sortedItems = [...collection.collection_items].sort(
    (a, b) => (a.position || 9999) - (b.position || 9999)
  );

  // Create RCMD cards for the carousel
  const rcmdCards = sortedItems
    .filter((item) => item.rcmd && item.item_type === "rcmd")
    .map((item) => <RCMDCard key={item.rcmd.id} rcmd={item.rcmd} />);

  // Group items by type for organization
  const rcmdItems = sortedItems.filter(
    (item) => item.item_type === "rcmd" && item.rcmd
  );
  const linkItems = sortedItems.filter(
    (item) => item.item_type === "link" && item.links
  );

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Home
        </Link>

        <div className="flex items-center gap-4 mb-6">
          {collection.profiles?.profile_picture_url && (
            <Image
              src={collection.profiles.profile_picture_url}
              alt={`${collection.profiles.first_name || ""} ${
                collection.profiles.last_name || ""
              }`}
              width={48}
              height={48}
              className="rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            {collection.profiles && (
              <p className="text-gray-600 dark:text-gray-400">
                By{" "}
                <Link
                  href={`/${collection.profiles.handle}`}
                  className="hover:underline font-medium"
                >
                  {collection.profiles.first_name}{" "}
                  {collection.profiles.last_name}
                </Link>{" "}
                • Created{" "}
                {formatDistance(new Date(collection.created_at), new Date(), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
        </div>

        {collection.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-3xl">
            {collection.description}
          </p>
        )}
      </div>

      {/* RCMD Items Carousel */}
      {rcmdCards.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            Recommendations ({rcmdItems.length})
          </h2>
          <GenericCarousel
            items={rcmdCards}
            cardsPerView={
              rcmdCards.length > 2 ? 3 : (rcmdCards.length as 1 | 2)
            }
          />
        </div>
      )}

      {/* Links Section */}
      {linkItems.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            Links ({linkItems.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {linkItems.map((item) => (
              <a
                key={item.id}
                href={item.links?.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  {item.links?.icon ? (
                    <div className="mr-3 text-lg">{item.links.icon}</div>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  )}
                  <div>
                    <h3 className="font-medium mb-1">{item.links?.title}</h3>
                    {item.links?.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {item.links.description}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate">
                      {item.links?.url?.replace(/^https?:\/\/(www\.)?/, "")}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {rcmdItems.length === 0 && linkItems.length === 0 && (
        <div className="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">
            This collection is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The owner hasn't added any items to this collection yet.
          </p>
        </div>
      )}

      {/* Share Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: collection.name,
                text:
                  collection.description ||
                  `Check out this RCMD collection: ${collection.name}`,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              // You'd typically show a toast here
              alert("Link copied to clipboard!");
            }
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share Collection
        </button>
      </div>
    </div>
  );
}
