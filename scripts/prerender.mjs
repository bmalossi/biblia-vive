/**
 * scripts/prerender.mjs
 * Bíblia Vive — Static HTML Pre-renderer
 *
 * Gera arquivos HTML estáticos indexáveis para:
 *   • Capítulos de todas as versões da Bíblia (ACF, ARC, NVI, KJV)
 *   • Artigos publicados (com corpo completo, via Supabase)
 *   • Páginas institucionais (Home, Planos, Artigos index)
 *   • Sitemap.xml unificado
 *
 * Requisitos: rodar APÓS `vite build` (precisa de dist/index.html).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { marked } from 'marked';

dotenv.config();

// ─── Marked config ────────────────────────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true });

// ─── Paths ────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR     = path.resolve(PROJECT_ROOT, 'dist');
const BIBLE_BASE   = path.resolve(PROJECT_ROOT, 'public/bible');

const CANONICAL_ORIGIN = 'https://www.bibliavive.com.br';

// ─── Env ──────────────────────────────────────────────────────────────────────
const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FB_APP_ID           = process.env.VITE_FB_APP_ID || '1035985160869680';

// ─── Bible versions config ────────────────────────────────────────────────────
const VERSION_METADATA = {
  acf: { label: 'ACF', lang: 'pt-BR' },
  arc: { label: 'ARC', lang: 'pt-BR' },
  nvi: { label: 'NVI', lang: 'pt-BR' },
  aa:  { label: 'AA',  lang: 'pt-BR' },
  kja: { label: 'KJA', lang: 'pt-BR' },
  kjv: { label: 'KJV', lang: 'en'    },
  bbe: { label: 'BBE', lang: 'en'    },
  rvr: { label: 'RVR', lang: 'es'    },
};

async function discoverVersions() {
  const versions = [];
  const langDirs = ['pt-br', 'en', 'es'];
  for (const lang of langDirs) {
    const langPath = path.join(BIBLE_BASE, lang);
    try {
      const entries = await fs.readdir(langPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const version = entry.name.toLowerCase();
          const meta = VERSION_METADATA[version] || { label: version.toUpperCase(), lang: lang === 'pt-br' ? 'pt-BR' : lang };
          versions.push({
            version,
            localPath: `${lang}/${version}`,
            label: meta.label,
            lang: meta.lang
          });
        }
      }
    } catch (err) {
      // Ignore if dir doesn't exist
    }
  }
  return versions;
}


// ─── localId → routeSlug map ──────────────────────────────────────────────────
// The public/bible folders use "localIds" (e.g. "ps", "ho", "mk"),
// but app routes use canonical slugs from books.json (e.g. "sl", "os", "mc").
// This map is shared by all versions (they use the same folder names).
const LOCAL_ID_TO_ROUTE_SLUG = {
  // Old Testament
  jud:    'jz',   // Juízes
  job:    'jo',   // Jó
  jo:     'joa',  // João  (NT — folder=jo, route=joa)
  act:    'atos', // Atos
  '1kgs': '1rs',
  '2kgs': '2rs',
  '1ch':  '1cr',
  '2ch':  '2cr',
  ps:     'sl',   // Salmos
  prv:    'pv',   // Provérbios
  so:     'ct',   // Cânticos
  ho:     'os',   // Oséias
  hk:     'hc',   // Habacuque
  zp:     'sf',   // Sofonias
  hg:     'ag',   // Ageu
  mi:     'mq',   // Miquéias
  mk:     'mc',   // Marcos
  lk:     'lc',   // Lucas
  eph:    'ef',   // Efésios
  ph:     'fp',   // Filipenses
  jm:     'tg',   // Tiago
  re:     'ap',   // Apocalipse
  ezr:    'ed',   // Esdras
  phm:    'fm',   // Filemom
};

function toRouteSlug(localId) {
  return LOCAL_ID_TO_ROUTE_SLUG[localId] ?? localId;
}

// ─── localId (folder name) → book-contexts.json OSIS key ─────────────────────
// book-contexts.json uses uppercase OSIS IDs (GEN, EXO, PSA…).
// The public/bible folder names use Portuguese abbreviations (gn, ex, ps…).
const FOLDER_TO_CONTEXT_KEY = {
  // Pentateuco
  gn:    'GEN',
  ex:    'EXO',
  lv:    'LEV',
  nm:    'NUM',
  dt:    'DEU',
  // Históricos
  js:    'JOS',
  jud:   'JDG',
  rt:    'RUT',
  '1sm': '1SA',
  '2sm': '2SA',
  '1kgs':'1KI',
  '2kgs':'2KI',
  '1ch': '1CH',
  '2ch': '2CH',
  ezr:   'EZR',
  ne:    'NEH',
  et:    'EST',
  // Poéticos
  job:   'JOB',
  ps:    'PSA',
  prv:   'PRO',
  ec:    'ECC',
  so:    'SNG',
  // Profetas maiores
  is:    'ISA',
  jr:    'JER',
  lm:    'LAM',
  ez:    'EZK',
  dn:    'DAN',
  // Profetas menores
  ho:    'HOS',
  jl:    'JOL',
  am:    'AMO',
  ob:    'OBA',
  jn:    'JON',
  mi:    'MIC',
  na:    'NAM',
  hk:    'HAB',
  zp:    'ZEP',
  hg:    'HAG',
  zc:    'ZEC',
  ml:    'MAL',
  // Evangelhos e Atos
  mt:    'MAT',
  mk:    'MRK',
  lk:    'LUK',
  jo:    'JHN',
  act:   'ACT',
  // Epístolas de Paulo
  rm:    'ROM',
  '1co': '1CO',
  '2co': '2CO',
  gl:    'GAL',
  eph:   'EPH',
  ph:    'PHP',
  cl:    'COL',
  '1ts': '1TH',
  '2ts': '2TH',
  '1tm': '1TI',
  '2tm': '2TI',
  tt:    'TIT',
  phm:   'PHM',
  // Epístolas gerais
  hb:    'HEB',
  jm:    'JAS',
  '1pe': '1PE',
  '2pe': '2PE',
  '1jo': '1JN',
  '2jo': '2JN',
  '3jo': '3JN',
  jd:    'JUD',
  re:    'REV',
};

function toContextKey(folder) {
  return FOLDER_TO_CONTEXT_KEY[folder] ?? folder.toUpperCase();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Returns all book subdirectory entries for a given version base path.
 */
async function getAvailableBooks(versionBasePath) {
  const fullPath = path.join(BIBLE_BASE, versionBasePath);
  let entries;
  try {
    entries = await fs.readdir(fullPath, { withFileTypes: true });
  } catch {
    console.warn(`[prerender] ⚠ Version path not found: ${fullPath}`);
    return [];
  }

  const books = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const bookJsonPath = path.join(fullPath, entry.name, `${entry.name}.json`);
    try {
      const bookData = await readJson(bookJsonPath);
      books.push({ folder: entry.name, name: bookData.name, chapters: bookData.chapters });
    } catch {
      // skip unreadable books
    }
  }
  return books;
}

/**
 * Replaces <!--PLACEHOLDER--> comments in the HTML template.
 */
