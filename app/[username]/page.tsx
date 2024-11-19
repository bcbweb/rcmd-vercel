import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ProfileBlocks from '@/components/profile/ProfileBlocks';

type Params = Promise<{ username: string; }>;

export default async function ProfilePage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const { username } = resolvedParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      blocks:profile_blocks(
        *,
        rcmd:rcmds(*),
        business:businesses(*)
      )
    `)
    .eq('username', username)
    .single();

  if (!profile) return notFound();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <header className="mb-8">
        <div className="flex items-center gap-4">
          {profile.profile_picture && (
            <img
              src={profile.profile_picture}
              alt={profile.username}
              className="w-20 h-20 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h1>
            <p className="text-gray-600">@{profile.username}</p>
          </div>
        </div>
        {profile.bio && (
          <p className="mt-4 text-gray-700">{profile.bio}</p>
        )}
      </header>

      <ProfileBlocks blocks={profile.blocks} isEditing={false} />
    </div>
  );
}