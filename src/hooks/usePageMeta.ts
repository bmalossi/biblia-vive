import { useEffect } from "react";

export interface PageMetaOptions {
  title: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  ogImageAlt?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  fbAppId?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  // Backward compatibility mappings
  image?: string;
  type?: string;
}

const upsertMeta = (name: string, content: string, property = false) => {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    if (property) tag.setAttribute("property", name);
    else tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.content = content;
};

const removeMeta = (name: string, property = false) => {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  const tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (tag) {
    tag.remove();
  }
};

function resolveAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = typeof window !== "undefined"
    ? window.location.origin
    : "https://www.bibliavive.com.br";
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function usePageMeta({
  title,
  description,
  canonical,
  robots,
  ogType,
  ogImage,
  ogImageAlt,
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  fbAppId,
  jsonLd,
  image,
  type,
}: PageMetaOptions) {
  useEffect(() => {
    // 1. Update basic page meta
    document.title = title;

    if (robots) {
      upsertMeta("robots", robots);
    } else {
      removeMeta("robots");
    }

    if (description) {
      upsertMeta("description", description);
    } else {
      removeMeta("description");
    }

    // Determine values considering backward compatibility aliases
    const finalType = ogType || type || "website";
    const finalImage = ogImage || image;
    const isNoIndex = robots?.includes("noindex");

    if (isNoIndex) {
      // Clean up all Open Graph and Twitter Card tags
      removeMeta("og:type", true);
      removeMeta("og:site_name", true);
      removeMeta("og:title", true);
      removeMeta("og:description", true);
      removeMeta("og:url", true);
      removeMeta("og:image", true);
      removeMeta("og:image:width", true);
      removeMeta("og:image:height", true);
      removeMeta("og:image:alt", true);
      removeMeta("og:locale", true);
      removeMeta("fb:app_id", true);

      removeMeta("twitter:card");
      removeMeta("twitter:title");
      removeMeta("twitter:description");
      removeMeta("twitter:image");
      removeMeta("twitter:image:alt");

      removeMeta("article:published_time", true);
      removeMeta("article:modified_time", true);
      removeMeta("article:author", true);
    } else {
      // Upsert Open Graph tags
      upsertMeta("og:type", finalType, true);
      upsertMeta("og:site_name", "Bíblia Vive", true);
      upsertMeta("og:title", title, true);
      
      if (description) {
        upsertMeta("og:description", description, true);
      } else {
        removeMeta("og:description", true);
      }

      // Compute and resolve absolute URL for og:url
      const rawUrl = canonical || (window.location.origin + window.location.pathname);
      upsertMeta("og:url", resolveAbsoluteUrl(rawUrl), true);

      // Compute and resolve absolute URL for og:image
      const imagePath = finalImage || "/og-default.png";
      const absImage = resolveAbsoluteUrl(imagePath);
      upsertMeta("og:image", absImage, true);
      upsertMeta("og:image:width", "1200", true);
      upsertMeta("og:image:height", "630", true);
      
      if (ogImageAlt) {
        upsertMeta("og:image:alt", ogImageAlt, true);
      } else {
        removeMeta("og:image:alt", true);
      }
      
      upsertMeta("og:locale", "pt_BR", true);

      // Facebook App ID to silence debugger warning
      const finalFbAppId = fbAppId || import.meta.env.VITE_FB_APP_ID || "1035985160869680";
      if (finalFbAppId) {
        upsertMeta("fb:app_id", finalFbAppId, true);
      } else {
        removeMeta("fb:app_id", true);
      }

      // Upsert Twitter Card tags
      upsertMeta("twitter:card", "summary_large_image");
      upsertMeta("twitter:title", title);
      
      if (description) {
        upsertMeta("twitter:description", description);
      } else {
        removeMeta("twitter:description");
      }
      
      upsertMeta("twitter:image", absImage);
      
      if (ogImageAlt) {
        upsertMeta("twitter:image:alt", ogImageAlt);
      } else {
        removeMeta("twitter:image:alt");
      }

      // Article specific metadata
      if (finalType === "article") {
        if (articlePublishedTime) {
          upsertMeta("article:published_time", articlePublishedTime, true);
        } else {
          removeMeta("article:published_time", true);
        }

        if (articleModifiedTime) {
          upsertMeta("article:modified_time", articleModifiedTime, true);
        } else {
          removeMeta("article:modified_time", true);
        }

        const author = articleAuthor || "Bíblia Vive";
        upsertMeta("article:author", author, true);
      } else {
        removeMeta("article:published_time", true);
        removeMeta("article:modified_time", true);
        removeMeta("article:author", true);
      }
    }

    // Canonical tag logic
    const canonicalHref = canonical
      ? resolveAbsoluteUrl(canonical)
      : resolveAbsoluteUrl(window.location.pathname);
      
    let canonicalTag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.rel = "canonical";
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonicalHref;

    // JSON-LD logic
    const id = "bv-json-ld";
    const previousScript = document.getElementById(id);
    if (previousScript) previousScript.remove();

    if (jsonLd) {
      const script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [
    title,
    description,
    canonical,
    robots,
    ogType,
    ogImage,
    ogImageAlt,
    articlePublishedTime,
    articleModifiedTime,
    articleAuthor,
    fbAppId,
    jsonLd,
    image,
    type,
  ]);
}
