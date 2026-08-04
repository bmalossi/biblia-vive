/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate, NetworkOnly } from "workbox-strategies";
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

// ─── 4. Runtime Cache: Other Bible Versions (NVI, ARC, KJA, Grego, Hebraico) ───
registerRoute(
  ({ url }) => url.pathname.startsWith("/bible/"),
  new CacheFirst({
    cacheName: "bv-bible-runtime-v1",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
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

// ─── 7. Navigation Fallback: serve offline.html when network fails ──────────
registerRoute(
  new NavigationRoute(async (params) => {
    try {
      return await new NetworkOnly().handle(params);
    } catch {
      const offlineResponse = await caches.match("/offline.html");
      if (offlineResponse) return offlineResponse;
      return Response.error();
    }
  })
);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
