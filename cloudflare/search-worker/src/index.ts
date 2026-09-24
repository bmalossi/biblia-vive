/**
 * Motor de Busca Bíblica — Cloudflare D1 + FTS5
 * index.ts
 *
 * Cloudflare Worker de borda de alta performance.
 * Consulta diretamente o banco D1 com módulo FTS5 e retorna versículos em <15ms.
 */

import { buildFtsSearchSql } from "./querySanitizer";

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
}

interface VerseRow {
  version: string;
  book_id: string;
  book_name: string;
  testament: string;
  chapter: number;
  verse: number;
  text: string;
  rank?: number;
}

interface CountRow {
  total: number;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Tratamento de Preflight CORS (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (request.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 2. Health check rápido
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 3. Extração e validação de parâmetros de busca
    const rawQuery = (url.searchParams.get("q") || "").trim();
    const version = (url.searchParams.get("v") || "all").trim();
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

    if (!rawQuery) {
      return new Response(
        JSON.stringify({
          verses: [],
          total: 0,
          limit,
          offset,
          query: "",
          version,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    try {
      // 4. Construção da query SQL FTS5 sanitizada
      const fts = buildFtsSearchSql({
        rawQuery,
        version,
        limit,
        offset,
      });

      if (!fts.sanitizedQuery) {
        return new Response(
          JSON.stringify({
            verses: [],
            total: 0,
            limit,
            offset,
            query: rawQuery,
            version,
          }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      // 5. Execução em paralelo no Cloudflare D1 (dados e contagem total)
      const [resultsStatement, countStatement] = await Promise.all([
        env.DB.prepare(fts.sql).bind(...fts.params).all<VerseRow>(),
        env.DB.prepare(fts.countSql).bind(...fts.countParams).first<CountRow>(),
      ]);

      const rows = resultsStatement.results || [];
      const total = countStatement?.total ?? rows.length;

      // 6. Mapeamento para o formato canônico de versículo da plataforma
      const verses = rows.map((r) => ({
        id: `${r.book_id}.${r.chapter}.${r.verse}`,
        version: r.version,
        bookId: r.book_id,
        bookName: r.book_name,
        testament: r.testament,
        chapter: Number(r.chapter),
        verse: Number(r.verse),
        reference: `${r.book_name} ${r.chapter}:${r.verse}`,
        text: r.text,
        rank: r.rank,
      }));

      // 7. Retorno com Cache-Control inteligente na borda
      // Buscas bíblicas são determinísticas: cache de 1h no cliente e 24h na CDN Cloudflare
      const cacheHeaders = {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      };

      return new Response(
        JSON.stringify({
          verses,
          total,
          limit,
          offset,
          sanitizedQuery: fts.sanitizedQuery,
          query: rawQuery,
          version,
        }),
        {
          status: 200,
          headers: cacheHeaders,
        }
      );
    } catch (err: any) {
      console.error("[SearchWorker] Erro na busca D1 FTS5:", err?.message || err);

      return new Response(
        JSON.stringify({
          verses: [],
          total: 0,
          limit,
          offset,
          query: rawQuery,
          version,
          error: "Falha temporária no motor de busca.",
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }
  },
};
