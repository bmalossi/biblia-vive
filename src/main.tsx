import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/styles/study-panel.css";
import { initTheme } from "@/lib/themes";
import ErrorBoundary from "@/components/ErrorBoundary";

initTheme();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
