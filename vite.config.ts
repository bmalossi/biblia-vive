import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import type { ManifestEntry } from "workbox-build";

// 66 livros da Bíblia ACF adicionados ao precache manualmente porque
// o copy-public.mjs só cria dist/bible/ APÓS o vite build, então o
// globDirectory padrão (dist/) não os veria em tempo de build.
const ACF_BOOKS = [
  "1ch","1co","1jo","1kgs","1pe","1sm","1tm","1ts",
  "2ch","2co","2jo","2kgs","2pe","2sm","2tm","2ts",
  "3jo","act","am","cl","dn","dt","ec","eph","et",
  "ex","ez","ezr","gl","gn","hb","hg","hk","ho",
  "is","jd","jl","jm","jn","jo","job","jr","js",
  "jud","lk","lm","lv","mi","mk","ml","mt","na",
  "ne","nm","ob","ph","phm","prv","ps","re","rm",
  "rt","so","tt","zc","zp",
] as const;

const biblePrecacheEntries: ManifestEntry[] = [
  // App essentials from public/
  { url: "/offline.html", revision: null },
  { url: "/red_letters_verses.json", revision: null },
  { url: "/bible/book-contexts.json", revision: null },
  { url: "/bible/reading-plans.json", revision: null },
  // 66 livros ACF — a Rocha
  ...ACF_BOOKS.map((book) => ({
    url: `/bible/pt-br/acf/${book}/${book}.json`,
    revision: null,
  })),
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
        additionalManifestEntries: biblePrecacheEntries,
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
