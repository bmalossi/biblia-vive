import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache } from "workbox-precaching";
import { registerRoute, NavigationRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate, NetworkOnly, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";

declare let self: ServiceWorkerGlobalScope;

// Ativa imediatamente o novo Service Worker e assume controle de todas as abas/clientes
self.skipWaiting();
clientsClaim();

self.addEventListener("install", () => {
  void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── 1. Firebase Cloud Messaging (Push Notifications) ────────────────────────
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

declare const firebase: any;

if (typeof firebase !== "undefined") {
  firebase.initializeApp({
    apiKey: "AIzaSyBYVEQZXP2X03L6tdNFaJSRIt5Ht-9lK24",
    authDomain: "biblia-vive-web.firebaseapp.com",
    projectId: "biblia-vive-web",
    storageBucket: "biblia-vive-web.firebasestorage.app",
    messagingSenderId: "764864746880",
    appId: "1:764864746880:web:3b77dd4a51be649e2f5d65",
  });

  const fcmMessaging = firebase.messaging();

  fcmMessaging.onBackgroundMessage((payload: any) => {
    if (payload.notification) return;

    const data = payload.data || {};
    if (data.title || data.body) {
      self.registration.showNotification(data.title || "Bíblia Vive", {
        body: data.body || "Novo conteúdo disponível.",
        icon: data.icon || "/icons/icon-192.png",
        data: { ...data, url: data.url || data.link || "" },
      });
    }
  });
}

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (!url) return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// ─── 2. Precache: App Shell + Rocha ACF Bible JSONs ──────────────────────────
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// ─── 3. Audio Pass-Through (Zero Bytes in Cache Storage) ─────────────────────
registerRoute(
  ({ request, url }) =>
    request.destination === "audio" ||
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".wav") ||
    url.hostname === "midia.bibliavive.com.br" ||
    url.hostname.endsWith(".bibliavive.com.br"),
  new NetworkOnly()
);

// ─── 4. Runtime Cache: Bible Versions (Local JSONs & GitHub Raw for NVI, ARC, KJA, etc.) ─
// Intercepta rotas locais (/bible/**) e externas do GitHub Raw (MaatheusGois/bible)
registerRoute(
  ({ url }) =>
    url.pathname.startsWith("/bible/") ||
    (url.hostname === "raw.githubusercontent.com" && url.pathname.includes("/MaatheusGois/bible/")),
  new CacheFirst({
    cacheName: "bv-bible-runtime-v1",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500, // Espaço suficiente para múltiplos livros de várias versões
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 dias
      }),
    ],
  })
);

// ─── 5. Runtime Cache: Articles & Reading Plans Metadata ──────────────────────
registerRoute(
  ({ url }) => url.pathname.includes("/api/articles") || url.pathname.includes("/reading-plans"),
  new StaleWhileRevalidate({
    cacheName: "bv-articles-metadata-v1",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
      }),
    ],
  })
);

// ─── 6. Runtime Cache: Article Images & Icons ────────────────────────────────
registerRoute(
  ({ request, url }) =>
    request.destination === "image" &&
    (url.pathname.startsWith("/og/") ||
      url.pathname.startsWith("/icons/") ||
      url.hostname.includes("r2") ||
      url.hostname.includes("supabase")),
  new CacheFirst({
    cacheName: "bv-article-images-v1",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ─── 7. SPA Navigation: Retorna index.html precacheado (0ms instantâneo) ──────
// Para SPAs com React Router, qualquer URL de documento (/ , /nvi/gn/1, etc.)
// DEVE servir o index.html do precache. O React Router assume a rota no cliente.
let getPrecachedAppShell: any;
try {
  getPrecachedAppShell = createHandlerBoundToURL("/index.html");
} catch {
  try {
    getPrecachedAppShell = createHandlerBoundToURL("index.html");
  } catch {
    getPrecachedAppShell = null;
  }
}

registerRoute(
  new NavigationRoute(
    async (options) => {
      // 1. Tenta o handler oficial do Workbox bound para /index.html
      if (getPrecachedAppShell) {
        try {
          return await getPrecachedAppShell(options);
        } catch {
          // ignora e tenta fallbacks
        }
      }

      // 2. Tenta buscar no precache via matchPrecache do Workbox
      const precachedHtml =
        (await matchPrecache("/index.html")) ||
        (await matchPrecache("index.html"));
      if (precachedHtml) return precachedHtml;

      // 3. Se online, tenta buscar a versão da rede
      if (navigator.onLine) {
        try {
          return await new NetworkFirst().handle(options);
        } catch {
          // ignora
        }
      }

      // 4. Fallback de cache geral
      const cached =
        (await caches.match("/index.html", { ignoreSearch: true })) ||
        (await caches.match("/", { ignoreSearch: true }));
      if (cached) return cached;

      // 5. Último recurso: offline.html
      const offlinePage = await caches.match("/offline.html");
      if (offlinePage) return offlinePage;

      return Response.error();
    },
    {
      denylist: [/^\/offline\.html$/, /^\/api\//],
    }
  )
);

// ─── 8. Fallback global para outros recursos ─────────────────────────────────
setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const cachedShell =
      (await matchPrecache("/index.html")) ||
      (await caches.match("/index.html", { ignoreSearch: true })) ||
      (await caches.match("/offline.html"));
    return cachedShell || Response.error();
  }
  return Response.error();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
