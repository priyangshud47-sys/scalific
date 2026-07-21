import type { Metadata } from "next";
import SiteMetaSettings from "@/components/SiteMetaSettings";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import "../index.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
        "color_primary",
        "geo_ai_summary",
        "geo_semantic_keywords",
        "geo_crawlers_policy"
      ]);

    const settings: Record<string, string> = {};
    if (data && data.length > 0) {
      data.forEach((item) => {
        if (item.value) settings[item.key] = item.value;
      });
    }

    const title = settings.seo_title || "Scalific — Brand & Growth Agency for Startup Founders";
    const description = settings.seo_description || "Scalific is a premium brand identity & growth marketing agency for startup founders. We build high-converting brands, websites, and performance marketing campaigns.";
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
      robots: settings.geo_crawlers_policy || "index, follow",
      other: {
        ...(settings.geo_ai_summary ? { "ai-description": settings.geo_ai_summary } : {}),
        ...(settings.geo_semantic_keywords ? { "ai-keywords": settings.geo_semantic_keywords } : {})
      },
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
      title: "Scalific — Brand & Growth Agency for Startup Founders",
      description: "Scalific is a premium brand identity & growth marketing agency for startup founders. We build high-converting brands, websites, and performance marketing campaigns.",
      icons: {
        icon: "/favicon.svg",
      },
    };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let jsonLd = null;
  try {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "geo_json_ld_schema").single();
    if (data?.value) jsonLd = data.value;
  } catch (err) {
    console.error("Error fetching JSON-LD schema:", err);
  }

  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Scalific",
    "url": "https://scalific.in",
    "logo": "https://scalific.in/assets/scalific-logo.png",
    "description": "Scalific is a premium brand identity & growth marketing agency for startup founders.",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "hello@scalific.in",
      "contactType": "customer support"
    }
  };

  const schemaString = jsonLd || JSON.stringify(defaultSchema);

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaString }} />
        <SiteMetaSettings />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
