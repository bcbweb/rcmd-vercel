export default {
  name: "page",
  title: "Page",
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
      name: "showFooter",
      title: "Show Footer",
      type: "boolean",
      description:
        "Show or hide the footer on this page. Defaults to hidden if not specified.",
      initialValue: false,
    },
    {
      name: "content",
      title: "Page Content",
      type: "array",
      of: [
        {
          type: "block",
        },
        {
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              title: "Alternative Text",
              type: "string",
              description:
                "A description of the image for screen readers and SEO",
            },
            {
              name: "caption",
              title: "Caption",
              type: "string",
              description: "A caption to display with the image",
            },
          ],
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
      slug: "slug.current",
      showFooter: "showFooter",
    },
    prepare({ title, slug, showFooter }) {
      return {
        title,
        subtitle: `/${slug} ${showFooter ? "(with footer)" : "(no footer)"}`,
      };
    },
  },
};
