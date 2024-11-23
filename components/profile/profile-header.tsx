import { PencilLine, Eye } from 'lucide-react';
import ShareButton from "@/components/profile/share-button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProfileHeaderProps {
  title: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  showEditButton?: boolean;
  showPreviewButton?: boolean;
  showShareButton?: boolean;
}

export default function ProfileHeader({
  title,
  username,
  firstName,
  lastName,
  profilePictureUrl,
  showEditButton = true,
  showPreviewButton = true,
  showShareButton = true,
}: ProfileHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shareUrl = username ? `${window.location.origin}/${username}` : "";
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const tabs = [
    { name: 'Profile', href: `/protected/profile` },
    { name: 'Links', href: `/protected/profile/links` },
    { name: 'RCMDs', href: `/protected/profile/rcmds` },
  ];

  return (
    <div className="relative mb-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt="Profile picture"
              fill
              className="object-cover"
              sizes="(max-width: 96px) 96px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl text-gray-500">
                {firstName?.charAt(0) || username.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="text-center">
          {fullName && <h2 className="text-xl font-semibold">{fullName}</h2>}
          <p className="text-gray-600">@{username}</p>
        </div>

        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <div className="absolute right-0 top-0">
        <div className="flex items-center gap-3">
          {showEditButton && (
            <button
              onClick={() => router.push('/protected/edit-info')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Edit my info"
            >
              <PencilLine className="w-5 h-5" />
            </button>
          )}
          {showPreviewButton && (
            <button
              onClick={() => window.open(`/${username}`, '_blank')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Preview my public profile"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          {showShareButton && <ShareButton url={shareUrl} />}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}