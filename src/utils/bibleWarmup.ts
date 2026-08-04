/**
 * bibleWarmup.ts — Bíblia Vive
 *
 * Warmup proativo do cache offline para os 66 livros da versão ACF.
 *
 * Fluxo:
 *  1. Chamado de main.tsx após o SW estar ativo
 *  2. Usa requestIdleCallback para não bloquear a UI
 *  3. Cada fetch passa pelo SW → rota CacheFirst → salvo em bv-bible-runtime-v1
 *  4. Falhas individuais são ignoradas silenciosamente
 *  5. Livros já cacheados são pulados (sem refetch desnecessário)
 *
 * Um arquivo JSON por livro já contém TODOS os capítulos:
 *   /bible/pt-br/acf/gn/gn.json  →  Genesis inteiro (50 caps)
 *   /bible/pt-br/acf/ps/ps.json  →  Salmos inteiro (150 caps)
 */

// Mapeamento de todos os 66 localIds da versão ACF
// (nomes de diretório em public/bible/pt-br/acf/)
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
 * Pré-cacheia todos os 66 livros da ACF em background, após a página carregar.
 * Cada fetch passa pelo Service Worker (CacheFirst) que armazena automaticamente.
 */
export function warmupAcfBibleCache(): void {
  // Só executa se houver um SW controlando a página
  if (!navigator.serviceWorker?.controller) {
    // SW ainda não ativo — tenta novamente quando controlar
    navigator.serviceWorker?.ready.then(() => {
      scheduleIdleTask(() => void runWarmup());
    });
    return;
  }

  scheduleIdleTask(() => void runWarmup());
}

async function runWarmup(): Promise<void> {
  const uncachedBooks: string[] = [];

  // Identifica quais livros ainda não estão em cache
  for (const localId of ACF_LOCAL_IDS) {
    const url = `/bible/pt-br/acf/${localId}/${localId}.json`;
    const alreadyCached = await isCached(url);
    if (!alreadyCached) {
      uncachedBooks.push(localId);
    }
  }

  if (uncachedBooks.length === 0) return;

  console.info(
    `[BibleWarmup] Cacheando ${uncachedBooks.length} livros offline em background...`
  );

  // Baixa em lotes de 4 para não saturar a rede
  const BATCH_SIZE = 4;
  for (let i = 0; i < uncachedBooks.length; i += BATCH_SIZE) {
    const batch = uncachedBooks.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (localId) => {
        const url = `/bible/pt-br/acf/${localId}/${localId}.json`;
        try {
          // O fetch passa pelo SW → CacheFirst → armazena em bv-bible-runtime-v1
          const res = await fetch(url, { credentials: "same-origin" });
          if (!res.ok) {
            console.warn(`[BibleWarmup] Falha HTTP ${res.status} para ${localId}`);
          }
        } catch {
          // Falha de rede: será tentado novamente na próxima sessão online
        }
      })
    );
  }

  console.info("[BibleWarmup] ✓ Warmup concluído. Bíblia disponível offline.");
}
