import { MainNavItem } from "@/types/navigation";

export const mainNavItems: MainNavItem[] = [
  {
    title: "About",
    items: [
      {
        title: "For individuals",
        href: "/for-individuals",
        description: "Learn how RCMD works for individual users",
      },
      {
        title: "For content creators",
        href: "/for-content-creators",
        description: "Discover our tools for content creators",
      },
      {
        title: "For businesses",
        href: "/for-businesses",
        description: "Enterprise solutions and business features",
      },
    ],
  },
  {
    title: "Explore",
    href: "/explore",
  },
  {
    title: "Help",
    href: "/help",
  },
];