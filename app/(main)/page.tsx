import { createClient } from "@/utils/supabase/server";
import { Hero } from "@/components/common";
import {
  GenericCarousel,
  ProfileCard,
  RCMDCard,
  BusinessCard,
} from "@/components/common/carousel";
import { Footer } from "@/components/layout/footer";
import { Business, Profile, RCMD } from "@/types";

export default async function Index() {
  const supabase = await createClient();

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
      <Hero />

      {profileCards.length > 0 && (
        <div className="px-4 sm:px-6">
          <GenericCarousel
            items={profileCards}
            title="Top Profiles"
            cardsPerView={4}
          />
        </div>
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

      {businessCards.length > 0 && (
        <div className="px-4 sm:px-6">
          <GenericCarousel
            items={businessCards}
            title="Top Businesses"
            cardsPerView={4}
          />
        </div>
      )}

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />

      <main className="flex-1 flex flex-col gap-6 px-4"></main>

      <Footer />
    </>
  );
}
