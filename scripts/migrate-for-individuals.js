import { createClient } from "@sanity/client";

// Set up the client
const client = createClient({
  projectId: "ce6vefd3",
  dataset: "production",
  token: process.env.SANITY_API_TOKEN, // You'll need to set this environment variable
  apiVersion: "2023-10-10",
  useCdn: false,
});

// Create the document
const forIndividualsPage = {
  _type: "marketingPage",
  title: "RCMD for Individuals",
  slug: {
    _type: "slug",
    current: "for-individuals",
  },
  description:
    "Organize and share your favorite recommendations in one beautiful, shareable place.",
  showFooter: true,
  headline: "RCMD for Individuals",
  tagline:
    "Everyone has recommendations they love to share. RCMD gives you one place to organize everything you recommend to friends and family.",
  slogan: "COLLECT – ORGANIZE – SHARE",

  featuresList: [
    {
      emoji: "🔗",
      title: "One Link for Everything",
      description:
        "Stop digging through old messages to find that restaurant or movie recommendation. Keep everything in one place.",
    },
    {
      emoji: "🎨",
      title: "Create Beautiful Pages",
      description:
        "Customize your profile with different content blocks to showcase your recommendations exactly how you want.",
    },
    {
      emoji: "🔍",
      title: "Discover New Things",
      description:
        "Find recommendations from friends and people with similar tastes.",
    },
  ],

  useCaseSection: {
    title: "Perfect For Your Life",
    useCases: [
      {
        emoji: "🍽️",
        title: "Food & Dining:",
        description:
          "Create collections of your favorite restaurants, recipes, and food products that friends always ask about.",
      },
      {
        emoji: "🎬",
        title: "Entertainment:",
        description:
          "Share your must-watch movies, TV shows, books, and music with direct links to where they can be found.",
      },
      {
        emoji: "✈️",
        title: "Travel:",
        description:
          "Build guides to your favorite destinations with hotels, activities, and hidden gems that make trips special.",
      },
    ],
  },

  infoSection: {
    title: "Build Your Personal Recommendation Hub",
    content:
      "We all have that list: the shows we tell everyone to watch, the products we swear by, the places we love to visit. With RCMD, you can organize everything in one beautiful profile instead of scattered across text messages, emails, and notes apps.",
    steps: [
      {
        emoji: "📱",
        title: "Add recommendations from anywhere",
      },
      {
        emoji: "📋",
        title: "Organize into collections",
      },
      {
        emoji: "📤",
        title: "Share with a single link",
      },
    ],
  },

  howItWorksSection: {
    title: "How RCMD Works for YOU...",
    steps: [
      {
        emoji: "✨",
        title: "Create Your Profile",
        description:
          "Set up your personal page with a custom username, bio, and profile picture that represents your style.",
      },
      {
        emoji: "📚",
        title: "Build Collections",
        description:
          'Organize recommendations by category, like "Weekend Getaways" or "Favorite Coffee Shops" to make them easy to browse.',
      },
      {
        emoji: "🧩",
        title: "Add Content Blocks",
        description:
          "Customize your pages with text, images, links, and specialized recommendation blocks to create a personalized experience.",
      },
      {
        emoji: "🔄",
        title: "Always Up-to-Date",
        description:
          "Your recommendations stay fresh and current. No more sending outdated links or forgetting what you recommended to whom.",
      },
    ],
  },

  successStory: {
    title: "Example Success Story",
    steps: [
      {
        emoji: "👨‍💻",
        text: "Alex is a tech enthusiast who loves trying new apps and gadgets.",
      },
      {
        emoji: "🔄",
        text: "His friends were constantly asking for app recommendations, product advice, and tech support.",
      },
      {
        emoji: "💬",
        text: "He was spending too much time repeating the same recommendations in different chat groups.",
      },
      {
        emoji: "💡",
        text: "With RCMD, Alex created a personal tech recommendation hub with different categories for apps, gadgets, and services.",
      },
      {
        emoji: "🔗",
        text: "Now he simply shares his RCMD link whenever someone asks for advice, saving time while providing more detailed recommendations.",
      },
    ],
  },

  ctaText: "Create Your RCMD Profile",
  ctaLink: "/sign-up",
};

// Create the document
async function createDocument() {
  try {
    // Check if document already exists
    const existingDoc = await client.fetch(
      '*[_type == "marketingPage" && slug.current == "for-individuals"][0]'
    );

    if (existingDoc) {
      console.log("Document already exists. Updating...");
      const result = await client
        .patch(existingDoc._id)
        .set(forIndividualsPage)
        .commit();
      console.log(`Successfully updated document: ${result._id}`);
    } else {
      console.log("Creating new document...");
      const result = await client.create(forIndividualsPage);
      console.log(`Successfully created document: ${result._id}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

createDocument();
