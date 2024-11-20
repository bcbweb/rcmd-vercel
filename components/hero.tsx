import Link from 'next/link';

export default function Hero() {
	return (
		<div className="relative overflow-hidden bg-white dark:bg-gray-900">
			<div className="max-w-7xl mx-auto">
				<div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
					<main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
						<div className="sm:text-center lg:text-left">
							<h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
								<span className="block xl:inline">Share your thoughts</span>{' '}
								<span className="block text-blue-600 dark:text-blue-500 xl:inline">
									with the world
								</span>
							</h1>

							<p className="mt-3 text-base text-gray-500 dark:text-gray-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
								Join our community of creators, thinkers, and innovators. Share your ideas,
								connect with like-minded individuals, and build your digital presence.
							</p>

							<div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
								<div className="rounded-md shadow">
									<Link
										href="/auth/signup"
										className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 md:py-4 md:text-lg md:px-10"
									>
										Get started
									</Link>
								</div>
								<div className="mt-3 sm:mt-0 sm:ml-3">
									<Link
										href="/auth/signin"
										className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
									>
										Sign in
									</Link>
								</div>
							</div>
						</div>
					</main>

					<div className="relative w-full h-64 sm:h-72 md:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 lg:h-full">
						<div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-10 dark:opacity-20" />
						<div className="absolute inset-0 w-full h-full">
							<svg
								className="w-full h-full text-gray-800 dark:text-gray-200 opacity-5"
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