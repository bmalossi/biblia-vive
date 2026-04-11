import fs from "node:fs";
import path from "node:path";
import books from "../data/books.json" with { type: "json" };

const allBooks = [...books.old_testament, ...books.new_testament];
const VERSION_OPTIONS = ["acf", "arc", "nvi", "kjv"];

const baseUrl = process.env.SITEMAP_BASE_URL || "https://bibliavive.com.br";
const now = new Date().toISOString().split("T")[0];

const url = (loc: string, changefreq: string, priority: string) => `\n  <url>\n    <loc>${baseUrl}${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
xml += url("/", "daily", "1.0");
xml += url("/busca", "weekly", "0.6");
xml += url("/sobre", "monthly", "0.8");
xml += url("/planos", "weekly", "0.7");
xml += url("/pro", "monthly", "0.7");
xml += url("/compartilhar", "monthly", "0.5");

VERSION_OPTIONS.forEach((version) => {
  allBooks.forEach((book) => {
    for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
      xml += url(`/${version}/${book.slug}/${chapter}`, "monthly", "0.8");
    }
  });
});

xml += "\n</urlset>\n";

fs.writeFileSync(path.resolve("public/sitemap.xml"), xml, "utf8");
console.log("sitemap.xml gerado com sucesso");
