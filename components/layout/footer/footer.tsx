import { ThemeSwitcher } from "@/components/common/theme-switcher";
import Link from "next/link";
import { Instagram, Twitter, Facebook, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const footerSections = [
    {
      title: "RCMD",
      links: [
        { text: "Home", href: "/" },
        { text: "Explore", href: "/explore" },
        { text: "Influencers", href: "/influencers" },
        { text: "Invite", href: "/invite" },
      ],
    },
    {
      title: "About",
      links: [
        { text: "Help and FAQs", href: "/help" },
        { text: "For Individuals", href: "/for-individuals" },
        { text: "For Content Creators", href: "/for-content-creators" },
        { text: "For Businesses", href: "/for-businesses" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "Community", href: "/community" },
        { text: "Blog", href: "/blog" },
        { text: "Documentation", href: "/docs" },
      ],
    },
    {
      title: "Legal",
      links: [
        { text: "Privacy Policy", href: "/privacy" },
        { text: "Terms of Service", href: "/terms" },
        { text: "Cookie Policy", href: "/cookies" },
      ],
    },
    {
      title: "Contact",
      links: [
        { text: "Contact Us", href: "/contact" },
        { text: "Support", href: "/support" },
        { text: "Careers", href: "/careers" },
      ],
    },
  ];

  const socialLinks = [
    {
      icon: <Twitter size={20} />,
      href: "https://twitter.com/rcmd",
      label: "Twitter",
    },
    {
      icon: <Instagram size={20} />,
      href: "https://instagram.com/rcmd",
      label: "Instagram",
    },
    {
      icon: <Facebook size={20} />,
      href: "https://facebook.com/rcmd",
      label: "Facebook",
    },
    {
      icon: <Linkedin size={20} />,
      href: "https://linkedin.com/company/rcmd",
      label: "LinkedIn",
    },
    {
      icon: <Github size={20} />,
      href: "https://github.com/rcmd",
      label: "GitHub",
    },
  ];

  return (
    <footer className="w-full bg-white dark:bg-transparent border-t">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.text}>
                    <Link
                      href={link.href}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social media links */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Follow Us
          </h3>
          <div className="flex space-x-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
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
