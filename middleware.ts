import { next } from "@vercel/edge";

export const config = {
  matcher: ["/artigos", "/artigos/:path*"],
};

const DEFAULT_CACHE_DOMAIN = "cache.bibliavive.com.br";
const FETCH_TIMEOUT_MS = 3500;

export default async function middleware(request: Request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Apenas requisições GET ou HEAD devem ser atendidas pelo cache de HTML
    if (request.method !== "GET" && request.method !== "HEAD") {
      return next();
    }

    const cacheDomain = process.env.R2_CACHE_DOMAIN || DEFAULT_CACHE_DOMAIN;

    let targetPath = "";

    // 1. Rota de índice: /artigos ou /artigos/
    if (pathname === "/artigos" || pathname === "/artigos/") {
      targetPath = "artigos/index.html";
    } else {
      // 2. Rota individual: /artigos/:slug
      const match = pathname.match(/^\/artigos\/([a-zA-Z0-9_-]+)\/?$/);
      if (match && match[1]) {
        const slug = match[1];
        targetPath = `artigos/${slug}.html`;
      }
    }

    // Se o padrão de URL não for um artigo válido ou índice, repassar para a SPA
    if (!targetPath) {
      return next();
    }

    const r2Url = `https://${cacheDomain}/${targetPath}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(r2Url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "BibliaVive-Edge-Middleware/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok && response.status === 200) {
        const html = await response.text();

        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            "X-Edge-Served-By": "biblia-vive-r2-cache",
            "X-Edge-Target": targetPath,
          },
        });
      }

      // 404 do R2 ou outro status → repassa transparentemente para o SPA React
      return next();
    } catch {
      clearTimeout(timeoutId);
      // Timeout ou erro de rede no R2 → fallback transparente para a SPA
      return next();
    }
  } catch {
    // Qualquer falha inesperada no middleware não deve quebrar a requisição
    return next();
  }
}
