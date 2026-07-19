"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { applyBrandColor } from "@/lib/brandColor";

const SETTING_KEYS = [
  "color_primary",
  "favicon_url",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "seo_canonical_url",
  "seo_og_title",
  "seo_og_description",
  "seo_og_image",
  "geo_ai_summary",
  "geo_semantic_keywords",
  "geo_json_ld_schema",
  "geo_crawlers_policy",
  "fb_pixel_id",
  "ga4_measurement_id",
  "gtm_container_id",
];

function setMeta(selector: string, attribute: "name" | "property", key: string, value?: string | null) {
  if (!value) return;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = value;
}

function setCanonical(value?: string | null) {
  if (!value) return;
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = value;
}

function setFavicon(value?: string | null) {
  const hrefValue = value || "/favicon.svg";
  const existingIcons = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
  
  if (existingIcons.length > 0) {
    existingIcons.forEach((icon) => {
      icon.href = hrefValue;
      if (hrefValue.endsWith(".svg")) {
        icon.type = "image/svg+xml";
      } else {
        icon.removeAttribute("type");
      }
    });
  } else {
    const icon = document.createElement("link");
    icon.rel = "icon";
    if (hrefValue.endsWith(".svg")) {
      icon.type = "image/svg+xml";
    }
    icon.href = hrefValue;
    document.head.appendChild(icon);
  }
}

function setJsonLd(schemaString?: string | null) {
  const existingScript = document.head.querySelector('script[type="application/ld+json"][data-geo="true"]');
  if (existingScript) {
    existingScript.remove();
  }
  if (!schemaString) return;
  try {
    JSON.parse(schemaString);
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-geo", "true");
    script.text = schemaString;
    document.head.appendChild(script);
  } catch (e) {
    console.error("Invalid JSON-LD schema provided", e);
  }
}

function injectTrackingScripts(fbPixelId?: string | null, ga4Id?: string | null, gtmId?: string | null) {
  if (fbPixelId && !document.head.querySelector(`script[data-tracking="fb-pixel"]`)) {
    const script = document.createElement("script");
    script.setAttribute("data-tracking", "fb-pixel");
    script.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${fbPixelId}');fbq('track', 'PageView');`;
    document.head.appendChild(script);
  }

  if (ga4Id && !document.head.querySelector(`script[data-tracking="ga4"]`)) {
    const script = document.createElement("script");
    script.setAttribute("data-tracking", "ga4");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(script);

    const initScript = document.createElement("script");
    initScript.setAttribute("data-tracking", "ga4-init");
    initScript.text = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${ga4Id}');`;
    document.head.appendChild(initScript);
  }

  if (gtmId && !document.head.querySelector(`script[data-tracking="gtm"]`)) {
    const script = document.createElement("script");
    script.setAttribute("data-tracking", "gtm");
    script.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(script);
  }
}

export default function SiteMetaSettings() {
  useEffect(() => {
    let isMounted = true;

    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", SETTING_KEYS)
      .then(({ data }) => {
        if (!isMounted || !data) return;
        const settings = Object.fromEntries(data.map((item) => [item.key, item.value]));
        const title = settings.seo_title || "Scalific";
        const description = settings.seo_description || "Premium digital growth agency website.";
        const ogTitle = settings.seo_og_title || title;
        const ogDescription = settings.seo_og_description || description;

        document.title = title;
        if (settings.color_primary) {
          applyBrandColor(settings.color_primary);
        }
        setFavicon(settings.favicon_url);
        setCanonical(settings.seo_canonical_url);
        setMeta('meta[name="description"]', "name", "description", description);
        setMeta('meta[name="keywords"]', "name", "keywords", settings.seo_keywords);
        setMeta('meta[property="og:title"]', "property", "og:title", ogTitle);
        setMeta('meta[property="og:description"]', "property", "og:description", ogDescription);
        setMeta('meta[property="og:image"]', "property", "og:image", settings.seo_og_image);
        setMeta('meta[name="ai-description"]', "name", "ai-description", settings.geo_ai_summary);
        setMeta('meta[name="ai-keywords"]', "name", "ai-keywords", settings.geo_semantic_keywords);
        setMeta('meta[name="robots"]', "name", "robots", settings.geo_crawlers_policy || "index, follow");
        setJsonLd(settings.geo_json_ld_schema);
        injectTrackingScripts(settings.fb_pixel_id, settings.ga4_measurement_id, settings.gtm_container_id);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