function replacePlaceholders(html, metaTags) {
  let result = html;
  for (const [key, value] of Object.entries(metaTags)) {
    result = result.replaceAll(`<!--${key}-->`, value ?? '');
  }
  return result;
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
async function fetchPublishedArticles() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[prerender] ⚠ Supabase env vars missing — skipping article prerendering.');
    return [];
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?status=eq.publicado&select=*,author:article_authors(*)`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      },
    );
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[prerender] ⚠ Could not fetch articles:', err.message);
    return [];
  }
}

async function fetchPublishedAuthors() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/article_authors?select=*`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      },
    );
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[prerender] ⚠ Could not fetch authors:', err.message);
    return [];
  }
}

// ─── Meta tag generators ──────────────────────────────────────────────────────

/**
 * Generates all <head> meta tags + SEO_CONTENT for a Bible *book* index page.
 * The SEO_CONTENT block is fully semantic HTML so crawlers and LLMs can read it
 * without executing JavaScript.
 */
function generateBookMetaTags(bookName, folder, routeSlug, version, versionLabel, bookCtx) {
  const url   = `${CANONICAL_ORIGIN}/${version}/${routeSlug}`;
  const theme = bookCtx?.theme ?? '';
  const desc  = theme
    ? `${bookName}: ${theme.substring(0, 140)}`
    : `Leia o livro de ${bookName} completo na versão ${versionLabel}. Bíblia Vive.`;

  // ── Helper: escape HTML entities ──
  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ── Context section (only when bookCtx is available) ──
  let contextSection = '';
  if (bookCtx) {
    // Tema Central
    const themeBlock = bookCtx.theme
      ? `<div><h3>Tema Central</h3><p>${esc(bookCtx.theme)}</p></div>`
      : '';

    // Contexto Histórico (summary)
    const summaryBlock = bookCtx.summary
      ? `<div><h3>Contexto Histórico</h3><p>${esc(bookCtx.summary)}</p></div>`
      : '';

    // Metadados em dl
    const metaRows = [
      bookCtx.author         && `<div><dt>Autor</dt><dd>${esc(bookCtx.author)}</dd></div>`,
      bookCtx.period_written && `<div><dt>Período</dt><dd>${esc(bookCtx.period_written)}</dd></div>`,
      bookCtx.period_events  && `<div><dt>Eventos</dt><dd>${esc(bookCtx.period_events)}</dd></div>`,
      bookCtx.genre          && `<div><dt>Gênero</dt><dd>${esc(bookCtx.genre)}</dd></div>`,
      bookCtx.audience       && `<div><dt>Público</dt><dd>${esc(bookCtx.audience)}</dd></div>`,
    ].filter(Boolean).join('');
    const metaBlock = metaRows
      ? `<dl>${metaRows}</dl>`
      : '';

    // Temas-chave
    const keyThemesBlock = bookCtx.key_themes?.length
      ? `<section><h3>Temas-chave</h3><ul>${bookCtx.key_themes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>`
      : '';

    // Pessoas-chave
    const keyPeopleBlock = bookCtx.key_people?.length
      ? `<section><h3>Pessoas-chave</h3><ul>${bookCtx.key_people.map(p => `<li>${esc(p)}</li>`).join('')}</ul></section>`
      : '';

    // Lugares-chave
    const keyPlacesBlock = bookCtx.key_places?.length
      ? `<section><h3>Lugares-chave</h3><ul>${bookCtx.key_places.map(p => `<li>${esc(p)}</li>`).join('')}</ul></section>`
      : '';

    contextSection =
      `<section aria-label="Contexto de ${esc(bookName)}">` +
      `<h2>Sobre ${esc(bookName)}</h2>` +
      themeBlock +
      summaryBlock +
      metaBlock +
      keyThemesBlock +
      keyPeopleBlock +
      keyPlacesBlock +
      `</section>`;
  }

  // ── Chapter navigation links ──
  const totalChapters = bookCtx?.chapters ?? 0;
  const chapLinks = totalChapters > 0
    ? Array.from({ length: totalChapters }, (_, i) =>
        `<li><a href="/${version}/${routeSlug}/${i + 1}">Capítulo ${i + 1}</a></li>`
      ).join('')
    : '';
  const chapNav = chapLinks
    ? `<nav aria-label="Capítulos de ${esc(bookName)}"><ol>${chapLinks}</ol></nav>`
    : '';

  const seoContent =
    `<main style="font-family:serif;max-width:780px;margin:0 auto;padding:1rem">` +
    `<h1>${esc(bookName)} — ${esc(versionLabel)} — Bíblia Vive</h1>` +
    contextSection +
    chapNav +
    `</main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: `${bookName} — ${versionLabel}`,
    description: desc,
    url,
    inLanguage: version === 'kjv' ? 'en' : 'pt-BR',
    ...(bookCtx?.author         ? { author: { '@type': 'Person', name: bookCtx.author } } : {}),
    ...(totalChapters > 0       ? { numberOfPages: totalChapters } : {}),
    isPartOf: { '@type': 'WebSite', name: 'Bíblia Vive', url: CANONICAL_ORIGIN },
  };

  return {
    META_TITLE:       `<title>${esc(bookName)} — ${esc(versionLabel)} — Bíblia Vive</title>`,
    META_DESCRIPTION: `<meta name="description" content="${esc(desc)}" />`,
    OG_URL:           `<meta property="og:url" content="${url}" />`,
    OG_TITLE:         `<meta property="og:title" content="${esc(bookName)} — ${esc(versionLabel)} — Bíblia Vive" />`,
    OG_DESCRIPTION:   `<meta property="og:description" content="${esc(desc)}" />`,
    OG_TYPE:          `<meta property="og:type" content="book" />`,
    OG_IMAGE:         `<meta property="og:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    FB_APP_ID:        `<meta property="fb:app_id" content="${FB_APP_ID}" />`,
    TWITTER_CARD:     `<meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(bookName)} — ${esc(versionLabel)} — Bíblia Vive" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    CANONICAL_URL:    `<link rel="canonical" href="${url}" />`,
    JSON_LD:          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    SEO_CONTENT:      seoContent,
  };
}

/**
 * Generates all <head> meta tags + SEO_CONTENT for a Bible chapter.
 */
/**
 * Generates all <head> meta tags + SEO_CONTENT for a Bible chapter.
 */
function generateChapterMetaTags(bookName, localId, chapterNum, verses, version, versionLabel, bookCtx = null) {
  const routeSlug  = toRouteSlug(localId);
  const url        = `${CANONICAL_ORIGIN}/${version}/${routeSlug}/${chapterNum}`;
  const title      = `${bookName} ${chapterNum} — ${versionLabel} — Bíblia Vive`;
  const descText   = verses.slice(0, 3).join(' ').substring(0, 160);

  const faqAnswerText = bookCtx?.summary
    ? `${bookName} capítulo ${chapterNum} aborda o contexto de ${bookCtx.theme || bookName}. ${bookCtx.summary}`
    : `O capítulo ${chapterNum} de ${bookName} (${versionLabel}) apresenta passagens fundamentais para estudo teológico e reflexão espiritual na plataforma Bíblia Vive.`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: CANONICAL_ORIGIN },
        { '@type': 'ListItem', position: 2, name: bookName, item: `${CANONICAL_ORIGIN}/${version}/${routeSlug}` },
        { '@type': 'ListItem', position: 3, name: `Capítulo ${chapterNum}`, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Chapter',
      name: title,
      position: chapterNum,
      isPartOf: {
        '@type': 'Book',
        name: `${bookName} — ${versionLabel}`,
        url: `${CANONICAL_ORIGIN}/${version}/${routeSlug}`,
      },
      text: verses.map((v, i) => `${i + 1} ${v}`).join(' '),
      inLanguage: version === 'kjv' ? 'en' : 'pt-BR',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Qual o contexto e significado de ${bookName} capítulo ${chapterNum}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faqAnswerText,
          },
        },
      ],
    },
  ];

  // Build the visible SEO block: h1 + context + all verses as <p>
  const contextBlock = bookCtx?.theme
    ? `<section><h2>Contexto do Livro (${bookName})</h2><p>${bookCtx.theme}</p></section>`
    : '';

  const seoContent =
    `<article style="font-family:serif;max-width:780px;margin:0 auto;padding:1rem">` +
    `<h1>${bookName} — Capítulo ${chapterNum} (${versionLabel})</h1>` +
    contextBlock +
    `<section><h2>Texto Bíblico</h2>` +
    verses.map((v, i) => `<p><sup>${i + 1}</sup> ${v}</p>`).join('') +
    `</section></article>`;

  return {
    META_TITLE:       `<title>${title}</title>`,
    META_DESCRIPTION: `<meta name="description" content="${descText}" />`,
    OG_URL:           `<meta property="og:url" content="${url}" />`,
    OG_TITLE:         `<meta property="og:title" content="${title}" />`,
    OG_DESCRIPTION:   `<meta property="og:description" content="${descText}" />`,
    OG_TYPE:          `<meta property="og:type" content="website" />`,
    OG_IMAGE:         `<meta property="og:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    FB_APP_ID:        `<meta property="fb:app_id" content="${FB_APP_ID}" />`,
    TWITTER_CARD:     `<meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${title}" />\n  <meta name="twitter:description" content="${descText}" />\n  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    CANONICAL_URL:    `<link rel="canonical" href="${url}" />`,
    JSON_LD:          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    SEO_CONTENT:      seoContent,
  };
}

/**
 * Generates all <head> meta tags + SEO_CONTENT for a published article.
 * Uses `marked` to render the full markdown body into HTML.
 */
function generateArticleMetaTags(article) {
  const title       = article.meta_title || `${article.title} — Bíblia Vive`;
  const rawDesc     = article.meta_description
    || stripHtml(String(article.body || '')).substring(0, 160);
  const description = rawDesc.substring(0, 160);
  const url         = `${CANONICAL_ORIGIN}/artigos/${article.slug}`;
  const coverImage  = article.cover_image_url || `${CANONICAL_ORIGIN}/og-default.png`;

  // Render the full article body from Markdown → HTML
  let bodyHtml = '';
  if (article.body) {
    try {
      bodyHtml = marked.parse(String(article.body));
    } catch {
      bodyHtml = `<p>${String(article.body).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    }
  }

  // Build publication date block
  const pubDateBlock = article.published_at
    ? `<time datetime="${article.published_at}" style="color:#666;font-size:0.875rem;display:block;margin-bottom:1rem">${new Date(article.published_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>`
    : '';

  // Cover image block
  const coverBlock = article.cover_image_url
    ? `<img src="${article.cover_image_url}" alt="${article.title}" style="width:100%;max-width:780px;height:auto;border-radius:8px;margin-bottom:1.5rem" />`
    : '';

  // Subtitle block
  const subtitleBlock = article.subtitle
    ? `<p style="font-size:1.125rem;color:#555;margin-bottom:1rem"><em>${article.subtitle}</em></p>`
    : '';

  const seoContent =
    `<article style="font-family:serif;max-width:780px;margin:0 auto;padding:1rem">` +
    `<h1>${article.title}</h1>` +
    subtitleBlock +
    pubDateBlock +
    coverBlock +
    bodyHtml +
    `</article>`;

  const authorPerson = article.author
    ? {
        '@type': 'Person',
        name: article.author.name,
        url: `${CANONICAL_ORIGIN}/autor/${article.author.slug}`,
        ...(article.author.role ? { jobTitle: article.author.role } : {}),
        ...(article.author.church ? { worksFor: { '@type': 'Organization', name: article.author.church } } : {}),
        ...(article.author.avatar_url ? { image: article.author.avatar_url } : {}),
      }
    : { '@type': 'Organization', name: 'Bíblia Vive', url: CANONICAL_ORIGIN };

  const ytId = article.youtube_id || article.youtubeId || (article.video_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)?.[1]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description,
    url,
    image: coverImage,
    author: authorPerson,
    ...(article.published_at ? { datePublished: article.published_at } : {}),
    ...(article.updated_at   ? { dateModified:  article.updated_at   } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Bíblia Vive',
      url: CANONICAL_ORIGIN,
      logo: { '@type': 'ImageObject', url: `${CANONICAL_ORIGIN}/og/home.png` },
      sameAs: [
        'https://www.instagram.com/biblia.vive/',
        'https://www.facebook.com/bibliavive/'
      ]
    },
    inLanguage: 'pt-BR',
    ...(ytId ? {
      video: {
        '@type': 'VideoObject',
        name: article.video_title || article.title,
        description: article.video_description || description,
        thumbnailUrl: article.cover_image_url || `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
        contentUrl: `https://www.youtube.com/watch?v=${ytId}`,
        embedUrl: `https://www.youtube.com/embed/${ytId}`,
        uploadDate: article.published_at || article.created_at
      }
    } : {})
  };

  return {
    META_TITLE:       `<title>${title}</title>`,
    META_DESCRIPTION: `<meta name="description" content="${description}" />`,
    OG_URL:           `<meta property="og:url" content="${url}" />`,
    OG_TITLE:         `<meta property="og:title" content="${title}" />`,
    OG_DESCRIPTION:   `<meta property="og:description" content="${description}" />`,
    OG_TYPE:          `<meta property="og:type" content="article" />`,
    OG_IMAGE:         `<meta property="og:image" content="${coverImage}" />`,
    FB_APP_ID:        `<meta property="fb:app_id" content="${FB_APP_ID}" />`,
    TWITTER_CARD:     `<meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${title}" />\n  <meta name="twitter:description" content="${description}" />\n  <meta name="twitter:image" content="${coverImage}" />`,
    CANONICAL_URL:    `<link rel="canonical" href="${url}" />`,
    JSON_LD:          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    SEO_CONTENT:      seoContent,
  };
}

