const { createClient } = require("@sanity/client");

// Create the Sanity client with explicit configuration
const client = createClient({
  projectId: "ce6vefd3",
  dataset: "production",
  apiVersion: "2023-10-10",
  useCdn: false,
  // If running through Sanity CLI, it will use the authenticated token
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_STUDIO_API_TOKEN,
});

console.log('Starting migration for "for-content-creators" page...');

// Create the document
const forContentCreatorsPage = {
  _type: "marketingPage",
  title: "RCMD for Content Creators",
  slug: {
    _type: "slug",
    current: "for-content-creators",
  },
  description:
    "Showcase your world, consolidate your links, promote brands, and earn revenue with RCMD.",
  showFooter: true,
  headline: "RCMD for Content Creators",
  tagline:
    "ReCOMmenD lets you easily create a central hub for all your content, brands, and monetization.",
  slogan: "SHOW – SHARE – GROW",

  featuresList: [
    {
      emoji: "⭐",
      title: "Showcase YOU and YOUR world",
      description: "Create a central hub for all your content.",
    },
    {
      emoji: "🤝",
      title: "Focus all of your marketing",
      description: "Bring everything together in one place.",
    },
    {
      emoji: "📈",
      title: "Promote & earn revenue",
      description:
        "Connect with brands and monetize your influence more effectively.",
    },
    {
      emoji: "💼",
      title: "Match with companies",
      description: "Find brands that align with your values and audience.",
    },
  ],

  useCaseSection: {
    title: "For Every Type of Creator",
    useCases: [
      {
        emoji: "⚖️",
        title: "Creators of All Sizes",
        description:
          "Nano, Micro or Massive... creators of all sizes have value. Not all brands need celebrity-sized creators to promote them.",
      },
      {
        emoji: "🎭",
        title: "Any Niche or Interest",
        description:
          "Fashion, travel, lifestyle, tech, gaming... whatever your passion, connect with businesses who will reward your creative influence.",
      },
      {
        emoji: "💰",
        title: "Any Platform",
        description:
          "Whether from YouTube, TikTok, Instagram, Twitch... anywhere, bring everything together to turn your audience into revenue.",
      },
    ],
  },

  infoSection: {
    title: "Build Your Creator Hub",
    content:
      "Create a profile that showcases all your social media channels, displays your bio and endorsements clearly, and lists all recommendations with affiliate links and discount codes. Have a single link to share across all your platforms and promote both commercial partnerships and authentic lifestyle recommendations.",
    steps: [
      {
        emoji: "🔗",
        title: "Unified Social Media Presence",
      },
      {
        emoji: "📋",
        title: "Organized Recommendations",
      },
      {
        emoji: "💸",
        title: "Centralized Monetization",
      },
    ],
  },

  howItWorksSection: {
    title: "How RCMD helps CONTENT CREATORS...",
    steps: [
      {
        emoji: "🤟",
        title: "Authentic Promotion",
        description:
          "Choose which companies and products to promote, providing a more personal and honest service to your audience.",
      },
      {
        emoji: "📢",
        title: "Monetize Easily",
        description:
          "Thanks to our partnership with NEXU.com, invite businesses to add products you can promote and earn from.",
      },
      {
        emoji: "🛍️",
        title: "Amplify Your Reach",
        description:
          "Incentivize your audience to share your recommendations, expanding your marketing reach exponentially.",
      },
      {
        emoji: "⬆️",
        title: "Sell Your Products",
        description:
          "Integrate your own merchandise, digital products, or services directly through your RCMD profile.",
      },
    ],
  },

  successStory: {
    title: "Example Success Story",
    steps: [
      {
        emoji: "💪",
        text: "Debbie is a fitness content creator.",
      },
      {
        emoji: "🏋️‍♀️",
        text: "She creates YouTube, TikTok, and Instagram content showing her fitness routines and lifestyle.",
      },
      {
        emoji: "💡",
        text: "She wants to recommend workout gear, supplements, and local fitness spots to her followers.",
      },
      {
        emoji: "😞",
        text: "Managing multiple platforms and links was time-consuming, and her recommendations would quickly get buried.",
      },
      {
        emoji: "😎",
        text: "Now with RCMD, Debbie uses a single link that showcases her world. Her recommendations are centralized, helping followers find, purchase, and share them easily.",
      },
    ],
  },

  ctaText: "Join RCMD Now",
  ctaLink: "/sign-up",
};

// Check if we have authentication
if (!client.config().token) {
  console.log(
    "\n⚠️ No token found in environment. You need a write token to run this script."
  );
  console.log(
    "You can create one at https://manage.sanity.io/ and set it as SANITY_API_TOKEN\n"
  );
  process.exit(1);
}

// Create the document
async function createDocument() {
  try {
    console.log("Checking if document already exists...");
    // Check if document already exists
    const existingDoc = await client.fetch(
      '*[_type == "marketingPage" && slug.current == "for-content-creators"][0]'
    );

    if (existingDoc) {
      console.log("Document already exists. Updating...");
      const result = await client
        .patch(existingDoc._id)
        .set(forContentCreatorsPage)
        .commit();
      console.log(`Successfully updated document: ${result._id}`);
    } else {
      console.log("Creating new document...");
      const result = await client.create(forContentCreatorsPage);
      console.log(`Successfully created document: ${result._id}`);
    }
  } catch (error) {
    console.error("Error:", error);
    if (error.message.includes("authorized")) {
      console.log(
        "\n⚠️ Authentication error. Please check your token permissions."
      );
      console.log(
        "Make sure your token has write access to the dataset 'production'.\n"
      );
    }
  }
}

createDocument();
