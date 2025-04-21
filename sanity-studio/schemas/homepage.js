export default {
  name: "homepage",
  title: "Homepage",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Page Title",
      type: "string",
      description: "Title for the homepage (for internal use)",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "showFooter",
      title: "Show Footer",
      type: "boolean",
      description:
        "Show or hide the footer on the homepage. Defaults to hidden if not specified.",
      initialValue: false,
    },
    {
      name: "hero",
      title: "Hero Section",
      type: "object",
      fields: [
        {
          name: "heading",
          title: "Heading",
          type: "string",
        },
        {
          name: "subheading",
          title: "Subheading",
          type: "text",
        },
        {
          name: "backgroundImage",
          title: "Background Image",
          type: "image",
          options: {
            hotspot: true,
          },
        },
        {
          name: "cta",
          title: "Call to Action",
          type: "object",
          fields: [
            {
              name: "text",
              title: "Button Text",
              type: "string",
            },
            {
              name: "link",
              title: "Button Link",
              type: "string",
            },
          ],
        },
      ],
    },
    {
      name: "featuredSections",
      title: "Featured Content Sections",
      type: "array",
      of: [
        {
          type: "object",
          title: "Content Section",
          fields: [
            {
              name: "sectionId",
              title: "Section ID",
              type: "string",
              description:
                "Unique identifier for this section (e.g., 'trending-rcmds', 'staff-picks')",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "title",
              title: "Section Title",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "description",
              title: "Section Description",
              type: "text",
            },
            {
              name: "contentType",
              title: "Content Type",
              type: "string",
              options: {
                list: [
                  { title: "Featured Links", value: "links" },
                  { title: "Custom Content", value: "custom" },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: "layout",
              title: "Layout Style",
              type: "string",
              options: {
                list: [
                  { title: "Grid", value: "grid" },
                  { title: "Carousel", value: "carousel" },
                  { title: "Featured", value: "featured" },
                  { title: "List", value: "list" },
                ],
              },
              initialValue: "carousel",
            },
            {
              name: "cardsPerView",
              title: "Cards Per View (for carousel)",
              type: "number",
              initialValue: 3,
              options: {
                list: [
                  { title: "1", value: 1 },
                  { title: "2", value: 2 },
                  { title: "3", value: 3 },
                  { title: "4", value: 4 },
                ],
              },
              hidden: ({ parent }) => parent?.layout !== "carousel",
            },
            {
              name: "limit",
              title: "Number of Items to Show",
              type: "number",
              initialValue: 10,
            },
            {
              name: "featuredItems",
              title: "Featured Items",
              description: "For custom curated sections, select specific items",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "customItem",
                  title: "Custom Item",
                  fields: [
                    {
                      name: "title",
                      title: "Title",
                      type: "string",
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: "description",
                      title: "Description",
                      type: "text",
                    },
                    {
                      name: "image",
                      title: "Image",
                      type: "image",
                      options: {
                        hotspot: true,
                      },
                    },
                    {
                      name: "link",
                      title: "Link",
                      type: "url",
                    },
                  ],
                },
              ],
              hidden: ({ parent }) => parent?.contentType !== "custom",
            },
            {
              name: "backgroundColor",
              title: "Background Color",
              type: "string",
              description: "CSS color value (e.g., #f3f4f6)",
            },
            {
              name: "showMoreLink",
              title: "Show 'See More' Link",
              type: "boolean",
              initialValue: true,
            },
            {
              name: "moreLink",
              title: "'See More' Link",
              type: "string",
              description: "URL for the 'See More' link",
              hidden: ({ parent }) => !parent?.showMoreLink,
            },
            {
              name: "priority",
              title: "Display Priority",
              type: "number",
              description:
                "Order of appearance on the homepage (lower = earlier)",
              initialValue: 10,
            },
          ],
          preview: {
            select: {
              title: "title",
              contentType: "contentType",
              layout: "layout",
            },
            prepare({ title, contentType, layout }) {
              return {
                title,
                subtitle: `${contentType} (${layout} layout)`,
              };
            },
          },
        },
      ],
    },
    {
      name: "seo",
      title: "SEO Settings",
      type: "object",
      fields: [
        {
          name: "metaTitle",
          title: "Meta Title",
          type: "string",
        },
        {
          name: "metaDescription",
          title: "Meta Description",
          type: "text",
        },
        {
          name: "shareImage",
          title: "Social Sharing Image",
          type: "image",
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      sections: "featuredSections",
      showFooter: "showFooter",
    },
    prepare({ title, sections, showFooter }) {
      return {
        title,
        subtitle: `${sections?.length || 0} content section${sections?.length !== 1 ? "s" : ""} ${showFooter ? "(with footer)" : "(no footer)"}`,
      };
    },
  },
};