// ─── Static pages ─────────────────────────────────────────────────────────────

function homeMetaTags() {
  const title = 'Bíblia Vive — Leia, Estude e Compartilhe a Bíblia';
  const desc  = 'Leia, estude e compartilhe a Bíblia com comentários, planos de leitura e versículo do dia.';
  const url   = `${CANONICAL_ORIGIN}/`;
  const seoContent =
    `<main style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:1rem">` +
    `<h1>Bíblia Vive — Leia e Estude a Bíblia Online</h1>` +
    `<p>${desc}</p>` +
    `<nav aria-label="Navegação principal"><ul>` +
    `<li><a href="/acf/gn/1">Bíblia ACF — Almeida Corrigida Fiel</a></li>` +
    `<li><a href="/arc/gn/1">Bíblia ARC — Almeida Revista e Corrigida</a></li>` +
    `<li><a href="/nvi/gn/1">Bíblia NVI — Nova Versão Internacional</a></li>` +
    `<li><a href="/kjv/gn/1">Bible KJV — King James Version</a></li>` +
    `<li><a href="/artigos">Artigos Bíblicos</a></li>` +
    `<li><a href="/planos">Planos de Leitura</a></li>` +
    `</ul></nav>` +
    `</main>`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Bíblia Vive',
      url,
      description: desc,
      inLanguage: 'pt-BR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${CANONICAL_ORIGIN}/busca?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Bíblia Vive',
      url: CANONICAL_ORIGIN,
      logo: `${CANONICAL_ORIGIN}/og/home.png`,
      sameAs: [
        'https://www.instagram.com/biblia.vive/',
        'https://www.facebook.com/bibliavive/'
      ]
    }
  ];

  return {
    META_TITLE:       `<title>${title}</title>`,
    META_DESCRIPTION: `<meta name="description" content="${desc}" />`,
    OG_URL:           `<meta property="og:url" content="${url}" />`,
    OG_TITLE:         `<meta property="og:title" content="${title}" />`,
    OG_DESCRIPTION:   `<meta property="og:description" content="${desc}" />`,
    OG_TYPE:          `<meta property="og:type" content="website" />`,
    OG_IMAGE:         `<meta property="og:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    FB_APP_ID:        `<meta property="fb:app_id" content="${FB_APP_ID}" />`,
    TWITTER_CARD:     `<meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${title}" />\n  <meta name="twitter:description" content="${desc}" />\n  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    CANONICAL_URL:    `<link rel="canonical" href="${url}" />`,
    JSON_LD:          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    SEO_CONTENT:      seoContent,
  };
}

