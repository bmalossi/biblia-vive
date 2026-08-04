import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

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
        globDirectory: "public",
        globPatterns: [
          "*.{html,ico,png,svg,webp}",
          "red_letters_verses.json",
          "bible/book-contexts.json",
          "bible/reading-plans.json",
          "bible/pt-br/acf/*/*.json",
        ],
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
