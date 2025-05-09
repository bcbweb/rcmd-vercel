import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account - RCMD",
  description: "Manage your RCMD account settings",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
