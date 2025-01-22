import { getSocialIcon, getPlatformUrl } from '@/lib/utils';

interface SocialLinksProps {
  links: Array<{
    platform: string;
    handle: string;
  }>;
}

export function SocialLinks({ links }: SocialLinksProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {links.map((link, index) => (
        <a
          key={index}
          href={getPlatformUrl(link.platform, link.handle)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          title={`${link.platform}: @${link.handle}`}
        >
          {getSocialIcon(link.platform)}
        </a>
      ))}
    </div>
  );
}