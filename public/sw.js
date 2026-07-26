importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBYVEQZXP2X03L6tdNFaJSRIt5Ht-9lK24",
  authDomain: "biblia-vive-web.firebaseapp.com",
  projectId: "biblia-vive-web",
  storageBucket: "biblia-vive-web.firebasestorage.app",
  messagingSenderId: "764864746880",
  appId: "1:764864746880:web:3b77dd4a51be649e2f5d65",
});

const fcmMessaging = firebase.messaging();

fcmMessaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};
  self.registration.showNotification(title || "Bíblia Vive", {
    body: body || "Novo conteúdo disponível.",
    icon: icon || "/icons/icon-192.png",
    data: { ...data, url: data?.url || payload.fcmOptions?.link || "" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (!url) return;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

const STATIC_CACHE = "bv-static-v1";
const BIBLE_CACHE = "bv-bible-v1";
const PAGES_CACHE = "bv-pages-v1";

const BIBLE_MAX_ENTRIES = 150;
const BIBLE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const STATIC_MAX_ENTRIES = 150;
const STATIC_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const PAGES_MAX_ENTRIES = 50;
const PAGES_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const FONT_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

const isGoogleFont = (url) => url.origin.includes("fonts.googleapis.com") || url.origin.includes("fonts.gstatic.com");
const isR2Media = (url) => url.hostname === "midia.bibliavive.com.br" || url.hostname.endsWith(".bibliavive.com.br");
const isBibleApi = (url) => url.hostname.includes("api.scripture.api.bible") || url.hostname.includes("raw.githubusercontent.com");
const isStaticAsset = (request) => ["style", "script", "font", "image"].includes(request.destination);
const isThirdPartyScript = (url) => {
  const host = url.hostname;
  return (
    host.includes("googletagmanager.com") ||
    host.includes("google-analytics.com") ||
    host.includes("doubleclick.net") ||
    host.includes("googlesyndication.com")
  );
};

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  const cacheAllowlist = [STATIC_CACHE, BIBLE_CACHE, PAGES_CACHE];
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheAllowlist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

async function pruneCache(cacheName, maxEntries, maxAge) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const stamped = await Promise.all(
    keys.map(async (req) => {
      const res = await cache.match(req);
      const savedAt = Number(res?.headers.get("sw-saved-at") || 0);
      return { req, savedAt };
    }),
  );

  const fresh = stamped
    .filter((item) => Date.now() - item.savedAt <= maxAge)
    .sort((a, b) => a.savedAt - b.savedAt);

  const stale = stamped.filter((item) => Date.now() - item.savedAt > maxAge);
  await Promise.all(stale.map((item) => cache.delete(item.req)));

  if (fresh.length > maxEntries) {
    const removable = fresh.slice(0, fresh.length - maxEntries);
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
  // Do NOT intercept R2 media — they are loaded directly via img tags.
  // Intercepting them causes CSP connect-src violations.
  if (isR2Media(url)) return;

  // Exclude third-party scripts (analytics/ads) from cache
  if (isThirdPartyScript(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const pageCache = await caches.open(PAGES_CACHE);
        const network = fetch(request);
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000));

        try {
          const response = await Promise.race([network, timeout]);
          const stamped = await withSavedAt(response);
          await pageCache.put(request, stamped.clone());
          event.waitUntil(pruneCache(PAGES_CACHE, PAGES_MAX_ENTRIES, PAGES_MAX_AGE));
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
            await pruneCache(BIBLE_CACHE, BIBLE_MAX_ENTRIES, BIBLE_MAX_AGE);
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
                await pruneCache(STATIC_CACHE, STATIC_MAX_ENTRIES, STATIC_MAX_AGE);
              })
              .catch(() => null);
            return cached;
          }
        }

        const response = await fetch(request);
        const stamped = await withSavedAt(response);
        await cache.put(request, stamped.clone());
        event.waitUntil(pruneCache(STATIC_CACHE, STATIC_MAX_ENTRIES, STATIC_MAX_AGE));
        return response;
      })(),
    );
  }
});

