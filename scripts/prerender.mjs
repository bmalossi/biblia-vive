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
/**
 * Each entry describes one Bible version that will be pre-rendered.
 *   localPath : relative path inside public/bible/ to the version's book folders
 *   label     : human-readable translation name shown in <title> / meta
 *   lang      : BCP-47 language tag used in the HTML lang attribute
 */
const BIBLE_VERSIONS = [
  { version: 'acf', localPath: 'pt-br/acf', label: 'ACF',  lang: 'pt-BR' },
  { version: 'arc', localPath: 'pt-br/arc', label: 'ARC',  lang: 'pt-BR' },
  { version: 'nvi', localPath: 'pt-br/nvi', label: 'NVI',  lang: 'pt-BR' },
  { version: 'kjv', localPath: 'en/kjv',    label: 'KJV',  lang: 'en'    },
];

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
  '1jo': '1JO',
  '2jo': '2JO',
  '3jo': '3JO',
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
    result = result.replace(`<!--${key}-->`, value ?? '');
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
function generateChapterMetaTags(bookName, localId, chapterNum, verses, version, versionLabel) {
  const routeSlug  = toRouteSlug(localId);
  const url        = `${CANONICAL_ORIGIN}/${version}/${routeSlug}/${chapterNum}`;
  const title      = `${bookName} ${chapterNum} — ${versionLabel} — Bíblia Vive`;
  const descText   = verses.slice(0, 3).join(' ').substring(0, 160);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: title,
    position: chapterNum,
    isPartOf: {
      '@type': 'Book',
      name: `${bookName} — ${versionLabel}`,
      url: `${CANONICAL_ORIGIN}/${version}/${routeSlug}`,
    },
    text: descText,
    inLanguage: version === 'kjv' ? 'en' : 'pt-BR',
  };

  // Build the visible SEO block: h1 + all verses as <p>
  const seoContent =
    `<article style="font-family:serif;max-width:780px;margin:0 auto;padding:1rem">` +
    `<h1>${bookName} — Capítulo ${chapterNum} (${versionLabel})</h1>` +
    verses.map((v, i) => `<p><sup>${i + 1}</sup> ${v}</p>`).join('') +
    `</article>`;

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
        ...(article.author.role ? { jobTitle: article.author.role } : {}),
        ...(article.author.church ? { worksFor: { '@type': 'Organization', name: article.author.church } } : {}),
        ...(article.author.avatar_url ? { image: article.author.avatar_url } : {}),
      }
    : { '@type': 'Organization', name: 'Bíblia Vive', url: CANONICAL_ORIGIN };

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
    publisher: { '@type': 'Organization', name: 'Bíblia Vive', url: CANONICAL_ORIGIN },
    inLanguage: 'pt-BR',
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
  return buildStaticMeta({ title, desc, url, type: 'WebSite', seoContent, inLanguage: 'pt-BR' });
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
    `<li>Plano de 30 dias — leitura intensiva</li>` +
    `<li>Plano de 90 dias — leitura trimestral</li>` +
    `<li>Plano de 365 dias — leitura anual completa</li>` +
    `</ul>` +
    `<a href="/">Voltar para a página inicial</a>` +
    `</main>`;
  return buildStaticMeta({ title, desc, url, type: 'WebPage', seoContent });
}

function artigosIndexMetaTags(articles) {
  const title = 'Artigos Bíblicos | Bíblia Vive';
  const desc  = 'Explore artigos e conteúdos sobre a Palavra de Deus.';
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
  let template;
  try {
    template = await fs.readFile(templatePath, 'utf-8');
    template = template.replace('<title>Bíblia Vive — Leia, Estude e Compartilhe a Bíblia</title>', '<!--META_TITLE-->');
    await fs.writeFile(path.join(DIST_DIR, 'index-template.html'), template, 'utf-8');
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

  // ── Bible versions loop ──
  for (const versionCfg of BIBLE_VERSIONS) {
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
          book.name, book.folder, chapNum, verses, version, label
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

  // ── Sitemap — static pages ──
  const STATIC_URLS = [
    { loc: `${CANONICAL_ORIGIN}/`,              changefreq: 'daily',   priority: '1.0' },
    { loc: `${CANONICAL_ORIGIN}/planos`,        changefreq: 'weekly',  priority: '0.8' },
    { loc: `${CANONICAL_ORIGIN}/artigos`,       changefreq: 'weekly',  priority: '0.8' },
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

  // Count sitemap URLs for reporting
  const urlCount = (sitemapXml.match(/<url>/g) || []).length;

  // ── Summary ──
  console.log('\n════════════════════════════════════════════════');
  console.log('[prerender] ✅ Done!');
  console.log(`  Bible chapters : ${totalChapters}`);
  console.log(`  Articles       : ${totalArticles}`);
  console.log(`  Authors        : ${totalAuthors}`);
  console.log(`  Sitemap URLs   : ${urlCount}`);
  console.log('════════════════════════════════════════════════\n');
}

prerender().catch(err => {
  console.error('[prerender] Fatal error:', err);
  process.exit(1);
});