import { Metadata } from "next";
import Link from "next/link";
import { getMetadataBase } from "@/utils/metadata";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "RCMD for Businesses",
  description:
    "Zero-risk marketing for businesses to connect with authentic content creators and grow their customer base.",
};

export default function ForBusinessesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-4 text-primary">
        RCMD for Businesses
      </h1>

      <div className="text-center mb-8">
        <p className="text-lg mb-8">
          For any business that uses social media or word-of-mouth to generate
          sales and get new customers, RCMD has something for you.
        </p>

        <h3 className="text-2xl font-semibold mb-6 text-muted-foreground">
          MATCH – PROMOTE – GROW
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="text-2xl">🔍</span>
              <p>
                <span className="font-bold">Identify Relevant Creators</span> -
                Easily connect with content creators who are passionate about
                your market and can generate authentic sales for your business.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">💯</span>
              <p>
                <span className="font-bold">Zero-Risk Marketing</span> -
                Collaborating with NEXU, our pay-on-results marketplace pays
                creators a commission only when they generate sales.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <p>
                <span className="font-bold">Authentic Promotion</span> - Build
                trust with customers through genuine recommendations and
                word-of-mouth marketing.
              </p>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Perfect For Your Business</h2>
          <div className="space-y-4">
            <p className="flex items-start gap-3">
              <span className="text-2xl">🏨</span>
              <span>
                <strong>Hospitality and Travel:</strong> Instead of printed
                sheets or constantly repeating yourself, create a profile for
                your business with all your recommendations in one accessible
                place.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">🛍️</span>
              <span>
                <strong>Retail and E-commerce:</strong> Connect with creators
                who genuinely love your products and can authentically promote
                them to their audience.
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-2xl">🍽️</span>
              <span>
                <strong>Restaurants and Local Businesses:</strong> Get
                discovered through trusted recommendations from local
                influencers and satisfied customers.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">
          Digital Concierge For Hospitality
        </h2>
        <div className="bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-slate-900/50 dark:to-zinc-900/50 rounded-lg p-6 shadow-sm">
          <p className="mb-6">
            A folder for guests, a concierge desk and people asking for
            recommendations… rather than keep printing sheets or repeating
            yourself, why not create a profile for your business and list all of
            your recommendations in one place that people can easily access
            anywhere, anytime.
          </p>
          <div className="flex items-center justify-center">
            <span className="text-4xl px-4">🏨</span>
            <span className="text-4xl px-4">🏠</span>
            <span className="text-4xl px-4">🧳</span>
            <span className="text-4xl px-4">🌍</span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-8 shadow-sm mb-16">
        <h2 className="text-2xl font-bold mb-6">
          How RCMD Helps BUSINESSES...
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <p className="font-bold">Find the Right Creators</p>
              <p>
                Use RCMD to find content creators and join NEXU, our partner
                marketplace where you can add offers for free in just a few
                minutes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📢</span>
            <div>
              <p className="font-bold">Free Word-of-Mouth Marketing</p>
              <p>
                Get authentic promotion and reach new customers with zero
                upfront costs and risk.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💸</span>
            <div>
              <p className="font-bold">Pay Only For Results</p>
              <p>
                Our commission-based model means you only pay when creators
                successfully generate sales for your business.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-bold">Win-Win Growth</p>
              <p>
                Create mutually beneficial relationships with creators who are
                genuinely passionate about your products or services.
              </p>
            </div>
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
