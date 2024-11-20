import { useState } from "react";
import { toast } from "sonner";

interface Props {
	url: string;
	title?: string;
}

export default function ShareButton({ url, title = "Check this out!" }: Props) {
	const [isLoading, setIsLoading] = useState(false);

	const shareData = {
		title,
		url,
		text: title,
	};

	const handleShare = async () => {
		setIsLoading(true);
		try {
			if (navigator.share) {
				// Use native share if available
				await navigator.share(shareData);
			} else {
				// Fallback to clipboard copy
				await navigator.clipboard.writeText(url);
				toast.success("Link copied to clipboard!");
			}
		} catch (error) {
			toast.error("Failed to share");
			console.error("Error sharing:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button
			onClick={handleShare}
			disabled={isLoading}
			className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
		>
			{isLoading ? (
				<span>Sharing...</span>
			) : (
				<>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="w-5 h-5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
						/>
					</svg>
					Share
				</>
			)}
		</button>
	);
}
