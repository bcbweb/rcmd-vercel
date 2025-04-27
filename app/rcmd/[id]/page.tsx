import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getUUIDFromShortId } from "@/lib/utils/short-id";
import { fetchRCMDById } from "@/lib/api/rcmds";
import { formatDistance } from "date-fns";
import { RCMD } from "@/types";

interface RCMDPageProps {
  params: {
    id: string;
  };
}

// Extended RCMD type that includes profiles
interface RCMDWithProfiles extends RCMD {
  profiles?: {
    id: string;
    handle: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
  };
}

export async function generateMetadata({
  params,
}: RCMDPageProps): Promise<Metadata> {
  try {
    // Properly await params in Next.js 15
    const resolvedParams = await params;
    const shortId = resolvedParams.id;

    // Convert short ID directly to UUID without database lookup
    const uuid = getUUIDFromShortId(shortId);

    // Fetch the RCMD using the decoded UUID
    const rcmd = await fetchRCMDById(uuid);

    if (!rcmd) return { title: "RCMD Not Found" };

    return {
      title: `${rcmd.title} | RCMD`,
      description: rcmd.description || undefined,
      openGraph: rcmd.featured_image
        ? {
            images: [{ url: rcmd.featured_image }],
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "RCMD" };
  }
}

export default async function RCMDPage({ params }: RCMDPageProps) {
  try {
    // Properly await params in Next.js 15
    const resolvedParams = await params;
    const shortId = resolvedParams.id;

    // Convert short ID directly to UUID without database lookup
    const uuid = getUUIDFromShortId(shortId);
    console.log(`Decoded shortId: ${shortId} to UUID: ${uuid}`);

    // Fetch the RCMD using the decoded UUID
    const rawRcmd = await fetchRCMDById(uuid);

    if (!rawRcmd || rawRcmd.visibility !== "public") {
      return notFound();
    }

    // Type assertion to include profiles
    const rcmd = rawRcmd as RCMDWithProfiles;

    // Format the date
    const formattedDate = rcmd.created_at
      ? formatDistance(new Date(rcmd.created_at), new Date(), {
          addSuffix: true,
        })
      : "";

    return (
      <div className="container max-w-4xl py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Image */}
          {rcmd.featured_image && (
            <div className="w-full aspect-video relative">
              <Image
                src={rcmd.featured_image}
                alt={rcmd.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1536px) 100vw, 1536px"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">{rcmd.title}</h1>

            {rcmd.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {rcmd.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm mb-6">
              {rcmd.profiles && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">By: </span>
                  <Link
                    href={`/${rcmd.profiles.handle}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {rcmd.profiles.first_name && rcmd.profiles.last_name
                      ? `${rcmd.profiles.first_name} ${rcmd.profiles.last_name}`
                      : rcmd.profiles.handle}
                  </Link>
                </div>
              )}

              {formattedDate && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Added: {formattedDate}
                  </span>
                </div>
              )}

              {rcmd.tags && rcmd.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {rcmd.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {rcmd.url && (
              <div className="mb-4">
                <a
                  href={rcmd.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in RCMD page:", error);
    return notFound();
  }
}
