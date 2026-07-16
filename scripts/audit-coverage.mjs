import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');

async function getDirectories(source) {
  try {
    const entries = await fs.readdir(source, { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
  } catch {
    return [];
  }
}

async function runAudit() {
  console.log('=== Iniciando Auditoria de Cobertura de Contexto ===\n');

  // As 8 versões válidas pré-renderizadas
  const versions = ['aa', 'acf', 'arc', 'kja', 'nvi', 'bbe', 'kjv', 'rvr'];
  
  let totalBookPages = 0;
  let coveredBookPages = 0;
  const missingContext = [];

  for (const version of versions) {
    const versionDir = path.join(DIST_DIR, version);
    const books = await getDirectories(versionDir);

    for (const book of books) {
      // Ignorar subpastas numéricas (capítulos)
      if (!isNaN(Number(book))) continue;

      const indexPath = path.join(versionDir, book, 'index.html');
      totalBookPages++;

      try {
        const html = await fs.readFile(indexPath, 'utf-8');
        if (html.includes('aria-label="Contexto de')) {
          coveredBookPages++;
        } else {
          missingContext.push(`${version.toUpperCase()} - ${book.toUpperCase()}`);
        }
      } catch (err) {
        missingContext.push(`${version.toUpperCase()} - ${book.toUpperCase()} (ERRO: arquivo não encontrado ou ilegível)`);
      }
    }
  }

  const coveragePercent = totalBookPages > 0 ? ((coveredBookPages / totalBookPages) * 100).toFixed(2) : 0;

  console.log('==================================================');
  console.log(`Páginas de livro auditadas : ${totalBookPages}`);
  console.log(`Páginas com contexto       : ${coveredBookPages} (${coveragePercent}%)`);
  console.log(`Páginas sem contexto       : ${totalBookPages - coveredBookPages}`);
  console.log('==================================================\n');

  if (missingContext.length > 0) {
    console.log('Lista de páginas faltando contexto:');
    missingContext.forEach(item => console.log(`  - ${item}`));
  } else {
    console.log('🎉 100% de cobertura alcançada! Todas as páginas de livros possuem o bloco de contexto.');
  }
}

runAudit().catch(err => {
  console.error('Erro na auditoria:', err);
});
