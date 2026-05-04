import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');
const BOOKS_DATA_PATH = path.resolve(PROJECT_ROOT, 'src/data/books.json');
const BIBLE_BASE_PATH = path.resolve(PROJECT_ROOT, 'public/bible/pt-br/acf');

const CANONICAL_ORIGIN = 'https://www.bibliavive.com.br';

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function getAvailableBooks() {
  const entries = await fs.readdir(BIBLE_BASE_PATH, { withFileTypes: true });
  const books = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const bookJsonPath = path.join(BIBLE_BASE_PATH, entry.name, `${entry.name}.json`);
      try {
        const bookData = await readJson(bookJsonPath);
        books.push({
          folder: entry.name,
          name: bookData.name,
          chapters: bookData.chapters.length
        });
      } catch (err) {
        // Skip if can't read
      }
    }
  }

  return books;
}

function generateMetaTags(bookName, bookSlug, chapterNum, verses) {
  const title = `${bookName} ${chapterNum} — ACF | Bíblia Vive`;
  const description = verses.slice(0, 3).join(' ');
  const url = `${CANONICAL_ORIGIN}/acf/${bookSlug}/${chapterNum}`;
  const text = verses.slice(0, 3).join(' ');

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    "name": title,
    "position": chapterNum,
    "isPartOf": {
      "@type": "Book",
      "name": `${bookName} — ACF`,
      "url": `${CANONICAL_ORIGIN}/acf/${bookSlug}`
    },
    "text": text
  };

  const metaTags = {
    'META_TITLE': `<title>${title}</title>`,
    'META_DESCRIPTION': `<meta name="description" content="${description.substring(0, 160)}" />`,
    'OG_URL': `<meta property="og:url" content="${url}" />`,
    'OG_TITLE': `<meta property="og:title" content="${title}" />`,
    'OG_DESCRIPTION': `<meta property="og:description" content="${description.substring(0, 160)}" />`,
    'OG_TYPE': `<meta property="og:type" content="article" />`,
    'OG_IMAGE': `<meta property="og:image" content="${CANONICAL_ORIGIN}/og/bible-chapter.png" />`,
    'TWITTER_CARD': `<meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description.substring(0, 160)}" />
  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og/bible-chapter.png" />`,
    'CANONICAL_URL': `<link rel="canonical" href="${url}" />`,
    'JSON_LD': `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
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

async function prerender() {
  console.log('[prerender] Starting...');

  const templatePath = path.join(DIST_DIR, 'index.html');
  let template;

  try {
    template = await fs.readFile(templatePath, 'utf-8');
  } catch (err) {
    console.error(`[prerender] Error: dist/index.html not found. Run 'vite build' first.`);
    process.exit(1);
  }

  const books = await getAvailableBooks();

  let totalChaptersGenerated = 0;

  for (const book of books) {
    const bookJsonPath = path.join(BIBLE_BASE_PATH, book.folder, `${book.folder}.json`);

    let bookData;
    try {
      bookData = await readJson(bookJsonPath);
    } catch (err) {
      console.warn(`[prerender] Warning: Could not read ${bookJsonPath}`);
      continue;
    }

    const chapters = bookData.chapters;

    for (let chapterNum = 1; chapterNum <= chapters.length; chapterNum++) {
      const verses = chapters[chapterNum - 1];

      const metaTags = generateMetaTags(bookData.name, book.folder, chapterNum, verses);
      const prerenderedHtml = replacePlaceholders(template, metaTags);

      const outputDir = path.join(DIST_DIR, 'acf', book.folder, String(chapterNum));
      await fs.mkdir(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, 'index.html');
      await fs.writeFile(outputPath, prerenderedHtml, 'utf-8');

      totalChaptersGenerated++;
    }
  }

  console.log(`[prerender] ✓ Generated ${totalChaptersGenerated} chapter HTML files`);

  const planosTitle = 'Planos de Leitura — Bible Vive | Leia a Biblia em 30, 90 ou 365 dias';
  const planosDescription = 'Escolha um plano de leitura biblica e le a Biblia em 30, 90 ou 365 dias. Planos diarios com historico de progresso e sincronizacao entre dispositivos.';
  const planosUrl = `${CANONICAL_ORIGIN}/planos`;

  const planosMetaTags = {
    'META_TITLE': `<title>${planosTitle}</title>`,
    'META_DESCRIPTION': `<meta name="description" content="${planosDescription}" />`,
    'OG_URL': `<meta property="og:url" content="${planosUrl}" />`,
    'OG_TITLE': `<meta property="og:title" content="${planosTitle}" />`,
    'OG_DESCRIPTION': `<meta property="og:description" content="${planosDescription}" />`,
    'OG_TYPE': `<meta property="og:type" content="website" />`,
    'OG_IMAGE': `<meta property="og:image" content="${CANONICAL_ORIGIN}/og/planos.png" />`,
    'TWITTER_CARD': `<meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${planosTitle}" />
  <meta name="twitter:description" content="${planosDescription}" />
  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og/planos.png" />`,
    'CANONICAL_URL': `<link rel="canonical" href="${planosUrl}" />`,
    'JSON_LD': `<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Planos de Leitura","description":"${planosDescription}","url":"${planosUrl}"}</script>`
  };

  const planosHtml = replacePlaceholders(template, planosMetaTags);
  const planosDir = path.join(DIST_DIR, 'planos');
  await fs.mkdir(planosDir, { recursive: true });
  const planosPath = path.join(planosDir, 'index.html');
  await fs.writeFile(planosPath, planosHtml, 'utf-8');
  console.log('[prerender] ✓ Generated planos/index.html');

  const staticUrls = [
    { loc: `${CANONICAL_ORIGIN}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${CANONICAL_ORIGIN}/planos`, priority: '0.8', changefreq: 'weekly' }
  ];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const book of books) {
    const bookJsonPath = path.join(BIBLE_BASE_PATH, book.folder, `${book.folder}.json`);
    let bookData;
    try {
      bookData = await readJson(bookJsonPath);
    } catch (err) {
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

  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
  await fs.writeFile(sitemapPath, sitemap, 'utf-8');
  console.log('[prerender] ✓ Generated sitemap.xml');

  console.log('[prerender] Done!');
}

prerender().catch(err => {
  console.error('[prerender] Error:', err);
  process.exit(1);
});