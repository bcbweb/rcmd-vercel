"use client";

import * as React from "react";
import Link from "next/link";
import { MainNavItem } from "@/types/navigation";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Menu, X } from "lucide-react";

interface MainNavProps {
  items?: MainNavItem[];
  authButtons?: React.ReactNode;
}

export function MainNav({ items, authButtons }: MainNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const preventClickTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Add a function to handle all navigation actions
  const handleNavigation = () => {
    setIsOpen(false);
  };

  // Add effect to close menu on route change
  React.useEffect(() => {
    handleNavigation();
  }, [window.location.pathname]);

  return (
    <>
      {/* Desktop Menu */}
      <NavigationMenu className="hidden md:block">
        <NavigationMenuList>
          {items?.map((item) => (
            <NavigationMenuItem key={item.title}>
              {item.items ? (
                <>
                  <NavigationMenuTrigger onClick={preventClickTrigger}>
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {item.items.map((subItem) => (
                        <ListItem
                          key={subItem.title}
                          title={subItem.title}
                          href={subItem.href}
                          onClick={handleNavigation}
                        >
                          {subItem.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </>
              ) : (
                <Link href={item.href ?? "#"} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(navigationMenuTriggerStyle())}
                    onClick={handleNavigation}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Mobile Menu Button - aligned to the right of user menu */}
      <button
        className="md:hidden p-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-background border-b shadow-lg z-50">
          <nav className="px-4 py-2">
            {items?.map((item) => (
              <div key={item.title} className="py-2">
                {item.items ? (
                  <div>
                    <div className="font-medium mb-2">{item.title}</div>
                    <div className="pl-4 space-y-2">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.href ?? "#"}
                          className="block py-2 text-sm text-muted-foreground"
                          onClick={handleNavigation}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href ?? "#"}
                    className="block py-2 text-sm"
                    onClick={handleNavigation}
                  >
                    {item.title}
                  </Link>
                )}
              </div>
            ))}

            {/* Render auth buttons in mobile menu */}
            {authButtons && (
              <div className="py-4 border-t mt-2" onClick={handleNavigation}>
                {authButtons}
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground dark:bg-black",
            className
          )}
          href={href}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
