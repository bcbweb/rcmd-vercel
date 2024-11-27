import PublicProfileBlocks from "@/components/profile/public/profile-blocks";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from 'next/image';
import type { ProfileBlockType } from "@/types";

type Params = Promise<{ username: string; }>;

interface Profile {
	id: string;
	username: string;
	first_name: string;
	last_name: string;
	bio?: string;
	profile_picture_url?: string;
	handle?: string;
	location?: string;
	interests?: string[];
	tags?: string[];
	profile_blocks?: ProfileBlockType[];
}

export default async function ProfilePage({
	params,
}: {
	params: Params;
}) {
	const resolvedParams = await params;
	const { username } = resolvedParams;
	const supabase = await createClient();

	const { data: profile, error } = await supabase
		.from("profiles")
		.select(`
      id,
      username,
      first_name,
      last_name,
      bio,
      profile_picture_url,
      handle,
      location,
      interests,
      tags,
      profile_blocks(
        id,
        type,
        display_order,
        created_at,
        updated_at
      )
    `)
		.eq("username", username)
		.single() as { data: Profile | null; error: unknown; };

	console.log('Query error:', error);
	if (!profile) return notFound();

	// Sort blocks by order
	const sortedBlocks = profile.profile_blocks?.sort((a, b) => a.display_order - b.display_order) || [];

	return (
		<div className="max-w-7xl mx-auto py-8 px-4">
			<header className="mb-8">
				<div className="flex items-center gap-4">
					{profile.profile_picture_url && (
						<Image
							src={profile.profile_picture_url}
							alt={profile.username}
							className="w-20 h-20 rounded-full object-cover"
							width={80}
							height={80}
						/>
					)}
					<div>
						<h1 className="text-2xl font-bold">
							{profile.first_name} {profile.last_name}
						</h1>
						<p className="text-gray-600">@{profile.username}</p>
						{profile.handle && (
							<p className="text-gray-600 text-sm">{profile.handle}</p>
						)}
					</div>
				</div>
				{profile.bio && <p className="mt-4 text-gray-700">{profile.bio}</p>}
				{profile.location && (
					<p className="mt-2 text-gray-600 text-sm">📍 {profile.location}</p>
				)}
				{profile.interests && profile.interests.length > 0 && (
					<div className="mt-2 flex gap-2 flex-wrap">
						{profile.interests.map((interest: string, index: number) => (
							<span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
								{interest}
							</span>
						))}
					</div>
				)}
				{profile.tags && profile.tags.length > 0 && (
					<div className="mt-2 flex gap-2 flex-wrap">
						{profile.tags.map((tag: string, index: number) => (
							<span key={index} className="px-2 py-1 bg-blue-100 rounded-full text-sm">
								#{tag}
							</span>
						))}
					</div>
				)}
			</header>

			<PublicProfileBlocks blocks={sortedBlocks} />
		</div>
	);
}