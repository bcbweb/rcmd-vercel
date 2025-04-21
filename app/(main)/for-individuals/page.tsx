import { Metadata } from "next";
import Link from "next/link";
import { client } from "@/lib/sanity";
import { getMetadataBase } from "@/utils/metadata";

// Define interfaces for the Sanity data structure
interface FeatureItem {
  emoji: string;
  title: string;
  description: string;
}

interface UseCase {
  emoji: string;
  title: string;
  description: string;
}

interface InfoStep {
  emoji: string;
  title: string;
}

interface HowItWorksStep {
  emoji: string;
  title: string;
  description: string;
}

interface StoryStep {
  emoji: string;
  text: string;
}

interface MarketingPage {
  title: string;
  description: string;
  headline: string;
  tagline: string;
  slogan: string;
  featuresList: FeatureItem[];
  useCaseSection: {
    title: string;
    useCases: UseCase[];
  };
  infoSection: {
    title: string;
    content: string;
    steps: InfoStep[];
  };
  howItWorksSection: {
    title: string;
    steps: HowItWorksStep[];
  };
  successStory: {
    title: string;
    steps: StoryStep[];
  };
  ctaText: string;
  ctaLink: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch<MarketingPage | null>(
    `*[_type == "marketingPage" && slug.current == "for-individuals"][0]`
  );

  return {
    metadataBase: getMetadataBase(),
    title: page?.title || "RCMD for Individuals",
    description:
      page?.description || "Organize and share your favorite recommendations.",
  };
}

export default async function ForIndividualsPage() {
  const page = await client.fetch<MarketingPage | null>(
    `*[_type == "marketingPage" && slug.current == "for-individuals"][0]`
  );

  if (!page) {
    // Fallback in case Sanity data isn't available
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-4 text-primary">
          RCMD for Individuals
        </h1>
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-4 text-primary">
        {page.headline}
      </h1>

      <div className="text-center mb-8">
        <p className="text-lg mb-8">{page.tagline}</p>

        <h3 className="text-2xl font-semibold mb-6 text-muted-foreground">
          {page.slogan}
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <ul className="space-y-4">
            {page.featuresList?.map((feature: FeatureItem, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-2xl">{feature.emoji}</span>
                <p>
                  <span className="font-bold">{feature.title}</span> -{" "}
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">
            {page.useCaseSection?.title}
          </h2>
          <div className="space-y-4">
            {page.useCaseSection?.useCases?.map(
              (useCase: UseCase, i: number) => (
                <p key={i} className="flex items-start gap-3">
                  <span className="text-2xl">{useCase.emoji}</span>
                  <span>
                    <strong>{useCase.title}</strong> {useCase.description}
                  </span>
                </p>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">{page.infoSection?.title}</h2>
        <div className="bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-slate-900/50 dark:to-zinc-900/50 rounded-lg p-6 shadow-sm">
          <div className="space-y-6">
            <p>{page.infoSection?.content}</p>
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              {page.infoSection?.steps?.map((step: InfoStep, i: number) => (
                <div key={i}>
                  <span className="text-4xl block mb-2">{step.emoji}</span>
                  <p className="font-medium">{step.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-8 shadow-sm mb-16">
        <h2 className="text-2xl font-bold mb-6">
          {page.howItWorksSection?.title}
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {page.howItWorksSection?.steps?.map(
            (step: HowItWorksStep, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl">{step.emoji}</span>
                <div>
                  <p className="font-bold">{step.title}</p>
                  <p>{step.description}</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">{page.successStory?.title}</h2>
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-lg p-6 shadow-sm">
          <div className="space-y-4">
            {page.successStory?.steps?.map((step: StoryStep, i: number) => (
              <p key={i} className="flex items-start gap-3">
                <span className="text-2xl">{step.emoji}</span>
                <span>{step.text}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href={page.ctaLink || "/sign-up"}
          className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md text-lg font-semibold shadow-md transition-colors"
        >
          {page.ctaText}
        </Link>
      </div>
    </div>
  );
}
