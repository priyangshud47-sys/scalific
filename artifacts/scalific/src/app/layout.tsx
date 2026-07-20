import type { Metadata } from "next";
import SiteMetaSettings from "@/components/SiteMetaSettings";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import "../index.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "seo_title",
        "seo_description",
        "seo_keywords",
        "seo_canonical_url",
        "seo_og_title",
        "seo_og_description",
        "seo_og_image",
        "favicon_url",
        "color_primary"
      ]);

    const settings: Record<string, string> = {};
    if (data && data.length > 0) {
      data.forEach((item) => {
        if (item.value) settings[item.key] = item.value;
      });
    }

    const title = settings.seo_title || "Scalific | Premium Digital Agency";
    const description = settings.seo_description || "Scalific is a premium digital growth agency building high-converting brands, websites, and performance marketing campaigns.";
    const ogTitle = settings.seo_og_title || title;
    const ogDescription = settings.seo_og_description || description;
    const ogImage = settings.seo_og_image || undefined;
    const canonicalUrl = settings.seo_canonical_url || undefined;
    const faviconUrl = settings.favicon_url || "/favicon.svg";

    return {
      title,
      description,
      keywords: settings.seo_keywords ? settings.seo_keywords.split(",").map((k) => k.trim()) : undefined,
      alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
      icons: {
        icon: [
          { url: faviconUrl, type: faviconUrl.endsWith(".svg") ? "image/svg+xml" : undefined },
        ],
        shortcut: faviconUrl,
        apple: faviconUrl,
      },
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: canonicalUrl,
        siteName: title,
        images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }] : undefined,
        type: "website",
      },
      twitter: {
        card: ogImage ? "summary_large_image" : "summary",
        title: ogTitle,
        description: ogDescription,
        images: ogImage ? [ogImage] : undefined,
      },
    };
  } catch (err) {
    console.error("Error generating dynamic metadata:", err);
    return {
      title: "Scalific | Premium Digital Agency",
      description: "Scalific is a premium digital growth agency website.",
      icons: {
        icon: "/favicon.svg",
      },
    };
  }
}

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
