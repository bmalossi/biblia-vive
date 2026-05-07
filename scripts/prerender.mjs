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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchPublishedArticles() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[prerender] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Skipping article prerendering.');
    return [];
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/articles?status=eq.publicado&select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase query failed: ${response.status}`);
    }

    const articles = await response.json();
    return articles;
  } catch (err) {
    console.warn('[prerender] Warning: Could not fetch articles from Supabase. Continuing with chapter prerendering.');
    console.warn(err.message);
    return [];
  }
}

function generateArticleMetaTags(article) {
  const title = article.meta_title || `${article.title} — Bíblia Vive`;
  const description = article.meta_description || article.body?.substring(0, 160).replace(/[#*_`~\[\]]/g, '') || '';
  const url = `${CANONICAL_ORIGIN}/artigos/${article.slug}`;

  const metaTags = {
    'META_TITLE': `<title>${title}</title>`,
    'META_DESCRIPTION': `<meta name="description" content="${description.substring(0, 160)}" />`,
    'OG_URL': `<meta property="og:url" content="${url}" />`,
    'OG_TITLE': `<meta property="og:title" content="${title}" />`,
    'OG_DESCRIPTION': `<meta property="og:description" content="${description.substring(0, 160)}" />`,
    'OG_TYPE': `<meta property="og:type" content="article" />`,
    'OG_IMAGE': `<meta property="og:image" content="${article.cover_image_url || `${CANONICAL_ORIGIN}/og/article.png`}" />`,
    'TWITTER_CARD': `<meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description.substring(0, 160)}" />
  <meta name="twitter:image" content="${article.cover_image_url || `${CANONICAL_ORIGIN}/og/article.png`}" />`,
    'CANONICAL_URL': `<link rel="canonical" href="${url}" />`,
    'JSON_LD': `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${article.title}","description":"${description.substring(0, 160)}","url":"${url}"}</script>`
  };

  return metaTags;
}

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
    'JSON_LD': `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    'SEO_CONTENT': `<h1>${bookName} ${chapterNum}</h1>` + verses.map((v, i) => `<p><sup>${i + 1}</sup> ${v}</p>`).join('')
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

  // Prerender Artigos
  const articles = await fetchPublishedArticles();
  let totalArticlesGenerated = 0;

  for (const article of articles) {
    try {
      const metaTags = generateArticleMetaTags(article);
      const prerenderedHtml = replacePlaceholders(template, metaTags);

      const outputDir = path.join(DIST_DIR, 'artigos', article.slug);
      await fs.mkdir(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, 'index.html');
      await fs.writeFile(outputPath, prerenderedHtml, 'utf-8');

      totalArticlesGenerated++;
    } catch (err) {
      console.warn(`[prerender] Warning: Could not prerender article ${article.slug}: ${err.message}`);
    }
  }

  console.log(`[prerender] ✓ Generated ${totalArticlesGenerated} article HTML files`);

  // Prerender Artigos Index
  const artigosIndexTitle = 'Artigos — Bíblia Vive';
  const artigosIndexDescription = 'Explore artigos e conteúdos sobre a Palavra de Deus.';
  const artigosIndexUrl = `${CANONICAL_ORIGIN}/artigos`;

  const artigosIndexMetaTags = {
    'META_TITLE': `<title>${artigosIndexTitle}</title>`,
    'META_DESCRIPTION': `<meta name="description" content="${artigosIndexDescription}" />`,
    'OG_URL': `<meta property="og:url" content="${artigosIndexUrl}" />`,
    'OG_TITLE': `<meta property="og:title" content="${artigosIndexTitle}" />`,
    'OG_DESCRIPTION': `<meta property="og:description" content="${artigosIndexDescription}" />`,
    'OG_TYPE': `<meta property="og:type" content="website" />`,
    'OG_IMAGE': `<meta property="og:image" content="${CANONICAL_ORIGIN}/og/artigos.png" />`,
    'TWITTER_CARD': `<meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${artigosIndexTitle}" />
  <meta name="twitter:description" content="${artigosIndexDescription}" />
  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og/artigos.png" />`,
    'CANONICAL_URL': `<link rel="canonical" href="${artigosIndexUrl}" />`,
    'JSON_LD': `<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Artigos","description":"${artigosIndexDescription}","url":"${artigosIndexUrl}"}</script>`
  };

  const artigosIndexHtml = replacePlaceholders(template, artigosIndexMetaTags);
  const artigosIndexDir = path.join(DIST_DIR, 'artigos');
  await fs.mkdir(artigosIndexDir, { recursive: true });
  const artigosIndexPath = path.join(artigosIndexDir, 'index.html');
  await fs.writeFile(artigosIndexPath, artigosIndexHtml, 'utf-8');
  console.log('[prerender] ✓ Generated artigos/index.html');

  const staticUrls = [
    { loc: `${CANONICAL_ORIGIN}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${CANONICAL_ORIGIN}/planos`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${CANONICAL_ORIGIN}/artigos`, priority: '0.8', changefreq: 'weekly' }
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

  for (const article of articles) {
    const articleUrl = `${CANONICAL_ORIGIN}/artigos/${article.slug}`;
    sitemap += `  <url>
    <loc>${articleUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
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