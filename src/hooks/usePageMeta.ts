import { useEffect } from "react";

interface PageMeta {
  canonical?: string;
  description?: string;
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  robots?: string;
  title: string;
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

export function usePageMeta({ title, description, canonical, image, type = "website", robots, jsonLd }: PageMeta) {
  useEffect(() => {
    const CANONICAL_ORIGIN = "https://www.bibliavive.com.br";
    document.title = title;

    if (description) {
      upsertMeta("description", description);
      upsertMeta("og:description", description, true);
      upsertMeta("twitter:description", description);
    }

    upsertMeta("og:title", title, true);
    upsertMeta("twitter:title", title);
    upsertMeta("og:type", type, true);
    if (robots) {
      upsertMeta("robots", robots);
    } else {
      const robotsTag = document.head.querySelector('meta[name="robots"]');
      if (robotsTag) {
        robotsTag.remove();
      }
    }
    if (image) {
      const absoluteImage = image.startsWith("http") ? image : `${CANONICAL_ORIGIN}${image}`;
      upsertMeta("og:image", absoluteImage, true);
      upsertMeta("twitter:image", absoluteImage);
    }

    const canonicalHref = canonical ? (canonical.startsWith("http") ? canonical : `${CANONICAL_ORIGIN}${canonical}`) : `${CANONICAL_ORIGIN}${window.location.pathname}`;
    let canonicalTag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.rel = "canonical";
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonicalHref;

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
  }, [canonical, description, image, jsonLd, robots, title, type]);
}
