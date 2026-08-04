import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import type { ManifestEntry } from "workbox-build";

// Arquivos críticos de public/ que precisam estar no precache imediatamente.
// Os 66 livros ACF são tratados via warmup proativo em src/utils/bibleWarmup.ts
// (mais confiável que precache, pois não depende de timing de build).
const essentialPublicEntries: ManifestEntry[] = [
  { url: "/offline.html", revision: null },
  { url: "/red_letters_verses.json", revision: null },
  { url: "/bible/book-contexts.json", revision: null },
  { url: "/bible/reading-plans.json", revision: null },
];


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: ["**/public/bible/**"],
    },
  },
  build: {
    // public/bible tem 250k+ arquivos — copiamos separadamente após build
    copyPublicDir: false,
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: false, // Utiliza public/manifest.json existente
      injectManifest: {
        // globDirectory padrão = dist/ (gerado pelo vite build)
        // Isso captura o App Shell: index.html, assets/*.js, assets/*.css
        globPatterns: [
          "**/*.{js,css,html}",
          "*.{ico,png,svg,webp}",
        ],
        globIgnores: ["**/node_modules/**"],
        additionalManifestEntries: essentialPublicEntries,
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
