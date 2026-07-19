"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const SETTING_KEYS = [
  "favicon_url",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "seo_canonical_url",
  "seo_og_title",
  "seo_og_description",
  "seo_og_image",
  "geo_region",
  "geo_placename",
  "geo_position",
  "geo_icbm",
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
  if (!value) return;
  const existingIcons = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
  existingIcons.forEach((icon) => icon.remove());
  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = value;
  document.head.appendChild(icon);
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
        setFavicon(settings.favicon_url);
        setCanonical(settings.seo_canonical_url);
        setMeta('meta[name="description"]', "name", "description", description);
        setMeta('meta[name="keywords"]', "name", "keywords", settings.seo_keywords);
        setMeta('meta[property="og:title"]', "property", "og:title", ogTitle);
        setMeta('meta[property="og:description"]', "property", "og:description", ogDescription);
        setMeta('meta[property="og:image"]', "property", "og:image", settings.seo_og_image);
        setMeta('meta[name="geo.region"]', "name", "geo.region", settings.geo_region);
        setMeta('meta[name="geo.placename"]', "name", "geo.placename", settings.geo_placename);
        setMeta('meta[name="geo.position"]', "name", "geo.position", settings.geo_position);
        setMeta('meta[name="ICBM"]', "name", "ICBM", settings.geo_icbm || settings.geo_position);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
