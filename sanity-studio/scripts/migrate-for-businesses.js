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

console.log('Starting migration for "for-businesses" page...');

// Create the document
const forBusinessesPage = {
  _type: "marketingPage",
  title: "RCMD for Businesses",
  slug: {
    _type: "slug",
    current: "for-businesses",
  },
  description:
    "Zero-risk marketing for businesses to connect with authentic content creators and grow their customer base.",
  showFooter: true,
  headline: "RCMD for Businesses",
  tagline:
    "For any business that uses social media or word-of-mouth to generate sales and get new customers, RCMD has something for you.",
  slogan: "MATCH – PROMOTE – GROW",

  featuresList: [
    {
      emoji: "🔍",
      title: "Identify Relevant Creators",
      description:
        "Easily connect with content creators who are passionate about your market and can generate authentic sales for your business.",
    },
    {
      emoji: "💯",
      title: "Zero-Risk Marketing",
      description:
        "Collaborating with NEXU, our pay-on-results marketplace pays creators a commission only when they generate sales.",
    },
    {
      emoji: "🤝",
      title: "Authentic Promotion",
      description:
        "Build trust with customers through genuine recommendations and word-of-mouth marketing.",
    },
  ],

  useCaseSection: {
    title: "Perfect For Your Business",
    useCases: [
      {
        emoji: "🏨",
        title: "Hospitality and Travel:",
        description:
          "Instead of printed sheets or constantly repeating yourself, create a profile for your business with all your recommendations in one accessible place.",
      },
      {
        emoji: "🛍️",
        title: "Retail and E-commerce:",
        description:
          "Connect with creators who genuinely love your products and can authentically promote them to their audience.",
      },
      {
        emoji: "🍽️",
        title: "Restaurants and Local Businesses:",
        description:
          "Get discovered through trusted recommendations from local influencers and satisfied customers.",
      },
    ],
  },

  infoSection: {
    title: "Digital Concierge For Hospitality",
    content:
      "A folder for guests, a concierge desk and people asking for recommendations… rather than keep printing sheets or repeating yourself, why not create a profile for your business and list all of your recommendations in one place that people can easily access anywhere, anytime.",
    steps: [
      {
        emoji: "🏨",
        title: "Hotels and Resorts",
      },
      {
        emoji: "🏠",
        title: "Vacation Rentals",
      },
      {
        emoji: "🧳",
        title: "Travel Agencies",
      },
      {
        emoji: "🌍",
        title: "Tourism Boards",
      },
    ],
  },

  howItWorksSection: {
    title: "How RCMD Helps BUSINESSES...",
    steps: [
      {
        emoji: "🔍",
        title: "Find the Right Creators",
        description:
          "Use RCMD to find content creators and join NEXU, our partner marketplace where you can add offers for free in just a few minutes.",
      },
      {
        emoji: "📢",
        title: "Free Word-of-Mouth Marketing",
        description:
          "Get authentic promotion and reach new customers with zero upfront costs and risk.",
      },
      {
        emoji: "💸",
        title: "Pay Only For Results",
        description:
          "Our commission-based model means you only pay when creators successfully generate sales for your business.",
      },
      {
        emoji: "📈",
        title: "Win-Win Growth",
        description:
          "Create mutually beneficial relationships with creators who are genuinely passionate about your products or services.",
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
      '*[_type == "marketingPage" && slug.current == "for-businesses"][0]'
    );

    if (existingDoc) {
      console.log("Document already exists. Updating...");
      const result = await client
        .patch(existingDoc._id)
        .set(forBusinessesPage)
        .commit();
      console.log(`Successfully updated document: ${result._id}`);
    } else {
      console.log("Creating new document...");
      const result = await client.create(forBusinessesPage);
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
