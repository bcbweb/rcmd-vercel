export default {
  name: "navigation",
  title: "Navigation",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      description:
        "Name of this navigation menu (e.g., 'Main Menu', 'Footer Menu')",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "identifier",
      title: "Identifier",
      type: "string",
      description:
        "Unique identifier for this navigation menu (e.g., 'main', 'footer')",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "items",
      title: "Navigation Items",
      type: "array",
      of: [
        {
          type: "object",
          name: "navItem",
          title: "Navigation Item",
          fields: [
            {
              name: "text",
              title: "Text",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "link",
              title: "Link Type",
              type: "string",
              options: {
                list: [
                  { title: "Internal Page", value: "internal" },
                  { title: "External URL", value: "external" },
                ],
              },
              initialValue: "internal",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "internalLink",
              title: "Internal Page",
              type: "reference",
              to: [{ type: "page" }],
              hidden: ({ parent }) => parent?.link !== "internal",
            },
            {
              name: "externalUrl",
              title: "External URL",
              type: "url",
              hidden: ({ parent }) => parent?.link !== "external",
            },
            {
              name: "isButton",
              title: "Show as Button",
              type: "boolean",
              description:
                "Display this item as a button instead of a text link",
              initialValue: false,
            },
            {
              name: "isActive",
              title: "Active",
              type: "boolean",
              description: "Whether this navigation item is currently active",
              initialValue: true,
            },
            {
              name: "children",
              title: "Child Items",
              type: "array",
              description: "Add child navigation items (for dropdowns)",
              of: [
                {
                  type: "object",
                  name: "childNavItem",
                  fields: [
                    {
                      name: "text",
                      title: "Text",
                      type: "string",
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: "link",
                      title: "Link Type",
                      type: "string",
                      options: {
                        list: [
                          { title: "Internal Page", value: "internal" },
                          { title: "External URL", value: "external" },
                        ],
                      },
                      initialValue: "internal",
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: "internalLink",
                      title: "Internal Page",
                      type: "reference",
                      to: [{ type: "page" }],
                      hidden: ({ parent }) => parent?.link !== "internal",
                    },
                    {
                      name: "externalUrl",
                      title: "External URL",
                      type: "url",
                      hidden: ({ parent }) => parent?.link !== "external",
                    },
                    {
                      name: "isActive",
                      title: "Active",
                      type: "boolean",
                      description:
                        "Whether this navigation item is currently active",
                      initialValue: true,
                    },
                  ],
                  preview: {
                    select: {
                      title: "text",
                      linkType: "link",
                      internalRef: "internalLink.title",
                      externalUrl: "externalUrl",
                    },
                    prepare({ title, linkType, internalRef, externalUrl }) {
                      return {
                        title,
                        subtitle:
                          linkType === "internal"
                            ? `Internal: ${internalRef || "Not selected"}`
                            : `External: ${externalUrl || "Not set"}`,
                      };
                    },
                  },
                },
              ],
            },
          ],
          preview: {
            select: {
              title: "text",
              linkType: "link",
              internalRef: "internalLink.title",
              externalUrl: "externalUrl",
              hasChildren: "children",
            },
            prepare({
              title,
              linkType,
              internalRef,
              externalUrl,
              hasChildren,
            }) {
              const subtitle =
                linkType === "internal"
                  ? `Internal: ${internalRef || "Not selected"}`
                  : `External: ${externalUrl || "Not set"}`;

              return {
                title,
                subtitle: `${subtitle}${hasChildren && hasChildren.length ? ` (+ ${hasChildren.length} children)` : ""}`,
              };
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      identifier: "identifier",
      items: "items",
    },
    prepare({ title, identifier, items }) {
      return {
        title,
        subtitle: `ID: ${identifier} (${items?.length || 0} items)`,
      };
    },
  },
};
