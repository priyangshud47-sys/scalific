import type { Metadata } from "next";
import SiteMetaSettings from "@/components/SiteMetaSettings";
import { Toaster } from "@/components/ui/sonner";
import "../index.css";

export const metadata: Metadata = {
  title: "Scalific",
  description: "Premium digital growth agency website.",
  icons: {
    icon: "/favicon.svg",
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
