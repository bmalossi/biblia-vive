const STATIC_CACHE = "bv-static-v1";
const BIBLE_CACHE = "bv-bible-v1";
const PAGES_CACHE = "bv-pages-v1";
const BIBLE_MAX_ENTRIES = 150;
const BIBLE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const FONT_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

const isGoogleFont = (url) => url.origin.includes("fonts.googleapis.com") || url.origin.includes("fonts.gstatic.com");
const isBibleApi = (url) => url.hostname.includes("api.scripture.api.bible") || url.hostname.includes("raw.githubusercontent.com");
const isStaticAsset = (request) => ["style", "script", "font", "image"].includes(request.destination);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

async function pruneBibleCache() {
  const cache = await caches.open(BIBLE_CACHE);
  const keys = await cache.keys();
  const stamped = await Promise.all(
    keys.map(async (req) => {
      const res = await cache.match(req);
      const savedAt = Number(res?.headers.get("sw-saved-at") || 0);
      return { req, savedAt };
    }),
  );

  const fresh = stamped
    .filter((item) => Date.now() - item.savedAt <= BIBLE_MAX_AGE)
    .sort((a, b) => a.savedAt - b.savedAt);

  const stale = stamped.filter((item) => Date.now() - item.savedAt > BIBLE_MAX_AGE);
  await Promise.all(stale.map((item) => cache.delete(item.req)));

  if (fresh.length > BIBLE_MAX_ENTRIES) {
    const removable = fresh.slice(0, fresh.length - BIBLE_MAX_ENTRIES);
    await Promise.all(removable.map((item) => cache.delete(item.req)));
  }
}

function withSavedAt(response) {
  if (response.type === "opaque" || response.status === 0) {
    return Promise.resolve(response.clone());
  }
  return response
    .clone()
    .blob()
    .then((blob) =>
      new Response(blob, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers([...response.headers.entries(), ["sw-saved-at", String(Date.now())]]),
      }),
    );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Only handle HTTP/HTTPS — skip chrome-extension://, data:, etc.
  if (request.method !== "GET" || (url.protocol !== "http:" && url.protocol !== "https:")) return;

  // Do NOT intercept Google Fonts — let the browser handle them natively.
  // Fonts are loaded via <link rel="preload"> and have their own browser cache.
  // Intercepting them causes CSP connect-src violations.
  if (url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com") return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const pageCache = await caches.open(PAGES_CACHE);
        const network = fetch(request);
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000));

        try {
          const response = await Promise.race([network, timeout]);
          await pageCache.put(request, response.clone());
          return response;
        } catch {
          return (await pageCache.match(request)) || (await caches.match("/offline.html")) || Response.error();
        }
      })(),
    );
    return;
  }

  if (isBibleApi(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(BIBLE_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then(async (response) => {
            const stamped = await withSavedAt(response);
            await cache.put(request, stamped.clone());
            await pruneBibleCache();
            return response;
          })
          .catch(() => null);

        return cached || (await network) || Response.error();
      })(),
    );
    return;
  }

  if (isStaticAsset(request) || isGoogleFont(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) {
          const cacheDate = Number(cached.headers.get("sw-saved-at") || 0);
          if (!isGoogleFont(url) || Date.now() - cacheDate < FONT_MAX_AGE) {
            fetch(request)
              .then(async (response) => {
                const stamped = await withSavedAt(response);
                await cache.put(request, stamped);
              })
              .catch(() => null);
            return cached;
          }
        }

        const response = await fetch(request);
        const stamped = await withSavedAt(response);
        await cache.put(request, stamped.clone());
        return response;
      })(),
    );
  }
});
