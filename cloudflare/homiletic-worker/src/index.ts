/**
 * Cloudflare Worker — Repositório Homilético D1
 * cloudflare/homiletic-worker/src/index.ts
 *
 * Persistência na borda para Sermões e Histórico de Pregação (ADR-0015).
 */

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  SUPABASE_JWT_SECRET?: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Extrai o userId do JWT Bearer token emitido pelo Supabase Auth.
 */
function extractUserIdFromJwt(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadStr);
    return payload.sub || null;
  } catch {
    return null;
  }
}

let schemaInitialized = false;

async function ensureSchema(db: D1Database): Promise<void> {
  if (schemaInitialized || typeof db?.exec !== "function") return;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sermons (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        inspiration_note_id TEXT,
        title TEXT NOT NULL,
        book_id TEXT,
        book_name TEXT,
        chapter INTEGER,
        verse INTEGER,
        version TEXT DEFAULT 'acf',
        spark_text TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        desfecho_tipo TEXT,
        desfecho_texto TEXT,
        bloco_1_exegese TEXT,
        bloco_1_intencao_original TEXT,
        bloco_2_topicos TEXT,
        bloco_3_aplicacao TEXT,
        introducao TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sermons_user_id ON sermons(user_id);
      CREATE INDEX IF NOT EXISTS idx_sermons_updated_at ON sermons(updated_at DESC);

      CREATE TABLE IF NOT EXISTS preaching_logs (
        id TEXT PRIMARY KEY,
        sermon_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        church_name TEXT NOT NULL,
        city TEXT NOT NULL,
        preached_at TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (sermon_id) REFERENCES sermons(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_preaching_logs_user_church ON preaching_logs(user_id, church_name);
    `);
    schemaInitialized = true;
  } catch (err) {
    console.error("[HomileticWorker] Erro ao garantir schema:", err);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 2. Health check & Root info
    if (url.pathname === "/health" || url.pathname === "/" || url.pathname === "") {
      return jsonResponse({
        status: "ok",
        service: "biblia-vive-homiletic-worker",
        timestamp: new Date().toISOString(),
        endpoints: [
          "/health",
          "/api/sermons",
          "/api/sermons/:id",
          "/api/sermons/:id/preaching-logs",
          "/api/preaching-logs",
        ],
      });
    }

    // 3. Autenticação unificada via Supabase JWT
    const authHeader = request.headers.get("Authorization");
    let userId = extractUserIdFromJwt(authHeader);

    // Se estiver em desenvolvimento local ou sem sessão logada no navegador de testes
    if (!userId) {
      const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (isLocal) {
        userId = "dev_local_user";
      } else {
        return jsonResponse({ error: "Unauthorized: Token JWT inválido ou ausente" }, 401);
      }
    }

    // Auto-garantir que as tabelas D1 existem (idempotente)
    if (env.DB) {
      await ensureSchema(env.DB);
    }

    const path = url.pathname;

    try {
      // POST /api/sermons — Cria novo sermão
      if (request.method === "POST" && path === "/api/sermons") {
        const body = (await request.json()) as any;
        const sermonId = body.id || `sermon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const now = new Date().toISOString();

        await env.DB.prepare(
          `INSERT INTO sermons (
            id, user_id, inspiration_note_id, title, book_id, book_name,
            chapter, verse, version, spark_text, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            sermonId,
            userId,
            body.inspirationNoteId || null,
            body.title || "Novo Sermão",
            body.bookId || null,
            body.bookName || null,
            body.chapter || null,
            body.verse || null,
            body.version || "acf",
            body.sparkText || null,
            "draft",
            now,
            now
          )
          .run();

        const created = await env.DB.prepare("SELECT * FROM sermons WHERE id = ?").bind(sermonId).first();
        return jsonResponse({ sermon: formatSermonRow(created) }, 201);
      }

      // GET /api/sermons — Lista sermões do usuário
      if (request.method === "GET" && path === "/api/sermons") {
        const rows = await env.DB.prepare(
          "SELECT * FROM sermons WHERE user_id = ? ORDER BY updated_at DESC"
        )
          .bind(userId)
          .all();

        return jsonResponse({ sermons: (rows.results || []).map(formatSermonRow) });
      }

      // Match /api/sermons/:id
      const sermonMatch = path.match(/^\/api\/sermons\/([^/]+)$/);
      if (sermonMatch) {
        const sermonId = sermonMatch[1];

        // GET /api/sermons/:id
        if (request.method === "GET") {
          const row = await env.DB.prepare(
            "SELECT * FROM sermons WHERE id = ?"
          )
            .bind(sermonId)
            .first();

          if (!row) {
            return jsonResponse({ error: "Sermão não encontrado" }, 404);
          }
          return jsonResponse({ sermon: formatSermonRow(row) });
        }

        // PUT /api/sermons/:id
        if (request.method === "PUT") {
          const body = (await request.json()) as any;
          const now = new Date().toISOString();

          // Verifica se o sermão já existe no D1
          const existing = await env.DB.prepare(
            "SELECT id FROM sermons WHERE id = ?"
          )
            .bind(sermonId)
            .first();

          if (!existing) {
            // Upsert: rascunho originado offline em localStorage sendo sincronizado com D1
            await env.DB.prepare(
              `INSERT INTO sermons (
                id, user_id, inspiration_note_id, title, book_id, book_name,
                chapter, verse, version, spark_text, status,
                desfecho_tipo, desfecho_texto, bloco_1_exegese, bloco_1_intencao_original,
                bloco_2_topicos, bloco_3_aplicacao, introducao,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                sermonId,
                userId,
                body.inspirationNoteId || null,
                body.title || "Novo Sermão",
                body.bookId || null,
                body.bookName || null,
                body.chapter || null,
                body.verse || null,
                body.version || "acf",
                body.sparkText || null,
                body.status || "draft",
                body.desfechoTipo || null,
                body.desfechoTexto || null,
                body.bloco1Exegese || null,
                body.bloco1IntencaoOriginal || null,
                body.bloco2Topicos ? JSON.stringify(body.bloco2Topicos) : null,
                body.bloco3Aplicacao || null,
                body.introducao || null,
                body.createdAt || now,
                now
              )
              .run();
          } else {
            await env.DB.prepare(
              `UPDATE sermons SET
                title = COALESCE(?, title),
                desfecho_tipo = COALESCE(?, desfecho_tipo),
                desfecho_texto = COALESCE(?, desfecho_texto),
                bloco_1_exegese = COALESCE(?, bloco_1_exegese),
                bloco_1_intencao_original = COALESCE(?, bloco_1_intencao_original),
                bloco_2_topicos = COALESCE(?, bloco_2_topicos),
                bloco_3_aplicacao = COALESCE(?, bloco_3_aplicacao),
                introducao = COALESCE(?, introducao),
                status = COALESCE(?, status),
                updated_at = ?
              WHERE id = ?`
            )
              .bind(
                body.title ?? null,
                body.desfechoTipo ?? null,
                body.desfechoTexto ?? null,
                body.bloco1Exegese ?? null,
                body.bloco1IntencaoOriginal ?? null,
                body.bloco2Topicos ? JSON.stringify(body.bloco2Topicos) : null,
                body.bloco3Aplicacao ?? null,
                body.introducao ?? null,
                body.status ?? null,
                now,
                sermonId
              )
              .run();
          }

          const updated = await env.DB.prepare(
            "SELECT * FROM sermons WHERE id = ?"
          )
            .bind(sermonId)
            .first();

          return jsonResponse({ sermon: formatSermonRow(updated) });
        }
      }

      // Match /api/sermons/:id/preaching-logs
      const sermonLogsMatch = path.match(/^\/api\/sermons\/([^/]+)\/preaching-logs$/);
      if (sermonLogsMatch) {
        const sermonId = sermonLogsMatch[1];

        // POST /api/sermons/:id/preaching-logs
        if (request.method === "POST") {
          const body = (await request.json()) as any;
          const logId = body.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          const now = new Date().toISOString();

          await env.DB.prepare(
            `INSERT INTO preaching_logs (
              id, sermon_id, user_id, church_name, city, preached_at, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              logId,
              sermonId,
              userId,
              body.churchName || "",
              body.city || "",
              body.preachedAt || now.split("T")[0],
              body.notes || null,
              now
            )
            .run();

          const created = await env.DB.prepare(
            "SELECT * FROM preaching_logs WHERE id = ?"
          )
            .bind(logId)
            .first();

          return jsonResponse({ preachingLog: formatPreachingLogRow(created) }, 201);
        }

        // GET /api/sermons/:id/preaching-logs
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT * FROM preaching_logs WHERE sermon_id = ? AND user_id = ? ORDER BY preached_at DESC"
          )
            .bind(sermonId, userId)
            .all();

          return jsonResponse({
            preachingLogs: (rows.results || []).map(formatPreachingLogRow),
          });
        }
      }

      // GET /api/preaching-logs — Lista todos os registros de pregação do usuário
      if (request.method === "GET" && path === "/api/preaching-logs") {
        const rows = await env.DB.prepare(
          `SELECT p.*, s.title as sermon_title 
           FROM preaching_logs p 
           LEFT JOIN sermons s ON p.sermon_id = s.id 
           WHERE p.user_id = ? 
           ORDER BY p.preached_at DESC`
        )
          .bind(userId)
          .all();

        return jsonResponse({
          preachingLogs: (rows.results || []).map(formatPreachingLogRow),
        });
      }

      return jsonResponse({ error: "Not Found" }, 404);
    } catch (err: any) {
      console.error("[HomileticWorker] Erro:", err);
      return jsonResponse({ error: "Internal Server Error", message: err?.message }, 500);
    }
  },
};

function formatSermonRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    inspirationNoteId: row.inspiration_note_id,
    title: row.title,
    bookId: row.book_id,
    bookName: row.book_name,
    chapter: row.chapter,
    verse: row.verse,
    version: row.version,
    sparkText: row.spark_text,
    status: row.status,
    desfechoTipo: row.desfecho_tipo,
    desfechoTexto: row.desfecho_texto,
    bloco1Exegese: row.bloco_1_exegese,
    bloco1IntencaoOriginal: row.bloco_1_intencao_original,
    bloco2Topicos: row.bloco_2_topicos ? JSON.parse(row.bloco_2_topicos) : [],
    bloco3Aplicacao: row.bloco_3_aplicacao,
    introducao: row.introducao,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatPreachingLogRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    sermonId: row.sermon_id,
    userId: row.user_id,
    churchName: row.church_name,
    city: row.city,
    preachedAt: row.preached_at,
    notes: row.notes,
    createdAt: row.created_at,
    sermonTitle: row.sermon_title,
  };
}
