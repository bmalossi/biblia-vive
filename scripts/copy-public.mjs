/**
 * copy-public.mjs
 *
 * Copia o conteúdo de public/ para dist/, excluindo a pasta bible/ que tem
 * 250k+ arquivos e é referenciada via junction link (Windows) / symlink (Linux/macOS)
 * ou pelo servidor de arquivos diretamente em produção.
 *
 * Uso: node scripts/copy-public.mjs
 */
import { cpSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const DIST = join(ROOT, 'dist');

// Pastas/arquivos dentro de public/ que NÃO devem ser copiados para dist/
// (são tratados separadamente no deploy ou via junction link local)
const EXCLUDE = new Set(['bible']);

if (!existsSync(DIST)) {
  mkdirSync(DIST, { recursive: true });
}

const entries = readdirSync(PUBLIC, { withFileTypes: true });

for (const entry of entries) {
  if (EXCLUDE.has(entry.name)) {
    console.log(`[copy-public] ⏭  Skipping ${entry.name}/`);
    continue;
  }
  const src = join(PUBLIC, entry.name);
  const dest = join(DIST, entry.name);
  cpSync(src, dest, { recursive: true, force: true });
  console.log(`[copy-public] ✓  ${entry.name}`);
}

console.log('[copy-public] Done.');
