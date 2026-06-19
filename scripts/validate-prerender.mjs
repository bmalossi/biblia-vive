// Validation script for the prerender output
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

const ok  = (msg) => console.log(`  \x1b[32m[OK]\x1b[0m ${msg}`);
const fail = (msg) => console.log(`  \x1b[31m[FALHA]\x1b[0m ${msg}`);
const info = (msg) => console.log(`  \x1b[33m[INFO]\x1b[0m ${msg}`);
const head = (msg) => console.log(`\n\x1b[36m=== ${msg} ===\x1b[0m`);

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function countFiles(dir) {
  let count = 0;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
    for (const e of entries) if (!e.isDirectory() && e.name === 'index.html') count++;
  } catch { /* dir missing */ }
  return count;
}

async function readFile(p) {
  try { return await fs.readFile(p, 'utf-8'); } catch { return ''; }
}

async function validate() {
  // ── 1. File counts per version ───────────────────────────────────────────
  head('ARQUIVOS GERADOS POR VERSÃO');
  let totalChapters = 0;
  for (const ver of ['acf', 'arc', 'nvi', 'kjv']) {
    const count = await countFiles(path.join(DIST, ver));
    totalChapters += count;
    if (count >= 1000) ok(`${ver.toUpperCase()}: ${count} arquivos index.html`);
    else fail(`${ver.toUpperCase()}: apenas ${count} arquivos (esperado ~1189)`);
  }
  ok(`Total de capítulos: ${totalChapters}`);

  // ── 2. SEO content inside #root (not only noscript) ──────────────────────
  head('CONTEÚDO DENTRO DE #root — ACF Gênesis 1');
  const gn1 = await readFile(path.join(DIST, 'acf/gn/1/index.html'));
  if (!gn1) { fail('Arquivo dist/acf/gn/1/index.html não encontrado'); }
  else {
    if (gn1.includes('<div id="root"><article')) ok('SEO_CONTENT presente diretamente dentro de #root');
    else if (gn1.includes('<div id="root">') && gn1.includes('<h1>')) ok('Conteúdo h1 encontrado dentro de #root');
    else fail('Conteúdo NÃO encontrado dentro de #root');

    if (gn1.includes('<noscript>')) ok('Fallback <noscript> mantido para compatibilidade');
    else info('<noscript> não encontrado');

    if (gn1.includes('<sup>1</sup>')) ok('Versículos marcados com <sup> presentes (versículo 1)');
    else fail('Marcação de versículos <sup> não encontrada');

    if (gn1.includes('Gênesis 1') || gn1.includes('Genesis 1')) ok('Título do capítulo presente no conteúdo');
    else fail('Título do capítulo não encontrado');

    if (gn1.includes('type="application/ld+json"')) ok('JSON-LD schema.org presente');
    else fail('JSON-LD ausente');

    if (gn1.includes('rel="canonical"')) ok('Tag canonical presente');
    else fail('Tag canonical ausente');

    // Check canonical URL
    const canonMatch = gn1.match(/rel="canonical"\s+href="([^"]+)"/);
    if (canonMatch) info(`Canonical: ${canonMatch[1]}`);
  }

  // ── 3. ARC chapter ───────────────────────────────────────────────────────
  head('CONTEÚDO ARC — Salmos 23');
  const arcSl23 = await readFile(path.join(DIST, 'arc/sl/23/index.html'));
  if (!arcSl23) fail('dist/arc/sl/23/index.html não encontrado');
  else {
    if (arcSl23.includes('ARC')) ok('Versão ARC identificada no HTML');
    if (arcSl23.includes('<sup>1</sup>')) ok('Versículos presentes no HTML de ARC');
    const canonMatch = arcSl23.match(/rel="canonical"\s+href="([^"]+)"/);
    if (canonMatch) info(`Canonical ARC/sl/23: ${canonMatch[1]}`);
  }

  // ── 4. NVI chapter ───────────────────────────────────────────────────────
  head('CONTEÚDO NVI — Mateus 6');
  const nviMt6 = await readFile(path.join(DIST, 'nvi/mt/6/index.html'));
  if (!nviMt6) fail('dist/nvi/mt/6/index.html não encontrado');
  else {
    if (nviMt6.includes('NVI')) ok('Versão NVI identificada no HTML');
    if (nviMt6.includes('<sup>9</sup>')) ok('Oração do Pai Nosso (versículo 9) presente');
    const canonMatch = nviMt6.match(/rel="canonical"\s+href="([^"]+)"/);
    if (canonMatch) info(`Canonical NVI/mt/6: ${canonMatch[1]}`);
  }

  // ── 5. KJV chapter ───────────────────────────────────────────────────────
  head('CONTEÚDO KJV — John 3 (João)');
  // KJV uses routeSlug 'joa' for John (jo → joa mapping)
  const kjvJoa3 = await readFile(path.join(DIST, 'kjv/joa/3/index.html'));
  if (!kjvJoa3) {
    // Try alternative: joa might map differently in KJV
    info('Tentando caminho alternativo kjv/jo/3...');
    const alt = await readFile(path.join(DIST, 'kjv/jo/3/index.html'));
    if (alt) info('Encontrado em kjv/jo/3');
    else fail('dist/kjv/joa/3/index.html não encontrado');
  } else {
    if (kjvJoa3.includes('KJV')) ok('Versão KJV identificada no HTML');
    if (kjvJoa3.includes('God so loved') || kjvJoa3.includes('For God')) ok('João 3:16 (For God so loved) presente no KJV');
    const canonMatch = kjvJoa3.match(/rel="canonical"\s+href="([^"]+)"/);
    if (canonMatch) info(`Canonical KJV/joa/3: ${canonMatch[1]}`);
  }

  // ── 6. Sitemap validation ─────────────────────────────────────────────────
  head('SITEMAP UNIFICADO');
  const sitemap = await readFile(path.join(DIST, 'sitemap.xml'));
  if (!sitemap) { fail('dist/sitemap.xml não encontrado'); }
  else {
    const urlCount = (sitemap.match(/<url>/g) || []).length;
    ok(`Total de URLs no sitemap: ${urlCount}`);

    for (const ver of ['acf', 'arc', 'nvi', 'kjv']) {
      const cnt = (sitemap.match(new RegExp(`/${ver}/`, 'g')) || []).length;
      if (cnt >= 1000) ok(`${ver.toUpperCase()}: ${cnt} URLs no sitemap`);
      else fail(`${ver.toUpperCase()}: apenas ${cnt} URLs no sitemap`);
    }

    if (sitemap.includes('/artigos')) ok('Artigos presentes no sitemap');
    if (sitemap.includes('/planos')) ok('/planos presente no sitemap');
    if (sitemap.includes('/pro')) ok('/pro presente no sitemap');
    if (sitemap.includes('<changefreq>')) ok('changefreq definido nas entradas');
    if (sitemap.includes('<priority>')) ok('priority definido nas entradas');
  }

  // ── 7. Static pages ───────────────────────────────────────────────────────
  head('PÁGINAS ESTÁTICAS INSTITUCIONAIS');
  for (const [label, file] of [
    ['Home (index.html)', 'index.html'],
    ['Planos', 'planos/index.html'],
    ['Artigos index', 'artigos/index.html'],
  ]) {
    const content = await readFile(path.join(DIST, file));
    if (content && content.includes('<h1>')) ok(`${label}: h1 semântico presente`);
    else if (content) info(`${label}: encontrado mas sem h1`);
    else fail(`${label}: arquivo não encontrado`);
  }

  // ── 8. No-JS crawler simulation ───────────────────────────────────────────
  head('SIMULAÇÃO DE CRAWLER SEM JS — ACF Gênesis 1');
  if (gn1) {
    // Strip everything that requires JS (script tags)
    const noJs = gn1.replace(/<script[\s\S]*?<\/script>/gi, '');
    const verseCount = (noJs.match(/<sup>\d+<\/sup>/g) || []).length;
    if (verseCount >= 20) ok(`Sem JS: ${verseCount} versículos visíveis para crawler`);
    else if (verseCount > 0) info(`Sem JS: ${verseCount} versículos visíveis`);
    else fail('Sem JS: nenhum versículo encontrado no HTML bruto');

    if (noJs.includes('<h1>')) ok('Sem JS: heading h1 acessível');
    if (noJs.includes('application/ld+json')) ok('Sem JS: JSON-LD acessível (inline no <head>)');
    if (noJs.includes('rel="canonical"')) ok('Sem JS: canonical acessível');
  }

  console.log('\n\x1b[32m✅ Validação concluída!\x1b[0m\n');
}

validate().catch(err => {
  console.error('Erro na validação:', err);
  process.exit(1);
});
