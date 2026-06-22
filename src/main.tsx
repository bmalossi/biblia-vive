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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

// Stale deployment recovery: recarrega quando chunk não é encontrado após novo deploy
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

