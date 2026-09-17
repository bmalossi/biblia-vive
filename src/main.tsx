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

// Stale deployment recovery: recarrega quando chunk não é encontrado após novo deploy (apenas se online)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  if (navigator.onLine) {
    window.location.reload()
  }
})

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

