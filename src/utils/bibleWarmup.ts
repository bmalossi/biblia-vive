/**
 * bibleWarmup.ts — Bíblia Vive
 *
 * Warmup proativo do cache offline para a versão selecionada da Bíblia (ACF, NVI, ARC, etc.).
 *
 * Fluxo:
 *  1. Identifica a versão atual do leitor (ex: ACF ou NVI)
 *  2. Para a versão ACF (local), baixa os 66 JSONs locais em background.
 *  3. Para versões remotas (NVI, ARC, KJA), busca o índice do GitHub Raw e pré-carrega os 66 livros em background.
 *  4. Cada fetch é interceptado pelo Service Worker (CacheFirst) e fica salvo em `bv-bible-runtime-v1`.
 */

import { getVersion } from "@/lib/themes";
import { GITHUB_VERSION_SLUGS, GITHUB_LANG_PATHS } from "@/lib/bookResolver";

// Livros fundamentais para leitura inicial offline (5 livros em vez de 66).
// Evita disparar 66 a 132 requisições HTTP simultâneas em background a cada visita.
const STARTER_LOCAL_IDS: readonly string[] = ["gn", "ps", "prv", "mt", "jo"];

const GITHUB_BASE = "https://raw.githubusercontent.com/MaatheusGois/bible/main";
const BIBLE_CACHE_NAME = "bv-bible-runtime-v1";

function scheduleIdleTask(fn: () => void): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(fn, { timeout: 10_000 });
  } else {
    setTimeout(fn, 3_000);
  }
}

async function isCached(url: string): Promise<boolean> {
  if (!("caches" in window)) return false;
  try {
    const cache = await caches.open(BIBLE_CACHE_NAME);
    const match = await cache.match(url);
    return match !== undefined;
  } catch {
    return false;
  }
}

/**
 * Pré-cacheia os livros fundamentais em background de forma controlada.
 */
export function warmupAcfBibleCache(): void {
  const currentVersion = getVersion() || "acf";
  const flagKey = `bv_warmup_done_v2_${currentVersion}`;

  // Se já foi feito o warmup nesta máquina para esta versão, não refazer
  try {
    if (localStorage.getItem(flagKey) === "true") {
      return;
    }
  } catch {
    // localStorage inacessível
  }

  if (!navigator.serviceWorker?.controller) {
    navigator.serviceWorker?.ready.then(() => {
      scheduleIdleTask(() => void runWarmup(flagKey));
    });
    return;
  }

  scheduleIdleTask(() => void runWarmup(flagKey));
}

async function runWarmup(flagKey: string): Promise<void> {
  const currentVersion = getVersion() || "acf";

  // Aquece apenas os livros essenciais da versão atual do leitor
  const localVersions = ["acf", "arc", "nvi", "aa", "kja"];
  if (localVersions.includes(currentVersion)) {
    await warmupLocalVersion(currentVersion, "pt-br");
  }

  try {
    localStorage.setItem(flagKey, "true");
  } catch {
    // ignore
  }
}

async function warmupLocalVersion(version: string, langPath: string): Promise<void> {
  const uncachedUrls: string[] = [];

  for (const localId of STARTER_LOCAL_IDS) {
    const url = `/bible/${langPath}/${version}/${localId}/${localId}.json`;
    if (!(await isCached(url))) {
      uncachedUrls.push(url);
    }
  }

  if (uncachedUrls.length === 0) return;

  console.info(`[BibleWarmup] Cacheando ${uncachedUrls.length} livros iniciais de ${version.toUpperCase()} (Local)...`);
  await fetchInBatches(uncachedUrls);
}

async function warmupGithubVersion(version: string): Promise<void> {
  const vSlug = GITHUB_VERSION_SLUGS[version] ?? version;
  const lang = GITHUB_LANG_PATHS[version] ?? "pt-br";
  const indexUrl = `${GITHUB_BASE}/versions/${lang}/${vSlug}.json`;

  try {
    const res = await fetch(indexUrl);
    if (!res.ok) return;
    const books = (await res.json()) as { id: string }[];
    if (!Array.isArray(books)) return;

    const uncachedUrls: string[] = [];
    for (const book of books) {
      const url = `${GITHUB_BASE}/versions/${lang}/${vSlug}/${book.id}/${book.id}.json`;
      if (!(await isCached(url))) {
        uncachedUrls.push(url);
      }
    }

    if (uncachedUrls.length === 0) return;

    console.info(`[BibleWarmup] Cacheando ${uncachedUrls.length} livros de ${version.toUpperCase()} (GitHub)...`);
    await fetchInBatches(uncachedUrls);
  } catch (err) {
    console.warn(`[BibleWarmup] Falha ao listar versão ${version} no GitHub:`, err);
  }
}

async function fetchInBatches(urls: string[]): Promise<void> {
  const BATCH_SIZE = 4;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (url) => {
        try {
          await fetch(url, { credentials: "same-origin" });
        } catch {
          // Ignora falhas pontuais de rede
        }
      })
    );
  }
  console.info("[BibleWarmup] ✓ Warmup concluído com sucesso.");
}

