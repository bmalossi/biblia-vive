export interface PurgeResult {
  success: boolean;
  urls: string[];
  error?: string;
}

const DEFAULT_CACHE_DOMAIN = "midia.bibliavive.com.br";

/**
 * Granular cache purge for Cloudflare CDN.
 * Purges specific file URLs from the CDN cache (e.g., cache.bibliavive.com.br/artigos/:slug.html).
 * Tolerant to external failures: never throws, returns result object.
 */
export async function purgeCloudflareUrls(
  urls: string[],
  options?: { maxRetries?: number }
): Promise<PurgeResult> {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID;

  if (!token || !zoneId) {
    console.warn(
      "[cloudflare-purge] Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID. Skipping CDN purge."
    );
    return {
      success: true,
      urls,
      error: "Cloudflare credentials not configured; skipped",
    };
  }

  if (urls.length === 0) {
    return { success: true, urls };
  }

  const endpoint = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
  const maxRetries = options?.maxRetries ?? 2;

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: urls }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true, urls };
      }

      const errors = data.errors?.map((e: any) => e.message).join(", ") || response.statusText;
      lastError = `Cloudflare purge API returned status ${response.status}: ${errors}`;
    } catch (err: any) {
      lastError = err.message || String(err);
    }

    if (attempt <= maxRetries) {
      // Exponential backoff: 300ms, 600ms...
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
  }

  console.error(`[cloudflare-purge] Failed to purge CDN cache after ${maxRetries + 1} attempts:`, lastError);
  return {
    success: false,
    urls,
    error: lastError,
  };
}

/**
 * Purges the CDN cache for a specific article and the articles index page.
 */
export async function purgeArticleCache(
  slug: string,
  cacheDomain = process.env.R2_CACHE_DOMAIN || DEFAULT_CACHE_DOMAIN
): Promise<PurgeResult> {
  const urls = [
    `https://${cacheDomain}/artigos/${slug}.html`,
    `https://${cacheDomain}/artigos/index.html`,
  ];
  return purgeCloudflareUrls(urls);
}
