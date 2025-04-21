export default {
  name: "marketingPage",
  title: "Marketing Page",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Page Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "description",
      title: "Description",
      type: "text",
      description: "Meta description for SEO and social sharing",
    },
    {
      name: "showFooter",
      title: "Show Footer",
      type: "boolean",
      description: "Show or hide the footer on this page.",
      initialValue: true,
    },
    {
      name: "headline",
      title: "Headline",
      type: "string",
      description: "Main headline for the page",
    },
    {
      name: "tagline",
      title: "Tagline",
      type: "string",
      description: "Supporting text below the headline",
    },
    {
      name: "slogan",
      title: "Slogan",
      type: "string",
      description: "Short slogan or catchphrase",
    },
    {
      name: "featuresList",
      title: "Features List",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "emoji",
              title: "Emoji",
              type: "string",
            },
            {
              name: "title",
              title: "Title",
              type: "string",
            },
            {
              name: "description",
              title: "Description",
              type: "text",
            },
          ],
        },
      ],
    },
    {
      name: "faqSections",
      title: "FAQ Sections",
      type: "array",
      description: "Sections of FAQs for pages like Help",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "title",
              title: "Section Title",
              type: "string",
            },
            {
              name: "faqs",
              title: "FAQs",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    {
                      name: "question",
                      title: "Question",
                      type: "string",
                    },
                    {
                      name: "answer",
                      title: "Answer",
                      type: "text",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "contactSection",
      title: "Contact Section",
      type: "object",
      description: "Section for contacting support or getting help",
      fields: [
        {
          name: "title",
          title: "Title",
          type: "string",
        },
        {
          name: "content",
          title: "Content",
          type: "text",
        },
        {
          name: "ctaText",
          title: "CTA Text",
          type: "string",
        },
        {
          name: "ctaLink",
          title: "CTA Link",
          type: "string",
        },
      ],
    },
    {
      name: "useCaseSection",
      title: "Use Case Section",
      type: "object",
      fields: [
        {
          name: "title",
          title: "Title",
          type: "string",
        },
        {
          name: "useCases",
          title: "Use Cases",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                {
                  name: "emoji",
                  title: "Emoji",
                  type: "string",
                },
                {
                  name: "title",
                  title: "Title",
                  type: "string",
                },
                {
                  name: "description",
                  title: "Description",
                  type: "text",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "infoSection",
      title: "Info Section",
      type: "object",
      fields: [
        {
          name: "title",
          title: "Title",
          type: "string",
        },
        {
          name: "content",
          title: "Content",
          type: "text",
        },
        {
          name: "steps",
          title: "Steps",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                {
                  name: "emoji",
                  title: "Emoji",
                  type: "string",
                },
                {
                  name: "title",
                  title: "Title",
                  type: "string",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "howItWorksSection",
      title: "How It Works Section",
      type: "object",
      fields: [
        {
          name: "title",
          title: "Title",
          type: "string",
        },
        {
          name: "steps",
          title: "Steps",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                {
                  name: "emoji",
                  title: "Emoji",
                  type: "string",
                },
                {
                  name: "title",
                  title: "Title",
                  type: "string",
                },
                {
                  name: "description",
                  title: "Description",
                  type: "text",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "successStory",
      title: "Success Story",
      type: "object",
      fields: [
        {
          name: "title",
          title: "Title",
          type: "string",
        },
        {
          name: "steps",
          title: "Story Steps",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                {
                  name: "emoji",
                  title: "Emoji",
                  type: "string",
                },
                {
                  name: "text",
                  title: "Text",
                  type: "text",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "ctaText",
      title: "Call to Action Text",
      type: "string",
      description: "Text for the call-to-action button",
    },
    {
      name: "ctaLink",
      title: "Call to Action Link",
      type: "string",
      description: "URL for the call-to-action button",
    },
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
    },
    prepare({ title, slug }) {
      return {
        title,
        subtitle: `/${slug}`,
      };
    },
  },
};
