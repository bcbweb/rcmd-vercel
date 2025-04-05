import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RCMD for Content Creators",
  description:
    "Showcase your world, consolidate your links, promote brands, and earn revenue with RCMD.",
};

export default function ForContentCreatorsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-4 text-primary">
        RCMD for Content Creators
      </h1>

      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-muted-foreground">
          SHOW – SHARE – GROW
        </h3>

        <p className="text-lg mb-6">
          <strong>R</strong>e<strong>C</strong>o<strong>M</strong>men
          <strong>D</strong> lets you easily:
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="text-2xl">⭐</span>
              <p>
                <span className="font-bold">Showcase YOU and YOUR world</span> -
                Create a central hub for all your content.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <p>
                <span className="font-bold">Focus all of your marketing</span> -
                Bring everything together in one place.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">📈</span>
              <p>
                <span className="font-bold">Promote & earn revenue</span> -
                Connect with brands and monetize your influence more
                effectively.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">💼</span>
              <p>
                <span className="font-bold">Match with companies</span> - Find
                brands that align with your values and audience.
              </p>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">For Every Type of Creator</h2>
          <div className="space-y-4">
            <p className="flex items-start gap-3">
              <span className="text-2xl">⚖️</span>
              <span>
                Nano, Micro or Massive... creators of all sizes have value. Not
                all brands need celebrity-sized creators to promote them.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">🎭</span>
              <span>
                Fashion, travel, lifestyle, tech, gaming... whatever your
                passion, connect with businesses who will reward your creative
                influence.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <span>
                Whether from YouTube, TikTok, Instagram, Twitch... anywhere,
                bring everything together to turn your audience into revenue.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Build Your Creator Hub</h2>
        <ul className="space-y-4 list-disc list-inside">
          <li>
            Create a profile that:
            <ul className="pl-6 mt-2 space-y-2 list-disc">
              <li>Showcases all your social media channels</li>
              <li>Displays your bio and endorsements clearly</li>
              <li>
                Lists all recommendations with affiliate links and discount
                codes
              </li>
            </ul>
          </li>
          <li>Have a single link to share across all your platforms</li>
          <li>
            Promote both commercial partnerships and authentic lifestyle
            recommendations
          </li>
        </ul>
      </div>

      <div className="bg-card rounded-lg p-8 shadow-sm mb-16">
        <h2 className="text-2xl font-bold mb-6">
          How RCMD helps CONTENT CREATORS...
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤟</span>
            <div>
              <p className="font-bold">Authentic Promotion</p>
              <p>
                Choose which companies and products to promote, providing a more
                personal and honest service to your audience.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📢</span>
            <div>
              <p className="font-bold">Monetize Easily</p>
              <p>
                Thanks to our partnership with NEXU.com, invite businesses to
                add products you can promote and earn from.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛍️</span>
            <div>
              <p className="font-bold">Amplify Your Reach</p>
              <p>
                Incentivize your audience to share your recommendations,
                expanding your marketing reach exponentially.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⬆️</span>
            <div>
              <p className="font-bold">Sell Your Products</p>
              <p>
                Integrate your own merchandise, digital products, or services
                directly through your RCMD profile.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Example Success Story</h2>
        <div className="bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-slate-900/50 dark:to-zinc-900/50 rounded-lg p-6 shadow-sm">
          <div className="space-y-4">
            <p className="flex items-start gap-3">
              <span className="text-2xl">💪</span>
              <span>Debbie is a fitness content creator.</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">🏋️‍♀️</span>
              <span>
                She creates YouTube, TikTok, and Instagram content showing her
                fitness routines and lifestyle.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <span>
                She wants to recommend workout gear, supplements, and local
                fitness spots to her followers.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">😞</span>
              <span>
                Managing multiple platforms and links was time-consuming, and
                her recommendations would quickly get buried.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">😎</span>
              <span>
                Now with RCMD, Debbie uses a single link that showcases her
                world. Her recommendations are centralized, helping followers
                find, purchase, and share them easily.
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
          Join RCMD Now
        </Link>
      </div>
    </div>
  );
}
