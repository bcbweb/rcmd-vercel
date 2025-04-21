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

console.log('Starting migration for "help" page...');

// Convert HTML-like content to blocks
function createBlockContent(htmlContent) {
  // Simple approach to convert content with line breaks to blocks
  const paragraphs = htmlContent.split("\n\n").filter((p) => p.trim());

  return paragraphs.map((p) => ({
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: p.trim(),
      },
    ],
  }));
}

// Create FAQ block for each section
function createFaqSectionBlocks(section) {
  const blocks = [
    // Section heading
    {
      _type: "block",
      style: "h2",
      children: [{ _type: "span", text: section.title }],
    },
  ];

  // Add each FAQ
  section.faqs.forEach((faq) => {
    // Question as h3
    blocks.push({
      _type: "block",
      style: "h3",
      children: [{ _type: "span", text: faq.question }],
    });

    // Answer as paragraphs
    const answerBlocks = createBlockContent(faq.answer);
    blocks.push(...answerBlocks);
  });

  return blocks;
}

// Create the document
const helpPage = {
  _type: "page",
  title: "Help and FAQs",
  slug: {
    _type: "slug",
    current: "help",
  },
  showFooter: true,
  content: [
    // Intro paragraph
    {
      _type: "block",
      style: "normal",
      children: [
        {
          _type: "span",
          text: "Find answers to common questions about RCMD and how to make the most of your profile.",
        },
      ],
    },

    // Create all FAQ sections
    ...createFaqSectionBlocks({
      title: "For Content Creators",
      faqs: [
        {
          question: "How big a content creator do I have to be?",
          answer:
            "Any size! Content creators don't have to have celebrity status or have millions of followers. If you influence ten people, your voice matters and you can help support the companies you like and believe in.\n\nThe bigger you are, the more opportunity you may have to generate sales, and therefore the more you could be rewarded, but everyone has to start somewhere. RCMD is your space to find and promote the partners you work with, find new ones, and generate sales.",
        },
        {
          question: "Do I have to like what I promote?",
          answer:
            "In our minds, YES! You should not promote or sell things that you do not truly believe in. As a content creator you have a responsibility to your followers and fans... they are believing in you, don't mislead them.",
        },
        {
          question: "I'm a video blogger / YouTuber... can I benefit?",
          answer:
            "YES, absolutely! As someone sharing experiences and making reviews, your opinions count. RCMD is perfect for you as within your blogs and channels you'll be able to ReCOMmenD exactly what you like.\n\nYou can recommend not just what's sold on the big e-commerce stores, but you can even get local shops that you want to support to join our partner marketplace NEXU. They can add offers for the products you review and recommend, then you can promote those offers and help local companies grow. When you generate sales, you'll earn commissions.",
        },
      ],
    }),

    ...createFaqSectionBlocks({
      title: "Using RCMD Effectively",
      faqs: [
        {
          question: "Do I have to sell stuff from Amazon or eBay?",
          answer:
            "No. RCMD isn't just about helping you grow, it's about you helping the individual companies you like grow as well. If you buy and review equipment from a local shop, simply get them to join our marketplace partner NEXU for free, get them to add an offer for free, and then you promote that offer.\n\nEach sale you make, you'll get paid. RCMD wants to help you, the companies you like, communities and bring back a voice to smaller independent businesses. If you help them, they reward you... it's simple and everyone wins.",
        },
        {
          question: "How can I make the most of RCMD?",
          answer:
            "There are several ways to maximize your RCMD experience:\n\n🌐 Visibility – Your own mini website: Join RCMD, create your profile and centralize all of your marketing powers in one place so you can easily showcase ALL of your influencing potential.\n\n🛒 Sell: Add RCMD's (ReCOMmenDations) to link to marketplaces with your existing affiliate links (Amazon, partner web shops etc.)\n\n💰 Earn More: Invite businesses to join our partner marketplace NEXU and ask them to add products or services that you will promote for them. They can join for free, create listings for free, and then let you bring them advertising without any risk. When your posts and recommendations generate sales, you'll earn a commission.\n\n🤝 Empower your Fans and Followers: Products and services you sell via NEXU will pay you a commission. You can decide to share that with your Fans and Followers, motivating them to share your posts and bring you more influencing power by empowering and rewarding them!\n\n📈 A Passive Income: The businesses that you introduce to NEXU (using your invite link) could recognize you for the 'Business Introduction Commission' and bring you a passive income on ALL sales that they make through NEXU, even those not generated from your marketing efforts.",
        },
      ],
    }),

    ...createFaqSectionBlocks({
      title: "Social Media Integration",
      faqs: [
        {
          question:
            "How can RCMD help me make money from Instagram and other Social platforms?",
          answer:
            "Instagram is great for generating attention, but unless you can monetize it, it's all going to waste. Being able to send that attention somewhere that can turn it into money is the key.\n\nRCMD lets you use a single URL link to open up a window that allows you to showcase all your online presence, have a web shop, link to various marketplaces, and share across many platforms. This saves you the need of having to build your own website, create an online shop, or worry about sales.\n\nGet the companies you love to join our partner marketplace for free and you can earn even more.\n\n#RCMD lets you #bemore",
        },
      ],
    }),

    // "Still Have Questions?" section
    {
      _type: "block",
      style: "h2",
      children: [{ _type: "span", text: "Still Have Questions?" }],
    },
    {
      _type: "block",
      style: "normal",
      children: [
        {
          _type: "span",
          text: "We're here to help! If you couldn't find the answer you're looking for, please reach out to our support team.",
        },
      ],
    },
  ],

  // SEO settings
  seo: {
    metaTitle: "Help and FAQs | RCMD",
    metaDescription:
      "Find answers to frequently asked questions about using RCMD for content creators, businesses, and individuals.",
  },
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
    // Check if document already exists as a page type
    const existingDoc = await client.fetch(
      '*[_type == "page" && slug.current == "help"][0]'
    );

    if (existingDoc) {
      console.log("Document already exists. Updating...");
      const result = await client.patch(existingDoc._id).set(helpPage).commit();
      console.log(`Successfully updated document: ${result._id}`);
    } else {
      // Also check if it exists as marketingPage type and delete it
      const existingMarketingPage = await client.fetch(
        '*[_type == "marketingPage" && slug.current == "help"][0]'
      );

      if (existingMarketingPage) {
        console.log(
          "Found existing marketingPage version. Deleting it first..."
        );
        await client.delete(existingMarketingPage._id);
      }

      console.log("Creating new document as page type...");
      const result = await client.create(helpPage);
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
