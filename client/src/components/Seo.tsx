import { useEffect } from "react";
import { OFFICIAL_BRAND_NAME } from "../lib/types";
import { normalizePublicSiteOrigin } from "../../../scripts/site-origin-policy.mjs";

interface SeoProps {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "product";
  noindex?: boolean;
}

function upsertMeta(name: string, content: string, property = false) {
  const attribute = property ? "property" : "name";
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function removeMeta(name: string, property = false) {
  const attribute = property ? "property" : "name";
  document.head.querySelector(`meta[${attribute}="${name}"]`)?.remove();
}

export default function Seo({ title, description, image, imageAlt, type = "website", noindex = false }: SeoProps) {
  useEffect(() => {
    const currentPath = window.location.pathname;
    const shouldNoindex = noindex || currentPath === "/404" || /^\/admin(?:\/|$)/.test(currentPath);
    document.title = title;
    upsertMeta("description", description);
    upsertMeta("robots", shouldNoindex ? "noindex,nofollow" : "index,follow");
    upsertMeta("og:title", title, true);
    upsertMeta("og:description", description, true);
    upsertMeta("og:type", type, true);
    upsertMeta("og:site_name", OFFICIAL_BRAND_NAME, true);
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    const siteOrigin = normalizePublicSiteOrigin(import.meta.env.VITE_SITE_URL);
    const canonicalUrl = siteOrigin && !shouldNoindex
      ? new URL(currentPath, `${siteOrigin}/`).toString()
      : null;
    if (canonicalUrl) {
      let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
      upsertMeta("og:url", canonicalUrl, true);
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      removeMeta("og:url", true);
    }
    let absoluteImage = "";
    try {
      if (image?.startsWith("https://")) absoluteImage = image;
      else if (image && canonicalUrl) absoluteImage = new URL(image, canonicalUrl).toString();
    } catch { /* Ignore an unresolvable optional image URL. */ }
    if (absoluteImage) {
      upsertMeta("og:image", absoluteImage, true);
      upsertMeta("og:image:alt", imageAlt || "Illustrative modest-fashion styling reference, not a product photograph", true);
      upsertMeta("twitter:image", absoluteImage);
      upsertMeta("twitter:card", "summary_large_image");
    } else {
      removeMeta("og:image", true);
      removeMeta("og:image:alt", true);
      removeMeta("twitter:image");
      upsertMeta("twitter:card", "summary");
    }
  }, [title, description, image, imageAlt, type, noindex]);
  return null;
}
