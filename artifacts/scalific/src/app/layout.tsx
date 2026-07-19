import type { Metadata } from "next";
import SiteMetaSettings from "@/components/SiteMetaSettings";
import { Toaster } from "@/components/ui/sonner";
import "../index.css";

export const metadata: Metadata = {
  title: "Scalific",
  description: "Premium digital growth agency website.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/assets/scalific-logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteMetaSettings />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
