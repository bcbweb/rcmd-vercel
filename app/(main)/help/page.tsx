"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: React.ReactNode;
};

export default function HelpPage() {
  const creatorFaqs: FaqItem[] = [
    {
      question: "How big a content creator do I have to be?",
      answer: (
        <>
          <p>
            Any size! Content creators don't have to have celebrity status or
            have millions of followers. If you influence ten people, your voice
            matters and you can help support the companies you like and believe
            in.
          </p>
          <p className="mt-4">
            The bigger you are, the more opportunity you may have to generate
            sales, and therefore the more you could be rewarded, but everyone
            has to start somewhere. RCMD is your space to find and promote the
            partners you work with, find new ones, and generate sales.
          </p>
        </>
      ),
    },
    {
      question: "Do I have to like what I promote?",
      answer: (
        <p>
          In our minds, <strong>YES!</strong> You should not promote or sell
          things that you do not truly believe in. As a content creator you have
          a responsibility to your followers and fans... they are believing in
          you, don't mislead them.
        </p>
      ),
    },
    {
      question: "I'm a video blogger / YouTuber... can I benefit?",
      answer: (
        <>
          <p>
            <strong>YES</strong>, absolutely! As someone sharing experiences and
            making reviews, your opinions count. RCMD is perfect for you as
            within your blogs and channels you'll be able to <strong>R</strong>e
            <strong>C</strong>o<strong>M</strong>men<strong>D</strong> exactly
            what you like.
          </p>
          <p className="mt-4">
            You can recommend not just what's sold on the big e-commerce stores,
            but you can even get local shops that you want to support to join
            our partner marketplace NEXU. They can add offers for the products
            you review and recommend, then you can promote those offers and help
            local companies grow. When you generate sales, you'll earn
            commissions.
          </p>
        </>
      ),
    },
  ];

  const usageFaqs: FaqItem[] = [
    {
      question: "Do I have to sell stuff from Amazon or eBay?",
      answer: (
        <>
          <p>
            No. RCMD isn't just about helping you grow, it's about you helping
            the individual companies you like grow as well. If you buy and
            review equipment from a local shop, simply get them to join our
            marketplace partner NEXU for free, get them to add an offer for
            free, and then you promote that offer.
          </p>
          <p className="mt-4">
            Each sale you make, you'll get paid. RCMD wants to help you, the
            companies you like, communities and bring back a voice to smaller
            independent businesses. If you help them, they reward you... it's
            simple and everyone wins.
          </p>
        </>
      ),
    },
    {
      question: "How can I make the most of RCMD?",
      answer: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <p className="font-bold">Visibility – Your own mini website</p>
              <p>
                Join RCMD, create your profile and centralize all of your
                marketing powers in one place so you can easily showcase ALL of
                your influencing potential.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛒</span>
            <div>
              <p className="font-bold">Sell</p>
              <p>
                Add RCMD's (<strong>R</strong>e<strong>C</strong>o
                <strong>M</strong>men<strong>D</strong>ations) to link to
                marketplaces with your existing affiliate links (Amazon, partner
                web shops etc.)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="font-bold">Earn More</p>
              <p>
                Invite businesses to join our partner marketplace NEXU and ask
                them to add products or services that you will promote for them.
                They can join for free, create listings for free, and then let
                you bring them advertising without any risk. When your posts and
                recommendations generate sales, you'll earn a commission.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤝</span>
            <div>
              <p className="font-bold">Empower your Fans and Followers</p>
              <p>
                Products and services you sell via NEXU will pay you a
                commission. You can decide to share that with your Fans and
                Followers, motivating them to share your posts and bring you
                more influencing power by empowering and rewarding them!
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-bold">A Passive Income</p>
              <p>
                The businesses that you introduce to NEXU (using your invite
                link) could recognize you for the 'Business Introduction
                Commission' and bring you a passive income on ALL sales that
                they make through NEXU, even those not generated from your
                marketing efforts.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const socialFaqs: FaqItem[] = [
    {
      question:
        "How can RCMD help me make money from Instagram and other Social platforms?",
      answer: (
        <>
          <p>
            Instagram is great for generating attention, but unless you can
            monetize it, it's all going to waste. Being able to send that
            attention somewhere that can turn it into money is the key.
          </p>
          <p className="mt-4">
            RCMD lets you use a single URL link to open up a window that allows
            you to showcase all your online presence, have a web shop, link to
            various marketplaces, and share across many platforms. This saves
            you the need of having to build your own website, create an online
            shop, or worry about sales.
          </p>
          <p className="mt-4">
            Get the companies you love to join our partner marketplace for free
            and you can earn even more.
          </p>
          <p className="font-bold mt-4">#RCMD lets you #bemore</p>
        </>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-4 text-primary">
        Help and FAQs
      </h1>

      <div className="text-center mb-12">
        <p className="text-lg">
          Find answers to common questions about RCMD and how to make the most
          of your profile.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-6">For Content Creators</h2>
          <div className="space-y-4">
            {creatorFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Using RCMD Effectively</h2>
          <div className="space-y-4">
            {usageFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Social Media Integration</h2>
          <div className="space-y-4">
            {socialFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </section>

        <section className="pt-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Still Have Questions?</h2>
            <div className="space-y-4">
              <p>
                We're here to help! If you couldn't find the answer you're
                looking for, please reach out to our support team.
              </p>
              <div className="flex justify-center">
                <Link
                  href="/contact"
                  className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium shadow-sm transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
      <button
        className="w-full text-left p-6 flex justify-between items-center gap-4 hover:bg-muted/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className="text-xl font-semibold">{question}</h3>
        <ChevronDown
          className={`h-5 w-5 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-6 pt-0 prose dark:prose-invert max-w-none">
          {answer}
        </div>
      </div>
    </div>
  );
}
