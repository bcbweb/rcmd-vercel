import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RCMD for Individuals",
  description:
    "Organize and share your favorite recommendations in one beautiful, shareable place.",
};

export default function ForIndividualsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-4 text-primary">
        RCMD for Individuals
      </h1>

      <div className="text-center mb-8">
        <p className="text-lg mb-8">
          Everyone has recommendations they love to share. RCMD gives you one
          place to organize everything you recommend to friends and family.
        </p>

        <h3 className="text-2xl font-semibold mb-6 text-muted-foreground">
          COLLECT – ORGANIZE – SHARE
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="text-2xl">🔗</span>
              <p>
                <span className="font-bold">One Link for Everything</span> -
                Stop digging through old messages to find that restaurant or
                movie recommendation. Keep everything in one place.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🎨</span>
              <p>
                <span className="font-bold">Create Beautiful Pages</span> -
                Customize your profile with different content blocks to showcase
                your recommendations exactly how you want.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🔍</span>
              <p>
                <span className="font-bold">Discover New Things</span> - Find
                recommendations from friends and people with similar tastes.
              </p>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Perfect For Your Life</h2>
          <div className="space-y-4">
            <p className="flex items-start gap-3">
              <span className="text-2xl">🍽️</span>
              <span>
                <strong>Food & Dining:</strong> Create collections of your
                favorite restaurants, recipes, and food products that friends
                always ask about.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">🎬</span>
              <span>
                <strong>Entertainment:</strong> Share your must-watch movies, TV
                shows, books, and music with direct links to where they can be
                found.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">✈️</span>
              <span>
                <strong>Travel:</strong> Build guides to your favorite
                destinations with hotels, activities, and hidden gems that make
                trips special.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">
          Build Your Personal Recommendation Hub
        </h2>
        <div className="bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-slate-900/50 dark:to-zinc-900/50 rounded-lg p-6 shadow-sm">
          <div className="space-y-6">
            <p>
              We all have that list: the shows we tell everyone to watch, the
              products we swear by, the places we love to visit. With RCMD, you
              can organize everything in one beautiful profile instead of
              scattered across text messages, emails, and notes apps.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-4xl block mb-2">📱</span>
                <p className="font-medium">Add recommendations from anywhere</p>
              </div>
              <div>
                <span className="text-4xl block mb-2">📋</span>
                <p className="font-medium">Organize into collections</p>
              </div>
              <div>
                <span className="text-4xl block mb-2">📤</span>
                <p className="font-medium">Share with a single link</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-8 shadow-sm mb-16">
        <h2 className="text-2xl font-bold mb-6">How RCMD Works for YOU...</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-bold">Create Your Profile</p>
              <p>
                Set up your personal page with a custom username, bio, and
                profile picture that represents your style.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <p className="font-bold">Build Collections</p>
              <p>
                Organize recommendations by category, like "Weekend Getaways" or
                "Favorite Coffee Shops" to make them easy to browse.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧩</span>
            <div>
              <p className="font-bold">Add Content Blocks</p>
              <p>
                Customize your pages with text, images, links, and specialized
                recommendation blocks to create a personalized experience.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <p className="font-bold">Always Up-to-Date</p>
              <p>
                Your recommendations stay fresh and current. No more sending
                outdated links or forgetting what you recommended to whom.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Example Success Story</h2>
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-lg p-6 shadow-sm">
          <div className="space-y-4">
            <p className="flex items-start gap-3">
              <span className="text-2xl">👨‍💻</span>
              <span>
                Alex is a tech enthusiast who loves trying new apps and gadgets.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">🔄</span>
              <span>
                His friends were constantly asking for app recommendations,
                product advice, and tech support.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <span>
                He was spending too much time repeating the same recommendations
                in different chat groups.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <span>
                With RCMD, Alex created a personal tech recommendation hub with
                different categories for apps, gadgets, and services.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">🔗</span>
              <span>
                Now he simply shares his RCMD link whenever someone asks for
                advice, saving time while providing more detailed
                recommendations.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/sign-up"
          className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md text-lg font-semibold shadow-md transition-colors"
        >
          Create Your RCMD Profile
        </Link>
      </div>
    </div>
  );
}
