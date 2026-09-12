import { marked } from "marked";

export interface ArticleAuthor {
  id?: string;
  name: string;
  slug: string;
  avatar_url?: string | null;
  bio?: string | null;
  church?: string | null;
  city?: string | null;
  role?: string | null;
  linkedin_url?: string | null;
  orcid_url?: string | null;
  wikidata_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
}

export interface ArticleData {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: "rascunho" | "publicado";
  meta_title?: string | null;
  meta_description?: string | null;
  cover_image_url?: string | null;
  featured?: boolean;
  created_at?: string;
  published_at?: string | null;
  updated_at?: string | null;
  subtitle?: string | null;
  author_id?: string | null;
  reviewed_by?: string | null;
  author?: ArticleAuthor | null;
  youtube_id?: string | null;
  youtubeId?: string | null;
  video_url?: string | null;
  video_title?: string | null;
  video_description?: string | null;
}

export const CANONICAL_ORIGIN = "https://www.bibliavive.com.br";
export const FB_APP_ID = "1035985160869680";

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function stripHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Generates the complete HTML document for an individual article.
 */
export function generateArticleHtml(article: ArticleData): string {
  const safeTitle = article.meta_title || `${article.title} — Bíblia Vive`;
  const rawDesc = article.meta_description || stripHtml(article.body).substring(0, 160);
  const safeDesc = rawDesc.substring(0, 160);
  const url = `${CANONICAL_ORIGIN}/artigos/${article.slug}`;
  const coverImage = article.cover_image_url || `${CANONICAL_ORIGIN}/og-default.png`;

  let bodyHtml = "";
  if (article.body) {
    try {
      bodyHtml = marked.parse(String(article.body), { async: false }) as string;
    } catch {
      bodyHtml = `<p>${escapeHtml(article.body)}</p>`;
    }
  }

  const pubDateFormatted = article.published_at
    ? new Date(article.published_at).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const pubDateBlock = article.published_at
    ? `<time datetime="${escapeHtml(article.published_at)}" style="color:#666;font-size:0.875rem;display:block;margin-bottom:1rem">${pubDateFormatted}</time>`
    : "";

  const coverBlock = article.cover_image_url
    ? `<img src="${escapeHtml(article.cover_image_url)}" alt="${escapeHtml(article.title)}" style="width:100%;max-width:780px;height:auto;border-radius:8px;margin-bottom:1.5rem" />`
    : "";

  const subtitleBlock = article.subtitle
    ? `<p style="font-size:1.125rem;color:#555;margin-bottom:1rem"><em>${escapeHtml(article.subtitle)}</em></p>`
    : "";

  const geoSummaryText = safeDesc.length > 60
    ? safeDesc
    : `${article.title}. ${safeDesc} — Artigo teológico publicado na Bíblia Vive.`;
  const geoSummary = `<section class="geo-summary" style="display:block;font-family:serif;font-size:0.9rem;color:#444;line-height:1.6;margin:0.75rem 0 1.25rem;padding:0.75rem 1rem;border-left:3px solid #d4af37;background:#faf8f2">${escapeHtml(geoSummaryText)}</section>`;

  const dateMicrodata = (article.published_at || article.updated_at)
    ? `<div style="display:none" itemscope itemtype="https://schema.org/Article">` +
      (article.published_at ? `<meta itemprop="datePublished" content="${escapeHtml(article.published_at)}" />` : "") +
      (article.updated_at ? `<meta itemprop="dateModified" content="${escapeHtml(article.updated_at)}" />` : "") +
      `<meta itemprop="publisher" content="Bíblia Vive" /></div>`
    : "";

  const ytId = article.youtube_id || article.youtubeId || (article.video_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)?.[1]);

  const authorPerson = article.author
    ? {
        "@type": "Person",
        "@id": `${CANONICAL_ORIGIN}/autor/${article.author.slug}#person`,
        name: article.author.name,
        url: `${CANONICAL_ORIGIN}/autor/${article.author.slug}`,
        ...(article.author.role ? { jobTitle: article.author.role } : {}),
        ...(article.author.church ? { worksFor: { "@type": "Organization", name: article.author.church } } : {}),
        image: article.author.avatar_url || `${CANONICAL_ORIGIN}/og/home.png`,
        sameAs: [
          `${CANONICAL_ORIGIN}/autor/${article.author.slug}`,
          ...(article.author.linkedin_url ? [article.author.linkedin_url] : []),
          ...(article.author.orcid_url ? [article.author.orcid_url] : []),
          ...(article.author.wikidata_url ? [article.author.wikidata_url] : []),
          ...(article.author.twitter_url ? [article.author.twitter_url] : []),
          ...(article.author.instagram_url ? [article.author.instagram_url] : []),
        ],
      }
    : {
        "@type": "Organization",
        "@id": `${CANONICAL_ORIGIN}#organization`,
        name: "Bíblia Vive",
        url: CANONICAL_ORIGIN,
      };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: safeDesc,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: coverImage,
    author: authorPerson,
    ...(article.published_at ? { datePublished: article.published_at } : {}),
    ...(article.updated_at ? { dateModified: article.updated_at } : {}),
    isPartOf: {
      "@type": "WebSite",
      "@id": `${CANONICAL_ORIGIN}#website`,
      name: "Bíblia Vive",
      url: CANONICAL_ORIGIN,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${CANONICAL_ORIGIN}#organization`,
      name: "Bíblia Vive",
      url: CANONICAL_ORIGIN,
      logo: { "@type": "ImageObject", url: `${CANONICAL_ORIGIN}/og/home.png` },
      sameAs: [
        "https://www.instagram.com/biblia.vive/",
        "https://www.facebook.com/bibliavive/",
      ],
    },
    inLanguage: "pt-BR",
    ...(ytId
      ? {
          video: {
            "@type": "VideoObject",
            "@id": `${url}#video`,
            name: article.video_title || article.title,
            description: article.video_description || safeDesc,
            thumbnailUrl: article.cover_image_url || `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
            contentUrl: `https://www.youtube.com/watch?v=${ytId}`,
            embedUrl: `https://www.youtube.com/embed/${ytId}`,
            uploadDate: article.published_at || article.created_at,
            mainEntityOfPage: {
              "@type": "Article",
              "@id": `${url}#article`,
            },
          },
        }
      : {}),
  };

  const articleContent =
    `<article style="font-family:serif;max-width:780px;margin:0 auto;padding:1rem">` +
    `<h1>${escapeHtml(article.title)}</h1>` +
    geoSummary +
    subtitleBlock +
    pubDateBlock +
    dateMicrodata +
    coverBlock +
    bodyHtml +
    `</article>`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${escapeHtml(safeTitle)}</title>
  <meta name="description" content="${escapeHtml(safeDesc)}" />
  <meta name="author" content="${escapeHtml(article.author?.name || 'Bíblia Vive')}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${escapeHtml(url)}" />
  <link rel="alternate" type="application/rss+xml" title="Bíblia Vive" href="${CANONICAL_ORIGIN}/feed.xml" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:title" content="${escapeHtml(safeTitle)}" />
  <meta property="og:description" content="${escapeHtml(safeDesc)}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="${escapeHtml(coverImage)}" />
  <meta property="fb:app_id" content="${FB_APP_ID}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(safeTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(safeDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(coverImage)}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body>
  <div id="root">
    <div class="bv-seo-shell">
      ${articleContent}
    </div>
  </div>
  <noscript>
    ${articleContent}
  </noscript>
