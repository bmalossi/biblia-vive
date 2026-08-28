import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import type { ManifestEntry } from "workbox-build";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// Arquivos críticos de public/ que precisam estar no precache imediatamente.
// Os 66 livros ACF são tratados via warmup proativo em src/utils/bibleWarmup.ts
// (mais confiável que precache, pois não depende de timing de build).
const essentialPublicEntries: ManifestEntry[] = [
  { url: "/offline.html", revision: null },
  { url: "/red_letters_verses.json", revision: null },
  { url: "/bible/book-contexts.json", revision: null },
  { url: "/bible/reading-plans.json", revision: null },
];

function apiDevServerPlugin() {
  return {
    name: "api-dev-server",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith("/api/")) {
          const urlPath = req.url.split("?")[0].replace(/^\/api\//, "");
          const handlerFile = path.resolve(__dirname, `./api/${urlPath}.ts`);

          try {
            const fs = await import("fs");
            if (fs.existsSync(handlerFile)) {
              const module = await server.ssrLoadModule(handlerFile);
              const handler = module.default;

              if (typeof handler === "function") {
                const protocol = req.headers["x-forwarded-proto"] || "http";
                const host = req.headers.host || "localhost:8080";
                const fullUrl = `${protocol}://${host}${req.url}`;

                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                  chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
                }
                const bodyBuffer = Buffer.concat(chunks);

                const webHeaders = new Headers();
                for (const [key, value] of Object.entries(req.headers)) {
                  if (value) {
                    if (Array.isArray(value)) {
                      value.forEach((v) => webHeaders.append(key, v));
                    } else {
                      webHeaders.set(key, value as string);
                    }
                  }
                }

                const webReq = new Request(fullUrl, {
                  method: req.method,
                  headers: webHeaders,
                  body:
                    req.method !== "GET" && req.method !== "HEAD" && bodyBuffer.length > 0
                      ? bodyBuffer
                      : undefined,
                });

                const webRes: Response = await handler(webReq);

                res.statusCode = webRes.status;
                webRes.headers.forEach((val, key) => {
                  res.setHeader(key, val);
                });

                const resBuffer = await webRes.arrayBuffer();
                res.end(Buffer.from(resBuffer));
                return;
              }
            }
          } catch (err: any) {
            console.error(`[Vite API Middleware Error in ${urlPath}]:`, err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message || "Internal Server Error in local API middleware" }));
            return;
          }
        }
        next();
      });
    },
  };
}


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
    apiDevServerPlugin(),
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
