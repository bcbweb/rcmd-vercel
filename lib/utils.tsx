import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Instagram from '@/assets/icons/instagram.svg';
import Twitter from '@/assets/icons/twitter.svg';
import Youtube from '@/assets/icons/youtube.svg';
import Tiktok from '@/assets/icons/tiktok.svg';
import Linkedin from '@/assets/icons/linkedin.svg';
import Facebook from '@/assets/icons/facebook.svg';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getSocialIcon(platform: string) {
	switch (platform.toLowerCase()) {
		case 'instagram':
			return <Instagram className="w-5 h-5" />;
		case 'twitter':
			return <Twitter className="w-5 h-5" />;
		case 'youtube':
			return <Youtube className="w-5 h-5" />;
		case 'tiktok':
			return <Tiktok className="w-5 h-5" />;
		case 'linkedin':
			return <Linkedin className="w-5 h-5" />;
		case 'facebook':
			return <Facebook className="w-5 h-5" />;
		default:
			return null;
	}
}

export function getPlatformUrl(platform: string, handle: string) {
	switch (platform.toLowerCase()) {
		case 'instagram':
			return `https://instagram.com/${handle}`;
		case 'twitter':
			return `https://twitter.com/${handle}`;
		case 'youtube':
			return `https://youtube.com/${handle}`;
		case 'tiktok':
			return `https://tiktok.com/@${handle}`;
		case 'linkedin':
			return `https://linkedin.com/in/${handle}`;
		case 'facebook':
			return `https://facebook.com/${handle}`;
		default:
			return '#';
	}
}

export const PLATFORM_OPTIONS = [
	{ value: 'instagram', label: 'Instagram' },
	{ value: 'twitter', label: 'Twitter/X' },
	{ value: 'youtube', label: 'YouTube' },
	{ value: 'tiktok', label: 'TikTok' },
	{ value: 'linkedin', label: 'LinkedIn' },
	{ value: 'facebook', label: 'Facebook' },
] as const;

export type Platform = typeof PLATFORM_OPTIONS[number]['value'];