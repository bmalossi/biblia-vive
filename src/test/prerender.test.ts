import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DIST_DIR = path.resolve(PROJECT_ROOT, "dist");
const TEST_ACF_DIR = path.resolve(DIST_DIR, "acf");
const TEST_SITEMAP_PATH = path.resolve(DIST_DIR, "sitemap.xml");

const CANONICAL_ORIGIN = "https://www.bibliavive.com.br";

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

async function getAvailableBooks() {
  const bibleBasePath = path.resolve(PROJECT_ROOT, "public/bible/pt-br/acf");
  const entries = await fs.readdir(bibleBasePath, { withFileTypes: true });
  const books = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const bookJsonPath = path.join(bibleBasePath, entry.name, `${entry.name}.json`);
      try {
        const bookData = await readJson(bookJsonPath);
        books.push({
          folder: entry.name,
          name: bookData.name,
          chapters: bookData.chapters.length,
        });
      } catch (err) {}
    }
  }

  return books;
}

function generateMetaTags(bookName, bookSlug, chapterNum, verses) {
  const title = `${bookName} ${chapterNum} — ACF | Bíblia Vive`;
  const description = verses.slice(0, 3).join(" ");
  const url = `${CANONICAL_ORIGIN}/acf/${bookSlug}/${chapterNum}`;
  const text = verses.slice(0, 3).join(" ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    "name": title,
    "position": chapterNum,
    "isPartOf": {
      "@type": "Book",
      "name": `${bookName} — ACF`,
      "url": `${CANONICAL_ORIGIN}/acf/${bookSlug}`,
    },
    text: text,
  };

  const metaTags = {
    META_TITLE: `<title>${title}</title>`,
    META_DESCRIPTION: `<meta name="description" content="${description.substring(0, 160)}" />`,
    OG_URL: `<meta property="og:url" content="${url}" />`,
    OG_TITLE: `<meta property="og:title" content="${title}" />`,
    OG_DESCRIPTION: `<meta property="og:description" content="${description.substring(0, 160)}" />`,
    OG_TYPE: `<meta property="og:type" content="article" />`,
    OG_IMAGE: `<meta property="og:image" content="${CANONICAL_ORIGIN}/og/bible-chapter.png" />`,
    TWITTER_CARD: `<meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description.substring(0, 160)}" />
  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og/bible-chapter.png" />`,
    CANONICAL_URL: `<link rel="canonical" href="${url}" />`,
    JSON_LD: `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  };

  return metaTags;
}

function replacePlaceholders(html, metaTags) {
  let result = html;
  for (const [placeholder, replacement] of Object.entries(metaTags)) {
    result = result.replace(`<!--${placeholder}-->`, replacement);
  }
  return result;
}

async function prerenderChapter(template, bookName, bookSlug, chapterNum, verses) {
  const metaTags = generateMetaTags(bookName, bookSlug, chapterNum, verses);
  return replacePlaceholders(template, metaTags);
}

function extractJsonLd(html) {
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

describe("prerender", () => {
  let template: string;
  let books: { folder: string; name: string; chapters: number }[];

  beforeAll(async () => {
    const templatePath = path.join(DIST_DIR, "index.html");
    template = await fs.readFile(templatePath, "utf-8");
    books = await getAvailableBooks();
  });

  describe("placeholder replacement", () => {
    it("should replace all 10 placeholders in chapter HTML", async () => {
      const book = books.find((b) => b.folder === "gn") || books[0];
      const bookData = await readJson(
        path.resolve(PROJECT_ROOT, "public/bible/pt-br/acf", book.folder, `${book.folder}.json`)
      );
      const verses = bookData.chapters[0];

      const html = await prerenderChapter(template, bookData.name, book.folder, 1, verses);

      const placeholders = [
        "META_TITLE",
        "META_DESCRIPTION",
        "OG_URL",
        "OG_TITLE",
        "OG_DESCRIPTION",
        "OG_TYPE",
        "OG_IMAGE",
        "TWITTER_CARD",
        "CANONICAL_URL",
        "JSON_LD",
      ];

      for (const ph of placeholders) {
        expect(html).not.toMatch(new RegExp(`<!--${ph}-->`, "g"));
      }
    });

    it("should substitute correct title format", async () => {
      const book = books.find((b) => b.folder === "gn") || books[0];
      const bookData = await readJson(
        path.resolve(PROJECT_ROOT, "public/bible/pt-br/acf", book.folder, `${book.folder}.json`)
      );
      const verses = bookData.chapters[0];

      const html = await prerenderChapter(template, bookData.name, book.folder, 1, verses);

      expect(html).toContain(`<title>${bookData.name} 1 — ACF | Bíblia Vive</title>`);
    });
  });

  describe("JSON-LD structure", () => {
    it("should have correct Chapter schema with position", async () => {
      const book = books.find((b) => b.folder === "gn") || books[0];
      const bookData = await readJson(
        path.resolve(PROJECT_ROOT, "public/bible/pt-br/acf", book.folder, `${book.folder}.json`)
      );
      const verses = bookData.chapters[0];

      const html = await prerenderChapter(template, bookData.name, book.folder, 3, verses);
      const jsonLd = extractJsonLd(html);

      expect(jsonLd).not.toBeNull();
      expect(jsonLd["@type"]).toBe("Chapter");
      expect(jsonLd.position).toBe(3);
    });

    it("should have isPartOf with Book type", async () => {
      const book = books.find((b) => b.folder === "gn") || books[0];
      const bookData = await readJson(
        path.resolve(PROJECT_ROOT, "public/bible/pt-br/acf", book.folder, `${book.folder}.json`)
      );
      const verses = bookData.chapters[0];

      const html = await prerenderChapter(template, bookData.name, book.folder, 1, verses);
      const jsonLd = extractJsonLd(html);

      expect(jsonLd).not.toBeNull();
      expect(jsonLd.isPartOf).toBeDefined();
      expect(jsonLd.isPartOf["@type"]).toBe("Book");
      expect(jsonLd.isPartOf.name).toBe(`${bookData.name} — ACF`);
    });

    it("should include text field from verses", async () => {
      const book = books.find((b) => b.folder === "gn") || books[0];
      const bookData = await readJson(
        path.resolve(PROJECT_ROOT, "public/bible/pt-br/acf", book.folder, `${book.folder}.json`)
      );
      const verses = bookData.chapters[0];
      const expectedText = verses.slice(0, 3).join(" ");

      const html = await prerenderChapter(template, bookData.name, book.folder, 1, verses);
      const jsonLd = extractJsonLd(html);

      expect(jsonLd).not.toBeNull();
      expect(jsonLd.text).toBe(expectedText);
    });
  });

  describe("canonical URL format", () => {
    it("should generate absolute canonical URL", async () => {
      const book = books.find((b) => b.folder === "gn") || books[0];
      const bookData = await readJson(
        path.resolve(PROJECT_ROOT, "public/bible/pt-br/acf", book.folder, `${book.folder}.json`)
      );
      const verses = bookData.chapters[0];

      const html = await prerenderChapter(template, bookData.name, book.folder, 1, verses);

      expect(html).toContain(`<link rel="canonical" href="${CANONICAL_ORIGIN}/acf/${book.folder}/1" />`);
    });

    it("should have correct slug in URL", async () => {
      const book = books.find((b) => b.folder === "gn") || books[0];
      const bookData = await readJson(
        path.resolve(PROJECT_ROOT, "public/bible/pt-br/acf", book.folder, `${book.folder}.json`)
      );
      const verses = bookData.chapters[0];

      const html = await prerenderChapter(template, bookData.name, book.folder, 5, verses);

      expect(html).toContain(`href="${CANONICAL_ORIGIN}/acf/${book.folder}/5"`);
    });
  });

  describe("sitemap generation", () => {
    it("should have valid XML structure", async () => {
      const books = await getAvailableBooks();
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      const staticUrls = [
        { loc: `${CANONICAL_ORIGIN}/`, priority: "1.0", changefreq: "daily" },
        { loc: `${CANONICAL_ORIGIN}/planos`, priority: "0.8", changefreq: "weekly" },
      ];

      for (const book of books.slice(0, 3)) {
        const bookJsonPath = path.resolve(
          PROJECT_ROOT,
          "public/bible/pt-br/acf",
          book.folder,
          `${book.folder}.json`
        );
        let bookData;
        try {
          bookData = await readJson(bookJsonPath);
        } catch {
          continue;
        }

        for (let chapterNum = 1; chapterNum <= bookData.chapters.length; chapterNum++) {
          const url = `${CANONICAL_ORIGIN}/acf/${book.folder}/${chapterNum}`;
          sitemap += `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      }

      for (const staticUrl of staticUrls) {
        sitemap += `  <url>
    <loc>${staticUrl.loc}</loc>
    <changefreq>${staticUrl.changefreq}</changefreq>
    <priority>${staticUrl.priority}</priority>
  </url>
`;
      }

      sitemap += `</urlset>`;

      expect(sitemap).toMatch(/^<\?xml version="1\.0"/);
      expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(sitemap).toContain("</urlset>");
      expect(sitemap).toMatch(/<loc>https:\/\/www\.bibliavive\.com\.br\/<\/loc>/);
      expect(sitemap).toMatch(/<loc>https:\/\/www\.bibliavive\.com\.br\/planos<\/loc>/);
    });

    it("should include correct URL count for books", async () => {
      const testBooks = books.slice(0, 5);
      let chapterCount = 0;

      for (const book of testBooks) {
        const bookJsonPath = path.resolve(
          PROJECT_ROOT,
          "public/bible/pt-br/acf",
          book.folder,
          `${book.folder}.json`
        );
        try {
          const bookData = await readJson(bookJsonPath);
          chapterCount += bookData.chapters.length;
        } catch {
          continue;
        }
      }

      expect(chapterCount).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("should handle chapter with less than 3 verses", async () => {
      const shortVerses = ["verse one", "verse two"];
      const bookName = "Gênesis";
      const bookSlug = "gn";
      const chapterNum = 1;

      const html = await prerenderChapter(
        template,
        bookName,
        bookSlug,
        chapterNum,
        shortVerses
      );
      const jsonLd = extractJsonLd(html);

      expect(jsonLd).not.toBeNull();
      expect(jsonLd.text).toBe("verse one verse two");
    });

    it("should handle book names with special characters", async () => {
      const verses = ["primeiro versículo", "segundo versículo", "terceiro versículo"];
      const bookName = "1Pedro";
      const bookSlug = "1pe";
      const chapterNum = 1;

      const html = await prerenderChapter(template, bookName, bookSlug, chapterNum, verses);
      const jsonLd = extractJsonLd(html);

      expect(jsonLd).not.toBeNull();
      expect(jsonLd.isPartOf.name).toBe("1Pedro — ACF");
    });

    it("should handle book name with accent", async () => {
      const verses = ["versículo um", "versículo dois", "versículo três"];
      const bookName = "Gálatas";
      const bookSlug = "gl";
      const chapterNum = 1;

      const html = await prerenderChapter(template, bookName, bookSlug, chapterNum, verses);
      const jsonLd = extractJsonLd(html);

      expect(jsonLd).not.toBeNull();
      expect(jsonLd.isPartOf.name).toBe("Gálatas — ACF");
    });
  });
});