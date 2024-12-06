import Hero from "@/components/hero";
import GenericCarousel from '@/components/generic-carousel';
import ProfileCard from '@/components/profile-card';
import RCMDCard from '@/components/rcmd-card';
import BusinessCard from '@/components/business-card';
import Footer from '@/components/footer';
import { Business, Profile, RCMD } from '@/types';
import MOCK_PROFILES from '@/data/mock/profiles.json';
import MOCK_RCMDS from '@/data/mock/rcmds.json';
import MOCK_BUSINESSES from '@/data/mock/businesses.json';


export default async function Index() {
	const typedProfiles = MOCK_PROFILES as Profile[];
	const typedRCMDs = MOCK_RCMDS as RCMD[];
	const typedBusinesses = MOCK_BUSINESSES as Business[];

	// Pre-render the items
	const profileCards = typedProfiles.map((profile: Profile) => (
		<ProfileCard
			key={profile.id}
			profile={profile}
		/>
	));

	const rcmdCards = typedRCMDs.map((rcmd: RCMD) => (
		<RCMDCard
			key={rcmd.id}
			rcmd={rcmd}
		/>
	));

	const businessCards = typedBusinesses.map((business: Business) => (
		<BusinessCard
			key={business.id}
			business={business}
		/>
	));

	return (
		<>
			<Hero />

			<GenericCarousel
				items={profileCards}
				title="Top Profiles"
				cardsPerView={4}
			/>

			<GenericCarousel
				items={rcmdCards}
				title="Recommended For You"
				cardsPerView={3}
			/>

			<GenericCarousel
				items={businessCards}
				title="Top Businesses"
				cardsPerView={4}
			/>

			<div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />

			<main className="flex-1 flex flex-col gap-6 px-4">
			</main>

			<Footer></Footer>
		</>
	);
}