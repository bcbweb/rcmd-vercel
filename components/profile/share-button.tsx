import { Share2 } from 'lucide-react';

interface ShareButtonProps {
	url: string;
}

export default function ShareButton({ url }: ShareButtonProps) {
	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'My Profile',
					url: url
				});
			} catch (error) {
				console.error('Error sharing:', error);
			}
		} else {
			try {
				await navigator.clipboard.writeText(url);
				alert('Profile link copied to clipboard!');
			} catch (error) {
				console.error('Error copying to clipboard:', error);
			}
		}
	};

	return (
		<button
			onClick={handleShare}
			className="p-2 hover:bg-gray-100 rounded-full transition-colors"
			title="Share public profile"
		>
			<Share2 className="w-5 h-5" />
		</button>
	);
}