function planosMetaTags() {
  const title = 'Planos de Leitura | Bíblia Vive';
  const desc  = 'Escolha um plano de leitura bíblica e leia a Bíblia em 30, 90 ou 365 dias. Planos diários com histórico de progresso.';
  const url   = `${CANONICAL_ORIGIN}/planos`;
  const seoContent =
    `<main style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:1rem">` +
    `<h1>Planos de Leitura Bíblica</h1>` +
    `<p>${desc}</p>` +
    `<ul>` +
    `<li>Plano de 30 dias — Quatro Evangelhos</li>` +
    `<li>Plano de 90 dias — Novo Testamento</li>` +
    `<li>Plano de 365 dias — Bíblia inteira</li>` +
    `</ul>` +
    `<a href="/">Voltar para a página inicial</a>` +
    `</main>`;
  return buildStaticMeta({ title, desc, url, type: 'WebPage', seoContent });
}

function artigosIndexMetaTags(articles) {
  const title = 'Artigos Bíblicos | Bíblia Vive';
  const desc  = 'Explore artigos e conteúdo sobre a Palavra de Deus.';
  const url   = `${CANONICAL_ORIGIN}/artigos`;
  const articleLinks = articles.slice(0, 30).map(a =>
    `<li><a href="/artigos/${a.slug}">${a.title}</a></li>`
  ).join('');
  const seoContent =
    `<main style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:1rem">` +
    `<h1>Artigos Bíblicos</h1>` +
    `<p>${desc}</p>` +
    (articleLinks ? `<ul>${articleLinks}</ul>` : '') +
    `</main>`;
  return buildStaticMeta({ title, desc, url, type: 'WebPage', seoContent });
}

/**
 * Generates all <head> meta tags + SEO_CONTENT for /como-usar.
 * Exposes the full tutorial content (Estudar, Memorial, Destaques,
 * Compartilhar, Planos) as semantic static HTML so crawlers and AI agents
 * that don't execute JavaScript can read it.
 *
 * The block is visually hidden from hydrated users by an inline CSS class
 * `bv-seo-noscript` that uses the standard "visually hidden" trick
 * (clip + 1px size + overflow:hidden + absolute). React mounts on top of
 * #root and replaces this content during hydration, so no visual duplication
 * occurs for users with JavaScript enabled.
 */
