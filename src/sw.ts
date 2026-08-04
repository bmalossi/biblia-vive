/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate, NetworkOnly, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope;

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

// ─── 7. SPA Navigation: NetworkFirst com fallback robusto ────────────────────
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "bv-shell-v1",
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 5,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    }),
    {
      denylist: [/^\/offline\.html$/, /^\/api\//],
    }
  )
);

// ─── 8. Fallback global: quando a rede falha em navegacoes ───────────────────
setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    // 1. Tenta index.html do shell cache ou precache
    const cachedShell = (await caches.match("/index.html")) || (await caches.match("/"));
    if (cachedShell) return cachedShell;

    // 2. Tenta offline.html se tudo falhar
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) return offlinePage;
  }
  return Response.error();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
