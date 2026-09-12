import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

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
