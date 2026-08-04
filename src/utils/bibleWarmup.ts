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

const ACF_LOCAL_IDS: readonly string[] = [
  "1ch", "1co", "1jo", "1kgs", "1pe", "1sm", "1tm", "1ts",
  "2ch", "2co", "2jo", "2kgs", "2pe", "2sm", "2tm", "2ts",
  "3jo", "act", "am",  "cl",   "dn",  "dt",  "ec",  "eph",
  "et",  "ex",  "ez",  "ezr",  "gl",  "gn",  "hb",  "hg",
  "hk",  "ho",  "is",  "jd",   "jl",  "jm",  "jn",  "jo",
  "job", "jr",  "js",  "jud",  "lk",  "lm",  "lv",  "mi",
  "mk",  "ml",  "mt",  "na",   "ne",  "nm",  "ob",  "ph",
  "phm", "prv", "ps",  "re",   "rm",  "rt",  "so",  "tt",
  "zc",  "zp",
];

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
 * Pré-cacheia os 66 livros da versão bíblica selecionada (ACF, NVI, ARC...) em background.
 */
export function warmupAcfBibleCache(): void {
  if (!navigator.serviceWorker?.controller) {
    navigator.serviceWorker?.ready.then(() => {
      scheduleIdleTask(() => void runWarmup());
    });
    return;
  }

  scheduleIdleTask(() => void runWarmup());
}

async function runWarmup(): Promise<void> {
  const currentVersion = getVersion() || "acf";

  if (currentVersion === "acf") {
    await warmupLocalVersion("acf", "pt-br");
  } else {
    await warmupGithubVersion(currentVersion);
  }
}

async function warmupLocalVersion(version: string, langPath: string): Promise<void> {
  const uncachedUrls: string[] = [];

  for (const localId of ACF_LOCAL_IDS) {
    const url = `/bible/${langPath}/${version}/${localId}/${localId}.json`;
    if (!(await isCached(url))) {
      uncachedUrls.push(url);
    }
  }

  if (uncachedUrls.length === 0) return;

  console.info(`[BibleWarmup] Cacheando ${uncachedUrls.length} livros de ${version.toUpperCase()} (Local)...`);
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