</body>
</html>`;
}

/**
 * Generates the complete HTML document for the /artigos listing page.
 */
export function generateArticlesIndexHtml(articles: ArticleData[]): string {
  const title = "Artigos Bíblicos | Bíblia Vive";
  const desc = "Explore artigos e conteúdo teológico sobre a Palavra de Deus.";
  const url = `${CANONICAL_ORIGIN}/artigos`;

  const articleItems = articles.map(a => {
    const aUrl = `/artigos/${a.slug}`;
    const pubDate = a.published_at
      ? new Date(a.published_at).toLocaleDateString("pt-BR", { year: "numeric", month: "short", day: "numeric" })
      : "";
    const authorName = a.author?.name ? ` por ${escapeHtml(a.author.name)}` : "";
    return `<li style="margin-bottom:1.25rem">
      <h2 style="font-size:1.25rem;margin:0 0 0.25rem"><a href="${escapeHtml(aUrl)}" style="color:#d4af37;text-decoration:none">${escapeHtml(a.title)}</a></h2>
      <p style="font-size:0.875rem;color:#666;margin:0 0 0.5rem">${pubDate}${authorName}</p>
      <p style="font-size:0.95rem;color:#333;margin:0">${escapeHtml(a.meta_description || stripHtml(a.body).substring(0, 160))}</p>
    </li>`;
  }).join("\n");

  const seoContent =
    `<main style="font-family:serif;max-width:780px;margin:0 auto;padding:1rem">` +
    `<h1>Artigos Bíblicos</h1>` +
    `<p>${escapeHtml(desc)}</p>` +
    `<ul style="list-style:none;padding:0">${articleItems}</ul>` +
    `</main>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: desc,
    url,
    inLanguage: "pt-BR",
  };

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" type="application/rss+xml" title="Bíblia Vive" href="${CANONICAL_ORIGIN}/feed.xml" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${CANONICAL_ORIGIN}/og-default.png" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <div id="root">
    <div class="bv-seo-shell">
      ${seoContent}
    </div>
  </div>
  <noscript>
    ${seoContent}
  </noscript>
</body>
</html>`;
}

/**
 * Generates an HTML snippet with the 5 most recent articles.
 */
export function generateRecentArticlesFragment(articles: ArticleData[]): string {
  const topArticles = articles.slice(0, 5);
  const items = topArticles.map(a => {
    const aUrl = `${CANONICAL_ORIGIN}/artigos/${a.slug}`;
    return `<li><a href="${escapeHtml(aUrl)}">${escapeHtml(a.title)}</a></li>`;
  }).join("");

  return `<section class="recent-articles-seo" aria-label="Artigos Recentes">
    <h2>Artigos Recentes</h2>
    <ul>${items}</ul>
  </section>`;
}
