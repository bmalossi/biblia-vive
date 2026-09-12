import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

function escapeXml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(str?: string | null): string {
  if (!str) return "";
  return String(str).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function toRfc822(dateStr?: string | null): string {
  if (!dateStr) return new Date().toUTCString();
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

function formatW3cDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
    return d.toISOString();
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export default async function handler(request: Request) {
  const origin = "https://www.bibliavive.com.br";
  const url = new URL(request.url);
  const path = url.pathname;
  const type = url.searchParams.get("type");

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  // 1. SITEMAP INDEX (/sitemap.xml ou ?type=index)
  if (type === "index" || path.endsWith("/sitemap.xml") || path === "/sitemap") {
    const now = new Date().toISOString();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${origin}/sitemap-artigos.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${origin}/sitemap-outros.xml</loc>
  </sitemap>
</sitemapindex>`.trim();

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  // 2. SITEMAP DE ARTIGOS (/sitemap-artigos.xml ou ?type=articles)
  if (type === "articles" || path.endsWith("/sitemap-artigos.xml")) {
    let urlsXml = "";

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: articles, error } = await supabase
          .from("articles")
          .select("slug, updated_at, published_at")
          .eq("status", "publicado")
          .order("published_at", { ascending: false });

        if (!error && articles) {
          urlsXml = articles
            .map((art) => {
              const loc = `${origin}/artigos/${escapeXml(art.slug)}`;
              const lastmod = formatW3cDate(art.updated_at || art.published_at);
              return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
            })
            .join("\n");
        }
      } catch (err) {
        console.error("[sitemap-articles] Erro ao consultar artigos:", err);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`.trim();

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=43200",
      },
    });
  }

  // 3. FEED RSS (/feed.xml, /feed ou ?type=feed)
  let itemsXml = "";

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: articles, error } = await supabase
        .from("articles")
        .select("*, author:article_authors(*)")
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .limit(50);

      if (!error && articles) {
        itemsXml = articles
          .map((art) => {
            const articleUrl = `${origin}/artigos/${art.slug}`;
            const pubDate = toRfc822(art.published_at || art.created_at);
            const authorName = art.author?.name || "Bíblia Vive";
            const description = art.meta_description || stripHtml(art.body).substring(0, 300);
            const enclosure = art.cover_image_url
              ? `<enclosure url="${escapeXml(art.cover_image_url)}" type="image/jpeg" length="0" />`
              : "";

            return `    <item>
      <title>${escapeXml(art.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(authorName)}</dc:creator>
      <category>${escapeXml(art.category || "Artigo Bíblico")}</category>
      ${enclosure}
    </item>`;
          })
          .join("\n");
      }
    } catch (err) {
      console.error("[feed] Erro ao consultar artigos para RSS:", err);
    }
  }

  const now = new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Bíblia Vive — Artigos e Estudos Bíblicos</title>
    <link>${origin}/artigos</link>
    <description>Reflexões bíblicas, teologia prática e estudos das Escrituras Sagradas.</description>
    <language>pt-BR</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`.trim();

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=43200",
    },
  });
}
