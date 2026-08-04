/**
 * cacheInspector.ts — Bíblia Vive
 * 
 * Script utilitário exposto no console para auditoria em tempo real do
 * Cache Storage do PWA (Operação Rocha Offline).
 */

export interface CacheBucketSummary {
  cacheName: string;
  itemCount: number;
  estimatedSizeBytes: number;
  estimatedSizeFormatted: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export async function checkBibleCache(): Promise<CacheBucketSummary[]> {
  if (!("caches" in window)) {
    console.warn("[CacheInspector] CacheStorage API não suportada neste ambiente.");
    return [];
  }

  const keys = await caches.keys();
  const summaries: CacheBucketSummary[] = [];

  console.group("📦 Operação Rocha Offline — Relatório de Cache Storage");

  let grandTotalBytes = 0;

  for (const cacheName of keys) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    let cacheBytes = 0;

    for (const req of requests) {
      const response = await cache.match(req);
      if (response) {
        const blob = await response.clone().blob();
        cacheBytes += blob.size;
      }
    }

    grandTotalBytes += cacheBytes;

    const summary: CacheBucketSummary = {
      cacheName,
      itemCount: requests.length,
      estimatedSizeBytes: cacheBytes,
      estimatedSizeFormatted: formatBytes(cacheBytes),
    };

    summaries.push(summary);
    console.log(`• ${cacheName}: ${summary.itemCount} itens | ${summary.estimatedSizeFormatted}`);
  }

  console.log(`--------------------------------------------------`);
  console.log(`💾 Total ocupado no Storage: ${formatBytes(grandTotalBytes)}`);
  console.groupEnd();

  return summaries;
}

export async function cleanBibleCache(cacheNamesToClean?: string[]): Promise<void> {
  if (!("caches" in window)) return;

  const keys = await caches.keys();
  const targets = cacheNamesToClean || keys.filter((name) => !name.includes("precache"));

  console.log(`🧹 Iniciando expurgo manual de cache para:`, targets);

  for (const cacheName of targets) {
    const deleted = await caches.delete(cacheName);
    console.log(`[CacheInspector] Cache '${cacheName}' removido:`, deleted);
  }

  console.log("✅ Expulso com sucesso. Verificando status atualizado:");
  await checkBibleCache();
}

// Exposição global no objeto window
if (typeof window !== "undefined") {
  (window as any).checkBibleCache = checkBibleCache;
  (window as any).cleanBibleCache = cleanBibleCache;
}
