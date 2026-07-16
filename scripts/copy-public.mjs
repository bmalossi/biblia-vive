/**
 * copy-public.mjs
 *
 * Copia o conteúdo de public/ para dist/, excluindo a pasta bible/ que tem
 * 250k+ arquivos e é referenciada via junction link (Windows) / symlink (Linux/macOS)
 * ou pelo servidor de arquivos diretamente em produção.
 *
 * Uso: node scripts/copy-public.mjs
 */
import { cpSync, readdirSync, existsSync, mkdirSync, symlinkSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const DIST = join(ROOT, 'dist');

// Pastas/arquivos dentro de public/ que NÃO devem ser copiados para dist/
// (são tratados separadamente via junction link / symlink abaixo)
const EXCLUDE = new Set(['bible']);

if (!existsSync(DIST)) {
  mkdirSync(DIST, { recursive: true });
}

// ── Copy all public assets (excluding bible/) ─────────────────────────────────
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

// ── Link public/bible → dist/bible ───────────────────────────────────────────
// This avoids copying 250k+ files while keeping them accessible at /bible/*
const bibleSrc = join(PUBLIC, 'bible');
const bibleDest = join(DIST, 'bible');

if (existsSync(bibleDest)) {
  // Remove existing junction/symlink/directory before relinking
  rmSync(bibleDest, { recursive: true, force: true });
}

try {
  if (process.platform === 'win32') {
    // Windows: use mklink /J (junction) which works without admin rights
    execSync(`mklink /J "${bibleDest}" "${bibleSrc}"`, { stdio: 'pipe' });
    console.log(`[copy-public] 🔗 Junction: dist/bible → public/bible`);
  } else {
    // Linux / macOS: regular symlink
    symlinkSync(bibleSrc, bibleDest, 'dir');
    console.log(`[copy-public] 🔗 Symlink: dist/bible → public/bible`);
  }
} catch (err) {
  // Fallback: copy the whole bible directory if linking fails
  console.warn(`[copy-public] ⚠ Link failed (${err.message}), falling back to full copy — this may take a while...`);
  cpSync(bibleSrc, bibleDest, { recursive: true, force: true });
  console.log(`[copy-public] ✓  bible (copied)`);
}

console.log('[copy-public] Done.');
