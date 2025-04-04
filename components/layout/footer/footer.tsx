import { ThemeSwitcher } from "@/components/common/theme-switcher";

export default function Footer() {
  const footerSections = [
    {
      title: "RCMD",
      links: [
        { text: "Home", href: "/" },
        { text: "Influencers", href: "/influencers" },
        { text: "Invite", href: "/invite" },
      ],
    },
    {
      title: "About",
      links: [
        { text: "Help and FAQs", href: "/help" },
        { text: "RCMD for individuals", href: "/individuals" },
        { text: "RCMD for influencers", href: "/influencers-info" },
      ],
    },
    {
      title: "Business",
      links: [{ text: "RCMD for business", href: "/business" }],
    },
    {
      title: "Pricing",
      links: [{ text: "RCMD plans", href: "/pricing" }],
    },
    {
      title: "Legal",
      links: [
        { text: "Privacy policy", href: "/privacy" },
        { text: "Terms and conditions", href: "/terms" },
      ],
    },
    {
      title: "Contact",
      links: [{ text: "Contact us", href: "/contact" }],
    },
  ];

  return (
    <footer className="w-full bg-white dark:bg-transparent border-t">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.text}>
                    <a
                      href={link.href}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* Add copyright and theme switcher below the main content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>© {new Date().getFullYear()} RCMD. All rights reserved.</span>
          <ThemeSwitcher />
        </div>
      </div>
    </footer>
  );
}