function comoUsarMetaTags() {
  const title = 'Como usar o Bíblia Vive — Guia de Estudo | Bíblia Vive';
  const desc  = 'Aprenda a usar as ferramentas do Bíblia Vive: comentários teológicos históricos, Memorial da caminhada com a Palavra, destaques coloridos, compartilhamento e planos de leitura.';
  const url   = `${CANONICAL_ORIGIN}/como-usar`;


  const seoContent =
`<main class="bv-seo-only" style="font-family:Georgia,'Times New Roman',serif;max-width:780px;margin:0 auto;padding:1rem;line-height:1.65;color:#1a1a1a">
  <h1>Como usar o Bíblia Vive — Guia de Estudo</h1>
  <p>O Bíblia Vive é uma aplicação web progressiva para leitura e estudo da Bíblia em português. Esta página descreve, em texto, todas as ferramentas disponíveis na plataforma: análise de versículos com comentários teológicos históricos, Memorial da caminhada com a Palavra, destaques coloridos, compartilhamento de cards para redes sociais e planos de leitura diários.</p>

  <h2>Estudar com Comentários Teológicos</h2>
  <p>O recurso de Comentários do Bíblia Vive conecta você ao pensamento de teólogos históricos como <strong>Matthew Henry</strong>, <strong>Albert Barnes</strong> e <strong>John Gill</strong> sobre qualquer versículo da Bíblia. O sistema utiliza IA com RAG (Recuperação Aumentada por Geração) para localizar os trechos mais relevantes de cada comentarista, traduzir e adaptar os fragmentos e organizá-los por teólogo. O processo leva de 60 a 90 segundos.</p>
  <p>Para usar, siga estes passos:</p>
  <ol>
    <li>Abra um capítulo da Bíblia (por exemplo, João 3).</li>
    <li>Clique no versículo que deseja estudar (por exemplo, João 3:16).</li>
    <li>Na barra de ações que aparece, clique no botão "Estudar" — o Painel de Estudo abre na tela.</li>
    <li>No Painel de Estudo, selecione a aba "Comentários" — o painel tem quatro abas: Contexto, Referências, Idioma Original e Comentários.</li>
    <li>Clique em "Buscar Comentários" para acionar a busca nos comentários históricos.</li>
    <li>Leia os comentários exibidos por teólogo, reflita e, se desejar, crie uma Nota no versículo com os seus insights.</li>
  </ol>
  <p>O Painel de Estudo também disponibiliza, nas demais abas, informações de contexto histórico e literário do livro (aba <strong>Contexto</strong>), referências cruzadas em outras passagens (aba <strong>Referências</strong>) e análise do idioma original com Strong, transliteração e dados morfológicos (aba <strong>Idioma Original</strong>).</p>

  <h2>Memorial — Sua Caminhada com a Palavra</h2>
  <p>O <em>Memorial</em> é um diário espiritual integrado à leitura que preserva os momentos mais significativos da sua jornada com a Palavra. Ao ler um capítulo, você pode abrir o Caderno e registrar quatro tipos de memória vinculados àquele trecho: <strong>Reflexão</strong>, <strong>Oração</strong>, <strong>Testemunho</strong> e <strong>Jejum / Propósito</strong>. Também é possível criar cadernos livres para estudos mais abrangentes sobre um capítulo inteiro.</p>
  <p>Como usar o Memorial:</p>
  <ol>
    <li>Abra a Bíblia e leia normalmente. Quando algo tocar seu coração, clique no botão flutuante do Caderno no canto inferior esquerdo da tela.</li>
    <li>No painel que abre, escolha o tipo de registro: Reflexão, Oração, Testemunho ou Jejum / Propósito — ou crie um "Novo caderno livre" para um estudo mais extenso.</li>
    <li>Escreva sua reflexão, oração ou testemunho. O registro ficará vinculado ao capítulo onde aquele momento aconteceu.</li>
    <li>Acesse "Todos os Cadernos" para rever toda a sua caminhada em uma linha do tempo. Use a busca em tempo real para filtrar por título, conteúdo ou livro.</li>
    <li>Abra o Memorial pelo menu da conta a qualquer momento para reencontrar sua história com a Palavra organizada cronologicamente.</li>
  </ol>
  <p>Cada novo capítulo pode se tornar uma nova lembrança. A Palavra permanece — o Memorial ajuda você a preservá-la.</p>

  <h2>Destaques — Cores e Marcações</h2>
  <p>Os <strong>Destaques</strong> transformam sua Bíblia em um mapa visual do estudo. Ao colorir versículos, você cria camadas de significado que facilitam a revisão e o aprendizado. São 5 cores disponíveis, cada uma podendo representar uma categoria na sua metodologia pessoal.</p>
  <p>Cores disponíveis e sugestão de uso:</p>
  <ul>
    <li><strong>Amarelo</strong> — Promessas de Deus</li>
    <li><strong>Azul</strong> — Versículos de paz e conforto</li>
    <li><strong>Verde</strong> — Mandamentos e instruções</li>
    <li><strong>Rosa</strong> — Amor e graça</li>
    <li><strong>Roxo</strong> — Profecias e mistérios</li>
  </ul>
  <p>Como destacar um versículo:</p>
  <ol>
    <li>Clique no versículo que deseja destacar. Você pode combinar Destaque e Memorial no mesmo versículo — são recursos independentes.</li>
    <li>Na barra de ações, clique no botão "Destaque". Aparecerá um seletor com as 5 cores.</li>
    <li>Clique na cor desejada e o versículo é destacado instantaneamente com um fundo translúcido que funciona tanto no modo claro quanto no escuro.</li>
    <li>Para remover um destaque, clique novamente em "Destaque" e selecione a mesma cor ativa.</li>
    <li>Crie seu próprio sistema de cores pessoal. O importante é ser consistente para que, ao revisitar um capítulo, as cores já contem a história do seu estudo anterior.</li>
  </ol>

  <h2>Compartilhar — Cards de Versículos</h2>
  <p>O Bíblia Vive gera <strong>cards visuais profissionais</strong> de qualquer versículo para você compartilhar nas redes sociais, grupos de WhatsApp, Telegram ou e-mail. São 5 templates exclusivos com formatos otimizados para cada plataforma:</p>
  <ul>
    <li><strong>Pergaminho</strong> — visual clássico e solene</li>
    <li><strong>Minimalista</strong> — design limpo e direto</li>
    <li><strong>Story</strong> — formato vertical 9:16, otimizado para Instagram Stories e TikTok</li>
    <li><strong>Banner</strong> — formato horizontal para posts</li>
    <li><strong>Editorial</strong> — estilo de revista, para textos maiores</li>
  </ul>
  <p>Como compartilhar um versículo:</p>
  <ol>
    <li>Clique no versículo que deseja compartilhar. Versículos curtos e impactantes como Filipenses 4:13, João 3:16 ou Salmos 23:1 funcionam muito bem.</li>
    <li>Na barra de ações, clique em "Compartilhar". O gerador de cards abre com uma pré-visualização em tempo real.</li>
    <li>Escolha um dos 5 templates e veja instantaneamente como o versículo ficará.</li>
    <li>Clique em "Compartilhar Imagem" e escolha a plataforma (WhatsApp, Facebook, Twitter/X, Telegram, Instagram). O sistema copia a imagem para a área de transferência e abre a plataforma escolhida. No Instagram e TikTok, a imagem é baixada para você postar manualmente.</li>
    <li>Alternativamente, use "Copiar Texto" para copiar o versículo no formato "Livro Capítulo:Versículo (Versão) | Bíblia Vive", ideal para mensagens e e-mails sem imagem.</li>
  </ol>

  <h2>Planos de Leitura Bíblica</h2>
  <p>Os <strong>Planos de Leitura</strong> auxiliam você a manter a constância diária de leitura, dividindo as Escrituras em metas realistas e estruturadas. Escolha um plano, acompanhe seu progresso com o contador de ofensiva (streak) e crie intimidade diária com a Palavra.</p>
  <p>Planos disponíveis:</p>
  <ul>
    <li><strong>Quatro Evangelhos em 30 dias</strong> — Mateus, Marcos, Lucas e João, para conhecer a fundo a vida e os ensinamentos de Jesus.</li>
    <li><strong>Novo Testamento em 90 dias</strong> — leitura trimestral do NT.</li>
    <li><strong>Bíblia inteira em 1 ano (365 dias)</strong> — leitura anual completa.</li>
  </ul>
  <p>Como usar um plano de leitura:</p>
  <ol>
    <li>Navegue até a aba de Planos e selecione o plano ideal para você.</li>
    <li>Acompanhe suas estatísticas de leitura no dashboard: percentual concluído do plano e ofensiva (dias seguidos com leitura registrada).</li>
    <li>Abra a leitura do dia — a seção "Leitura de Hoje" lista os capítulos reservados para o dia atual. Clique em qualquer um para ir à tela de leitura.</li>
    <li>Marque o capítulo como lido (diretamente na tela de leitura ou pelo botão "Marcar como lido" no painel). O capítulo ficará riscado e o progresso do dia subirá.</li>
    <li>Após concluir todas as leituras programadas do dia, use o botão "Avançar para o próximo dia" para atualizar o calendário do seu plano.</li>
  </ol>
  <p>Dica: escolha um horário fixo no seu dia (logo de manhã ou antes de dormir) para realizar a leitura programada. A constância de poucos minutos todos os dias é muito mais transformadora do que ler muitas horas de uma só vez.</p>

  <p>O <strong>Painel de Estudo</strong> é a central de análise teológica de qualquer versículo, aberto pelo botão “Estudar” na barra de ações de um versículo selecionado. Ele contém quatro abas:</p>
  <ul>
    <li><strong>Contexto</strong> — informações de contexto histórico e literário do livro bíblico: autor, período, público, gênero, temas-chave, pessoas-chave e lugares-chave.</li>
    <li><strong>Referências</strong> — referências cruzadas em outras passagens das Escrituras que dialogam com o versículo selecionado.</li>
    <li><strong>Idioma Original</strong> — análise das línguas originais (hebraico e grego) com Strong, transliteração e dados morfológicos.</li>
    <li><strong>Comentários</strong> — comentários teológicos históricos de Matthew Henry, Albert Barnes e John Gill, recuperados via IA com RAG.</li>
  </ul>
  <p>Para acessar o Painel de Estudo, abra um capítulo, clique em um versículo e depois no botão “Estudar”. Navegue entre as abas para explorar cada tipo de análise.</p>

  <p>Para começar a usar o Bíblia Vive, visite a página inicial, escolha uma tradução (ACF, ARC, NVI, KJV, KJA, RVR1960, BBE), abra um capítulo e explore as ferramentas descritas acima.</p>
</main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Como usar o Bíblia Vive',
    description: desc,
    url,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'Bíblia Vive', url: CANONICAL_ORIGIN },
    step: [
      { '@type': 'HowToSection', name: 'Estudar com Comentários Teológicos', text: 'Abra um capítulo, selecione um versículo, clique em Estudar, vá à aba Comentários e clique em Buscar Comentários para acessar Matthew Henry, Albert Barnes e John Gill via IA.' },
      { '@type': 'HowToSection', name: 'Memorial — Sua Caminhada com a Palavra', text: 'Clique no botão flutuante do Caderno no canto inferior esquerdo, escolha o tipo de registro (Reflexão, Oração, Testemunho ou Jejum/Propósito) e preserve os momentos da sua jornada com a Palavra vinculados ao capítulo lido.' },
      { '@type': 'HowToSection', name: 'Destaques Coloridos', text: 'Selecione um versículo, clique em Destaque e escolha uma das 5 cores para criar seu sistema visual de estudo.' },
      { '@type': 'HowToSection', name: 'Compartilhar Cards de Versículos', text: 'Selecione um versículo, clique em Compartilhar, escolha um dos 5 templates e compartilhe a imagem em redes sociais ou copie o texto.' },
      { '@type': 'HowToSection', name: 'Planos de Leitura', text: 'Escolha um plano (Evangelhos em 30 dias, NT em 90 dias, Bíblia em 365 dias), acompanhe o progresso e mantenha a ofensiva diária.' },
    ],
  };

  return {
    META_TITLE:       `<title>${title}</title>`,
    META_DESCRIPTION: `<meta name="description" content="${desc}" />`,
    OG_URL:           `<meta property="og:url" content="${url}" />`,
    OG_TITLE:         `<meta property="og:title" content="${title}" />`,
    OG_DESCRIPTION:   `<meta property="og:description" content="${desc}" />`,
    OG_TYPE:          `<meta property="og:type" content="website" />`,
    OG_IMAGE:         `<meta property="og:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    FB_APP_ID:        `<meta property="fb:app_id" content="${FB_APP_ID}" />`,
    TWITTER_CARD:     `<meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${title}" />\n  <meta name="twitter:description" content="${desc}" />\n  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    CANONICAL_URL:    `<link rel="canonical" href="${url}" />`,
    JSON_LD:          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    SEO_CONTENT:      seoContent,
  };
}

function harpaMetaTags() {
  const title = 'Harpa Cristã — Hinos de Adoração e Louvor | Bíblia Vive';
  const desc  = 'Leia, pesquise e ouça os hinos tradicionais da Harpa Cristã. 636 hinos com busca instantânea, linha do tempo histórica e áudio de adoração.';
  const url   = `${CANONICAL_ORIGIN}/harpa`;

  const seoContent =
`<main class="bv-seo-only" style="font-family:Georgia,'Times New Roman',serif;max-width:780px;margin:0 auto;padding:1rem;line-height:1.65;color:#1a1a1a">
  <h1>Harpa Cristã — Hinos de Adoração e Louvor</h1>
  <p>A Harpa Cristã é o hinário oficial das Assembleias de Deus no Brasil, nascido em 1922 e continuamente ampliado e revisado até se tornar o hinário pentecostal mais conhecido do país. Acesse os 636 hinos tradicionais da Harpa Cristã no Bíblia Vive com busca por número ou título e áudio para adoração.</p>

  <h2>História da Harpa Cristã</h2>
  <h3>Contexto anterior à Harpa Cristã</h3>
  <ul>
    <li><strong>1861 – Salmos e Hinos:</strong> Publicação do hinário congregacional Salmos e Hinos, usado pela Assembleia de Deus em seus primeiros anos, junto com outros hinos protestantes tradicionais.</li>
    <li><strong>1917–1921 – Hinários precursores:</strong> Missionários suecos da AD em Belém (PA) organizam um hinário com 194 hinos (1917) e depois lançam o Cantor Pentecostal (1921), com 44 hinos e 10 corinhos, já destacando a doutrina pentecostal.</li>
  </ul>

  <h3>Linha do tempo da Harpa Cristã</h3>
  <ul>
    <li><strong>1922 – 1ª edição da Harpa Cristã:</strong> Lançada pela AD em Recife (PE), torna-se o hinário oficial das Assembleias de Deus, com hinos para culto público, Santa Ceia, batismo, casamento, apresentação de crianças e cultos fúnebres; tiragem inicial de mil exemplares, distribuídos por Samuel Nyström.</li>
    <li><strong>1923 – 2ª edição (300 hinos):</strong> Impressa no Rio de Janeiro, amplia o conteúdo para 300 hinos, consolidando o uso nacional da Harpa Cristã entre as igrejas assembleianas.</li>
    <li><strong>1932 – Ampliação para 400 hinos:</strong> Novos cânticos são acrescentados e o hinário chega a 400 hinos, acompanhando o crescimento do movimento pentecostal no Brasil.</li>
    <li><strong>1937 – Harpa Cristã com música:</strong> A Convenção Geral das Assembleias de Deus, reunida em São Paulo, nomeia uma comissão (incluindo Emílio Conde, Samuel Nyström e Paulo Leivas Macalão) para elaborar a primeira Harpa Cristã com letra e música, que se torna referência para o cântico congregacional.</li>
    <li><strong>Décadas seguintes – Edição clássica com 524 hinos:</strong> Ao longo dos anos são acrescentados novos cânticos até chegar à famosa edição com 524 hinos; até 1981, todos foram revisados em letra e música, com grande participação do pastor Paulo Leivas Macalão.</li>
    <li><strong>1979 – Revisão geral oficial:</strong> O Conselho Administrativo da CPAD e a CGADB nomeiam uma nova comissão para revisar música e letras da Harpa Cristã, com apoio técnico especializado em correção musical e textual.</li>
    <li><strong>1992 – Harpa Cristã Atualizada:</strong> Lançada com ajustes de linguagem e forma, é adotada por algumas igrejas, mas boa parte das Assembleias de Deus mantém a Harpa Tradicional como preferida.</li>
    <li><strong>1999 – Harpa Cristã Ampliada (640 hinos):</strong> A CPAD lança a Harpa Cristã Ampliada, acrescentando 116 novos hinos para atender melhor às necessidades cerimoniais e litúrgicas da igreja, totalizando 640 cânticos.</li>
    <li><strong>2001–2010 – Ajuste para 636 hinos:</strong> O hinário passa por nova atualização, retirando quatro hinos pátrios nacionais e fixando o número em 636 hinos.</li>
    <li><strong>2022 – 100 anos da Harpa Cristã:</strong> A Harpa Cristã completa um século de existência, reconhecida como o hinário mais conhecido e amado do Brasil, ultrapassando fronteiras denominacionais e marcando a história da hinódia pentecostal.</li>
  </ul>
</main>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    name: 'Harpa Cristã',
    description: desc,
    url,
  };

  return {
    META_TITLE:       `<title>${title}</title>`,
    META_DESCRIPTION: `<meta name="description" content="${desc}" />`,
    OG_URL:           `<meta property="og:url" content="${url}" />`,
    OG_TITLE:         `<meta property="og:title" content="${title}" />`,
    OG_DESCRIPTION:   `<meta property="og:description" content="${desc}" />`,
    OG_TYPE:          `<meta property="og:type" content="website" />`,
    OG_IMAGE:         `<meta property="og:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    FB_APP_ID:        `<meta property="fb:app_id" content="${FB_APP_ID}" />`,
    TWITTER_CARD:     `<meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${title}" />\n  <meta name="twitter:description" content="${desc}" />\n  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    CANONICAL_URL:    `<link rel="canonical" href="${url}" />`,
    JSON_LD:          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    SEO_CONTENT:      seoContent,
  };
}

