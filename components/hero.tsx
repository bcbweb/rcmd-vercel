import Link from 'next/link';

export default function Hero() {
	return (
		<div className="relative overflow-hidden bg-white dark:bg-black">
			<div className="mx-auto max-w-7xl">
				<div className="relative z-10 px-4 py-8 sm:px-6 sm:py-16 md:py-20 lg:flex lg:h-screen lg:items-center lg:py-24">
					{/* Left Content Section */}
					<div className="lg:w-1/2 lg:pr-8">
						<div className="text-center lg:text-left">
							<h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
								<span className="block">Share your thoughts</span>{' '}
								<span className="block text-blue-600 dark:text-blue-500">
									with the world
								</span>
							</h1>

							<p className="mx-auto mt-4 max-w-xl text-sm text-gray-500 dark:text-gray-400 sm:text-base md:mt-5 md:text-lg lg:mx-0">
								Join our community of creators, thinkers, and innovators. Share your ideas,
								connect with like-minded individuals, and build your digital presence.
							</p>

							{/* CTA Buttons */}
							<div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
								<Link
									href="/auth/signup"
									className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 sm:w-auto md:text-base"
								>
									Get started
								</Link>
								<Link
									href="/auth/signin"
									className="inline-flex w-full items-center justify-center rounded-md bg-blue-100 px-6 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 sm:w-auto md:text-base"
								>
									Sign in
								</Link>
							</div>
						</div>
					</div>

					{/* Right Decorative Section */}
					<div className="relative mt-8 h-48 w-full sm:h-64 md:h-72 lg:mt-0 lg:h-full lg:w-1/2">
						<div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-10 dark:opacity-20" />
						<div className="absolute inset-0">
							<svg
								className="h-full w-full text-gray-800 opacity-5 dark:text-gray-200"
								fill="currentColor"
								viewBox="0 0 100 100"
								preserveAspectRatio="none"
							>
								<path d="M0,0 L100,0 L100,100 L0,100 Z" />
								<circle cx="50" cy="50" r="30" />
								<rect x="20" y="20" width="60" height="60" />
								<polygon points="50,0 100,50 50,100 0,50" />
							</svg>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}