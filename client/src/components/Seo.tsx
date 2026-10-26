import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  image?: string;
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

export default function Seo({ title, description, image, noindex = false }: SeoProps) {
  useEffect(() => {
    document.title = title;
    upsertMeta("description", description);
    upsertMeta("robots", noindex ? "noindex,nofollow" : "index,follow");
    upsertMeta("og:title", title, true);
    upsertMeta("og:description", description, true);
    upsertMeta("og:type", "website", true);
    upsertMeta("og:site_name", "Modest Fashion", true);
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    const configuredUrl = import.meta.env.VITE_SITE_URL?.trim();
    let canonicalUrl: string | null = null;
    if (configuredUrl) {
      try {
        const site = new URL(configuredUrl);
        if (site.protocol === "https:" && !site.username && !site.password && !site.hostname.endsWith(".example")) {
          canonicalUrl = new URL(window.location.pathname, site.origin).toString();
        }
      } catch { /* Omit canonical tags until a valid public HTTPS origin is configured. */ }
    }
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
      upsertMeta("twitter:image", absoluteImage);
      upsertMeta("twitter:card", "summary_large_image");
    } else {
      removeMeta("og:image", true);
      removeMeta("twitter:image");
      upsertMeta("twitter:card", "summary");
    }
  }, [title, description, image, noindex]);
  return null;
}