/**
 * Shared builder for simple static pages.
 */
function buildStaticMeta({ title, desc, url, type, seoContent, inLanguage = 'pt-BR' }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': type,
    name: title,
    description: desc,
    url,
    inLanguage,
  };
  return {
    META_TITLE:       `<title>${title}</title>`,
    META_DESCRIPTION: `<meta name="description" content="${desc}" />`,
    OG_URL:           `<meta property="og:url" content="${url}" />`,
    OG_TITLE:         `<meta property="og:title" content="${title}" />`,
    OG_DESCRIPTION:   `<meta property="og:description" content="${desc}" />`,
    OG_TYPE:          `<meta property="og:type" content="website" />`,
    OG_IMAGE:         `<meta property="og:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    FB_APP_ID:        `<meta property="fb:app_id" content="${FB_APP_ID}" />`,
    TWITTER_CARD:     `<meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${title}" />\n  <meta name="twitter:description" content="${desc}" />\n  <meta name="twitter:image" content="${CANONICAL_ORIGIN}/og-default.png" />`,
    CANONICAL_URL:    `<link rel="canonical" href="${url}" />`,
    JSON_LD:          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    SEO_CONTENT:      seoContent,
  };
}

// ─── Sitemap helpers ──────────────────────────────────────────────────────────
function sitemapUrl(loc, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function prerender() {
  console.log('[prerender] Starting full multi-version pre-render...\n');

  // ── Load book contexts (public/bible/book-contexts.json) ──────────────────
  let bookContexts = {};
  try {
    const ctxPath = path.join(PROJECT_ROOT, 'public', 'bible', 'book-contexts.json');
    const ctxRaw  = await fs.readFile(ctxPath, 'utf-8');
    bookContexts  = JSON.parse(ctxRaw);
    console.log(`[prerender] Loaded book contexts for ${Object.keys(bookContexts).length} books.\n`);
  } catch (err) {
    console.warn('[prerender] ⚠ Could not load book-contexts.json:', err.message);
  }

  // Load template
  const templatePath = path.join(DIST_DIR, 'index.html');
  const savedTemplatePath = path.join(DIST_DIR, 'index-template.html');
  let template;
  try {
    // Tenta primeiro ler o template salvo para evitar ler o index.html já sobrescrito
    try {
      template = await fs.readFile(savedTemplatePath, 'utf-8');
      console.log('[prerender] loaded template from index-template.html');
    } catch {
      template = await fs.readFile(templatePath, 'utf-8');
      template = template.replace('<title>Bíblia Vive — Leia, Estude e Compartilhe a Bíblia</title>', '<!--META_TITLE-->');
      await fs.writeFile(savedTemplatePath, template, 'utf-8');
      console.log('[prerender] loaded template from index.html and saved to index-template.html');
    }
  } catch {
    console.error('[prerender] ✗ dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }

  // ── Fetch articles & authors ──
  const articles = await fetchPublishedArticles();
  console.log(`[prerender] Found ${articles.length} published articles.\n`);
  const authors = await fetchPublishedAuthors();
  console.log(`[prerender] Found ${authors.length} authors.\n`);

  let totalChapters = 0;
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const bibleVersions = await discoverVersions();

  // ── Bible versions loop ──
  for (const versionCfg of bibleVersions) {
    const { version, localPath, label } = versionCfg;
    console.log(`[prerender] Processing version: ${version.toUpperCase()} (${localPath})`);

    const books = await getAvailableBooks(localPath);
    if (books.length === 0) {
      console.warn(`[prerender]   ⚠ No books found for ${version}. Skipping.\n`);
      continue;
    }

    let versionChapters = 0;

    for (const book of books) {
      const routeSlug  = toRouteSlug(book.folder);
      const contextKey = toContextKey(book.folder);
      const bookCtx    = bookContexts[contextKey] ?? null;

      // ── Generate book index page (SEO: tema, resumo, autor, capítulos) ──
      try {
        const bookMeta = generateBookMetaTags(
          book.name, book.folder, routeSlug, version, label, bookCtx
        );
        const bookHtml = replacePlaceholders(template, bookMeta);
        const bookDir  = path.join(DIST_DIR, version, routeSlug);
        await fs.mkdir(bookDir, { recursive: true });
        await fs.writeFile(path.join(bookDir, 'index.html'), bookHtml, 'utf-8');
      } catch (err) {
        console.warn(`[prerender]   ⚠ Could not generate book page ${version}/${routeSlug}: ${err.message}`);
      }

      // Book index URL in sitemap
      sitemapXml += sitemapUrl(`${CANONICAL_ORIGIN}/${version}/${routeSlug}`, 'weekly', '0.7');

      for (let chapNum = 1; chapNum <= book.chapters.length; chapNum++) {
        const verses = book.chapters[chapNum - 1];

        const metaTags = generateChapterMetaTags(
          book.name, book.folder, chapNum, verses, version, label, bookCtx
        );
        const html = replacePlaceholders(template, metaTags);

        const outDir = path.join(DIST_DIR, version, routeSlug, String(chapNum));
        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf-8');

        // Sitemap entry for chapter
        sitemapXml += sitemapUrl(
          `${CANONICAL_ORIGIN}/${version}/${routeSlug}/${chapNum}`,
          'weekly', '0.8'
        );

        versionChapters++;
      }
    }

    totalChapters += versionChapters;
    console.log(`[prerender]   ✓ ${versionChapters} chapters generated for ${version.toUpperCase()}\n`);
  }

  // ── Articles ──
  console.log('[prerender] Processing articles...');
  let totalArticles = 0;
  for (const article of articles) {
    try {
      const metaTags = generateArticleMetaTags(article);
      const html     = replacePlaceholders(template, metaTags);
      const outDir   = path.join(DIST_DIR, 'artigos', article.slug);
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf-8');
      sitemapXml += sitemapUrl(`${CANONICAL_ORIGIN}/artigos/${article.slug}`, 'weekly', '0.6');
      totalArticles++;
    } catch (err) {
      console.warn(`[prerender]   ⚠ Could not prerender article "${article.slug}": ${err.message}`);
    }
  }
  console.log(`[prerender] ✓ ${totalArticles} article pages generated.\n`);

  // ── Author profile pages ──
  console.log('[prerender] Processing author profile pages...');
  let totalAuthors = 0;
  for (const author of authors) {
    try {
      const title = `${author.name} — Colunista Bíblia Vive`;
      const desc  = author.bio
        ? author.bio.substring(0, 160)
        : `Explore artigos e reflexões escritos por ${author.name} na Bíblia Vive.`;
      const url   = `${CANONICAL_ORIGIN}/autor/${author.slug}`;
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: author.name,
        description: desc,
        url,
        ...(author.avatar_url ? { image: author.avatar_url } : {}),
        ...(author.role ? { jobTitle: author.role } : {}),
        ...(author.church ? { worksFor: { '@type': 'Organization', name: author.church } } : {}),
      };
      const authorMetaTags = buildStaticMeta({ title, desc, url, type: 'ProfilePage', seoContent:
        `<main style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:1rem">` +
        `<h1>${author.name}</h1>` +
        (author.role ? `<p><strong>${author.role}</strong></p>` : '') +
        (author.church ? `<p>${author.church}</p>` : '') +
        (author.city ? `<p>${author.city}</p>` : '') +
        `<p>${desc}</p>` +
        `</main>`,
      });
      // Override JSON_LD with Person schema
      authorMetaTags.JSON_LD = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
      const html    = replacePlaceholders(template, authorMetaTags);
      const outDir  = path.join(DIST_DIR, 'autor', author.slug);
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, 'index.html'), html, 'utf-8');
      sitemapXml += sitemapUrl(`${CANONICAL_ORIGIN}/autor/${author.slug}`, 'weekly', '0.5');
      totalAuthors++;
    } catch (err) {
      console.warn(`[prerender]   ⚠ Could not prerender author "${author.slug}": ${err.message}`);
    }
  }
  console.log(`[prerender] ✓ ${totalAuthors} author profile pages generated.\n`);

  // ── Static institutional pages ──
  console.log('[prerender] Processing static pages...');

  // Home — overwrites dist/index.html
  const homeHtml = replacePlaceholders(template, homeMetaTags());
  await fs.writeFile(templatePath, homeHtml, 'utf-8');
  console.log('[prerender]   ✓ dist/index.html (Home)');

  // /planos
  const planosHtml = replacePlaceholders(template, planosMetaTags());
  const planosDir  = path.join(DIST_DIR, 'planos');
  await fs.mkdir(planosDir, { recursive: true });
  await fs.writeFile(path.join(planosDir, 'index.html'), planosHtml, 'utf-8');
  console.log('[prerender]   ✓ dist/planos/index.html');

  // /artigos index
  const artigosHtml = replacePlaceholders(template, artigosIndexMetaTags(articles));
  const artigosDir  = path.join(DIST_DIR, 'artigos');
  await fs.mkdir(artigosDir, { recursive: true });
  await fs.writeFile(path.join(artigosDir, 'index.html'), artigosHtml, 'utf-8');
  console.log('[prerender]   ✓ dist/artigos/index.html');

  // /como-usar — full HowTo tutorial content exposed as static HTML for crawlers
  const comoUsarHtml = replacePlaceholders(template, comoUsarMetaTags());
  const comoUsarDir  = path.join(DIST_DIR, 'como-usar');
  await fs.mkdir(comoUsarDir, { recursive: true });
  await fs.writeFile(path.join(comoUsarDir, 'index.html'), comoUsarHtml, 'utf-8');
  console.log('[prerender]   ✓ dist/como-usar/index.html');

  // /harpa — Harpa Cristã index & full timeline history exposed as static HTML
  const harpaHtml = replacePlaceholders(template, harpaMetaTags());
  const harpaDir  = path.join(DIST_DIR, 'harpa');
  await fs.mkdir(harpaDir, { recursive: true });
  await fs.writeFile(path.join(harpaDir, 'index.html'), harpaHtml, 'utf-8');
  console.log('[prerender]   ✓ dist/harpa/index.html');

// ─── IndexNow Protocol ────────────────────────────────────────────────────────
const INDEXNOW_KEY = '4f9b8c2e7a1d3f5b8e9a0c1d2e3f4a5b';

async function submitIndexNow(urlList) {
  if (!urlList || urlList.length === 0) return;
  console.log(`[indexnow] Submitting ${urlList.length} URLs to IndexNow (Bing / ChatGPT Search)...`);
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.bibliavive.com.br',
        key: INDEXNOW_KEY,
        keyLocation: `${CANONICAL_ORIGIN}/${INDEXNOW_KEY}.txt`,
        urlList: urlList.slice(0, 10000), // Max 10,000 URLs per payload
      }),
    });
    console.log(`[indexnow] Response status: ${res.status} (${res.statusText})`);
  } catch (err) {
    console.warn(`[indexnow] ⚠ Could not submit to IndexNow: ${err.message}`);
  }
}

  // ── Sitemap — static pages ──
  const STATIC_URLS = [
    { loc: `${CANONICAL_ORIGIN}/`,              changefreq: 'daily',   priority: '1.0' },
    { loc: `${CANONICAL_ORIGIN}/harpa`,         changefreq: 'weekly',  priority: '0.8' },
    { loc: `${CANONICAL_ORIGIN}/planos`,        changefreq: 'weekly',  priority: '0.8' },
    { loc: `${CANONICAL_ORIGIN}/artigos`,       changefreq: 'weekly',  priority: '0.8' },
    { loc: `${CANONICAL_ORIGIN}/como-usar`,     changefreq: 'monthly', priority: '0.7' },
    { loc: `${CANONICAL_ORIGIN}/sobre`,         changefreq: 'monthly', priority: '0.5' },
    { loc: `${CANONICAL_ORIGIN}/apoiar`,        changefreq: 'monthly', priority: '0.5' },
    { loc: `${CANONICAL_ORIGIN}/termos-de-uso`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${CANONICAL_ORIGIN}/pro`,           changefreq: 'weekly',  priority: '0.8' },
  ];
  for (const s of STATIC_URLS) {
    sitemapXml += sitemapUrl(s.loc, s.changefreq, s.priority);
  }
  sitemapXml += '</urlset>';

  // Write sitemap
  await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');

  // Also copy IndexNow key file to DIST_DIR if needed
  try {
    await fs.copyFile(
      path.join(PROJECT_ROOT, 'public', `${INDEXNOW_KEY}.txt`),
      path.join(DIST_DIR, `${INDEXNOW_KEY}.txt`)
    );
  } catch {
    // Ignore if copy fails
  }

  // Count sitemap URLs & extract URL list for IndexNow
  const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/g) || [];
  const allUrls = urlMatches.map(m => m.replace(/<\/?loc>/g, ''));

  // Submit to IndexNow
  await submitIndexNow(allUrls);

  // ── Summary ──
  console.log('\n════════════════════════════════════════════════');
  console.log('[prerender] ✅ Done!');
  console.log(`  Bible chapters : ${totalChapters}`);
  console.log(`  Articles       : ${totalArticles}`);
  console.log(`  Authors        : ${totalAuthors}`);
  console.log(`  Sitemap URLs   : ${allUrls.length}`);
  console.log('════════════════════════════════════════════════\n');
}

prerender().catch(err => {
  console.error('[prerender] Fatal error:', err);
  process.exit(1);
});