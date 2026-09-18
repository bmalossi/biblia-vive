import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/styles/study-panel.css";
import { initTheme } from "@/lib/themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // "development" | "production"
  tracesSampleRate: 0.2,             // 20% das navegações viram traces
  replaysOnErrorSampleRate: 0,       // desativado (cota do free tier)
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
});

initTheme();

import "@/utils/cacheInspector";
import { warmupAcfBibleCache } from "@/utils/bibleWarmup";

// O vite-plugin-pwa (injectRegister: "auto") já registra o SW via /registerSW.js injetado no HTML.
// Não fazemos um segundo registro manual — evita double-registration e o reg.update() a cada pageload
// que gerava 1 Edge Request extra por visita.
if ("serviceWorker" in navigator) {
  // Aguarda o SW controlador estar pronto antes de fazer o warmup do cache
  navigator.serviceWorker.ready.then(() => {
    warmupAcfBibleCache();
  });
}

// Stale deployment recovery: recarrega quando chunk não é encontrado após novo deploy.
// IMPORTANTE: NÃO chamar `event.preventDefault()`!
// No Vite, chamar preventDefault() faz o helper de preload suprimir a rejeição da Promise
// e resolver o módulo dinâmico como `undefined`. Isso faz o React.lazy tentar ler `undefined.default`,
// disparando TypeError: "Cannot read properties of undefined (reading 'default')" antes do reload.
// Sem preventDefault(), a Promise rejeita normalmente, permitindo que o ErrorBoundary
// capture como chunk error e faça o reload sem registrar falso-positivo no Sentry.
window.addEventListener("vite:preloadError", () => {
  const RELOAD_KEY = "bv_stale_reload_ts";
  const now = Date.now();
  const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || 0);

  if (now - lastReload > 15000 && navigator.onLine) {
    sessionStorage.setItem(RELOAD_KEY, String(now));
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

