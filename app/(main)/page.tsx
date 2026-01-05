import { createClient } from "@/utils/supabase/server";
import { Hero } from "@/components/common";
import {
  GenericCarousel,
  ProfileCard,
  RCMDCard,
  BusinessCard,
} from "@/components/common/carousel";
import { Business, Profile, RCMD } from "@/types";
import { getHomepage } from "@/lib/sanity";
import Link from "next/link";
import SanityImage from "@/components/common/SanityImage";
import { redirect } from "next/navigation";

// Define types for Sanity data
interface SanityImage {
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
}

interface SanityHero {
  heading?: string;
  subheading?: string;
  backgroundImage?: SanityImage;
  cta?: {
    text?: string;
    link?: string;
  };
}

interface SanityCustomItem {
  title: string;
  description?: string;
  image?: SanityImage;
  link?: string;
}

interface SanityFeaturedSection {
  sectionId: string;
  title: string;
  description?: string;
  contentType: string;
  layout: "grid" | "carousel" | "featured" | "list";
  cardsPerView?: number;
  limit?: number;
  featuredItems?: SanityCustomItem[];
  backgroundColor?: string;
  showMoreLink?: boolean;
  moreLink?: string;
  priority?: number;
}

interface SanityHomepage {
  title?: string;
  hero?: SanityHero;
  featuredSections?: SanityFeaturedSection[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    shareImage?: SanityImage;
  };
}

export default async function Index() {
  const supabase = await createClient();

  // Check if user is authenticated and redirect to profile if so
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/protected/profile");
  }

  // Fetch Sanity homepage data
  const homepageData: SanityHomepage = await getHomepage();

  // Fetch profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .not("profile_picture_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch RCMDs
  const { data: rcmds } = await supabase
    .from("rcmds")
    .select("*")
    .not("featured_image", "is", null)
    .order("view_count", { ascending: false })
    .limit(10);

  // Fetch businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .not("cover_photo_url", "is", null)
    .order("rating_avg", { ascending: false })
    .limit(10);

  // Pre-render the items
  const profileCards = (profiles || []).map((profile: Profile) => (
    <ProfileCard key={profile.id} profile={profile} />
  ));

  const rcmdCards = (rcmds || []).map((rcmd: RCMD) => (
    <RCMDCard key={rcmd.id} rcmd={rcmd} />
  ));

  const businessCards = (businesses || []).map((business: Business) => (
    <BusinessCard key={business.id} business={business} />
  ));

  return (
    <>
      {/* Render Sanity Hero Section if available, otherwise use default Hero */}
      {homepageData?.hero ? (
        <div className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden">
          {homepageData.hero.backgroundImage && (
            <div className="absolute inset-0 z-0">
              <SanityImage
                image={homepageData.hero.backgroundImage}
                alt="Background"
                fill
                className="object-cover opacity-60"
                priority
                fallbackUrl="/images/default-hero-bg.jpg"
              />
              {/* Add a subtle gradient overlay for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/30"></div>
            </div>
          )}
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {homepageData.hero.heading && (
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground drop-shadow-sm">
                  {homepageData.hero.heading}
                </h1>
              )}
              {homepageData.hero.subheading && (
                <p className="mt-6 text-lg leading-8 text-foreground/90 drop-shadow-sm">
                  {homepageData.hero.subheading}
                </p>
              )}
              {homepageData.hero.cta && (
                <div className="mt-10">
                  <Link
                    href={homepageData.hero.cta.link || "#"}
                    className="rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg border border-blue-400/30 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 backdrop-blur-sm"
                  >
                    {homepageData.hero.cta.text || "Get Started"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Hero />
      )}

      {/* Supabase Carousels - Keep existing */}
      {profileCards.length > 0 && (
        <div className="px-4 sm:px-6">
          <GenericCarousel
            items={profileCards}
            title="Top Profiles"
            cardsPerView={4}
          />
        </div>
      )}

      {/* Separator after profiles */}
      {profileCards.length > 0 && rcmdCards.length > 0 && (
        <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
      )}

      {rcmdCards.length > 0 && (
        <div className="px-4 sm:px-6">
          <GenericCarousel
            items={rcmdCards}
            title="Recommended For You"
            cardsPerView={3}
          />
        </div>
      )}

      {/* Separator after rcmds */}
      {rcmdCards.length > 0 && businessCards.length > 0 && (
        <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
      )}

      {businessCards.length > 0 && (
        <div className="px-4 sm:px-6">
          <GenericCarousel
            items={businessCards}
            title="Top Businesses"
            cardsPerView={4}
          />
        </div>
      )}

      {/* Separator before Sanity sections if they exist */}
      {businessCards.length > 0 &&
        homepageData?.featuredSections &&
        homepageData.featuredSections.length > 0 && (
          <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
        )}

      {/* Sanity Featured Sections */}
      {homepageData?.featuredSections &&
        homepageData.featuredSections.length > 0 && (
          <main className="flex-1 flex flex-col gap-12 px-4">
            {homepageData.featuredSections
              .sort(
                (a: SanityFeaturedSection, b: SanityFeaturedSection) =>
                  (a.priority || 10) - (b.priority || 10)
              )
              .map((section: SanityFeaturedSection, index: number) => (
                <section
                  key={section.sectionId || index}
                  className="w-full"
                  style={
                    section.backgroundColor
                      ? { backgroundColor: section.backgroundColor }
                      : {}
                  }
                >
                  <div className="container mx-auto py-8">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                        {section.description && (
                          <p className="text-muted-foreground mt-2">
                            {section.description}
                          </p>
                        )}
                      </div>
                      {section.showMoreLink && section.moreLink && (
                        <Link
                          href={section.moreLink}
                          className="text-primary hover:underline"
                        >
                          See More
                        </Link>
                      )}
                    </div>

                    <div
                      className={`grid ${
                        section.layout === "grid"
                          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                          : section.layout === "list"
                            ? "grid-cols-1"
                            : "grid-cols-1"
                      } gap-6`}
                    >
                      {section.featuredItems &&
                        section.featuredItems.map(
                          (item: SanityCustomItem, itemIndex: number) => (
                            <div
                              key={itemIndex}
                              className="border rounded-lg overflow-hidden shadow-sm"
                            >
                              {item.image && (
                                <div className="aspect-video relative">
                                  <SanityImage
                                    image={item.image}
                                    alt={item.title || "Featured item"}
                                    fill
                                    className="object-cover"
                                    fallbackUrl="/images/default-item.jpg"
                                  />
                                </div>
                              )}
                              <div className="p-4">
                                <h3 className="font-medium text-lg">
                                  {item.title}
                                </h3>
                                {item.description && (
                                  <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                {item.link && (
                                  <div className="mt-4">
                                    <Link
                                      href={item.link}
                                      className="text-sm text-primary hover:underline"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      View More
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                </section>
              ))}
          </main>
        )}
    </>
  );
}
