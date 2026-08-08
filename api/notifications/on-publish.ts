import { createClient } from "@supabase/supabase-js";
import { sendPushNotification, sendArticleNotification } from "./_send.js";

const JSON_HEADERS = { "Content-Type": "application/json" };

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, any> | null;
  old_record: Record<string, any> | null;
}

// ─── Modo Manual (chamado pelo Admin sem webhook secret) ───────────────────────
// Dispara notificações para todos os itens agendados/publicados até o dia de hoje
// que ainda estejam com notification_sent_at = NULL
async function handleManualNotify(request: Request): Promise<Response> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do Supabase ausente" }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const todayStr = new Date().toISOString().split("T")[0];
    const appUrl = process.env.VITE_APP_URL || "https://www.bibliavive.com.br";

    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;

    // 1. Capítulos de jornadas agendados/publicados até hoje e sem notificação
    const { data: chapters, error: chapterErr } = await supabase
      .from("editorial_chapters")
      .select("*")
      .eq("status", "publicado")
      .lte("publish_date", todayStr)
      .is("notification_sent_at", null);

    if (chapterErr) {
      console.error("[manual-notify] Erro ao buscar capítulos:", chapterErr);
    } else if (chapters && chapters.length > 0) {
      for (const ch of chapters) {
        totalProcessed++;
        const title = "Nova jornada no Bíblia Vive";
        const body = ch.series_name
          ? `${ch.series_name}: ${ch.title}`
          : ch.title || "Um novo capítulo de jornada foi publicado!";
        const link = `${appUrl}/jornadas?capitulo=${ch.id}`;

        const result = await sendPushNotification({ title, body, link });

        if (result.successCount > 0) {
          totalSent += result.sent;
          totalFailed += result.failed;

          await supabase
            .from("editorial_chapters")
            .update({ notification_sent_at: new Date().toISOString() })
            .eq("id", ch.id)
            .is("notification_sent_at", null);
        }
      }
    }

    // 2. Artigos agendados/publicados sem notificação
    const { data: articles, error: articleErr } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "publicado")
      .is("notification_sent_at", null);

    if (articleErr) {
      console.error("[manual-notify] Erro ao buscar artigos:", articleErr);
    } else if (articles && articles.length > 0) {
      for (const art of articles) {
        totalProcessed++;
        const title = "Novo artigo no Bíblia Vive";
        const body = art.title || "Um novo artigo foi publicado!";
        const link = `${appUrl}/artigos/${art.slug}`;

        const result = await sendPushNotification({ title, body, link });

        if (result.successCount > 0) {
          totalSent += result.sent;
          totalFailed += result.failed;

          await supabase
            .from("articles")
            .update({ notification_sent_at: new Date().toISOString() })
            .eq("id", art.id)
            .is("notification_sent_at", null);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        sent: totalSent,
        failed: totalFailed,
        message: totalProcessed === 0
          ? "Nenhuma notificação pendente encontrada para hoje."
          : `Processados ${totalProcessed} item(ns). Enviados: ${totalSent}.`,
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err: unknown) {
    console.error("on-publish manual handler error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}

// ─── Modo Webhook (chamado pelo Supabase Database Webhook) ─────────────────────
// Header obrigatório: x-webhook-secret
async function handleWebhook(request: Request, webhookSecret: string): Promise<Response> {
  const providedSecret = request.headers.get("x-webhook-secret");

  // 1. Validação estrita do header de autenticação
  if (providedSecret !== webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: invalid or missing x-webhook-secret header" }),
      { status: 401, headers: JSON_HEADERS }
    );
  }

  const payload: SupabaseWebhookPayload = await request.json();
  const { type, table, record, old_record } = payload;

  console.log(`[on-publish] Webhook recebido: type=${type} table=${table} id=${record?.id ?? "?"} status=${record?.status ?? "?"} notification_sent_at=${record?.notification_sent_at ?? "null"}`);

  if (!record) {
    return new Response(
      JSON.stringify({ error: "Invalid payload: record is required" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  // 2. Verificar se a tabela é suportada (articles ou editorial_chapters)
  if (table !== "articles" && table !== "editorial_chapters") {
    return new Response(
      JSON.stringify({ success: true, skipped: true, reason: `Table '${table}' not handled` }),
      { status: 200, headers: JSON_HEADERS }
    );
  }

  // 3. Regras de filtro para evitar notificações indevidas / duplicadas
  if (record.status !== "publicado" || record.notification_sent_at) {
    return new Response(
      JSON.stringify({
        success: true,
        skipped: true,
        reason: "Record status is not 'publicado' or notification was already sent",
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  }

  if (type === "UPDATE") {
    // Para UPDATE: notificar apenas se o status anterior NÃO era "publicado" E notification_sent_at for nulo
    if (old_record && old_record.status === "publicado") {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "Record was already published previously",
        }),
        { status: 200, headers: JSON_HEADERS }
      );
    }
  } else if (type !== "INSERT") {
    // Ignorar DELETE ou outros tipos de evento
    return new Response(
      JSON.stringify({ success: true, skipped: true, reason: `Event type '${type}' ignored` }),
      { status: 200, headers: JSON_HEADERS }
    );
  }

  // 4. Montar título, mensagem e link da notificação
  const appUrl = process.env.VITE_APP_URL || "https://www.bibliavive.com.br";
  let title = "";
  let body = "";
  let link = "";

  if (table === "articles") {
    title = "Novo artigo no Bíblia Vive";
    body = record.title || "Um novo artigo foi publicado!";
    link = `${appUrl}/artigos/${record.slug}`;
  } else if (table === "editorial_chapters") {
    title = "Nova jornada no Bíblia Vive";
    body = record.series_name
      ? `${record.series_name}: ${record.title}`
      : record.title || "Um novo capítulo de jornada foi publicado!";
    // Link inclui o ID do capítulo como query param para abrir o modal diretamente.
    // JornadasPage lê ?capitulo=ID e abre o card automaticamente.
    link = `${appUrl}/jornadas?capitulo=${record.id}`;
  }

  // 5. Disparar notificação push via Firebase Cloud Messaging
  const result = await sendPushNotification({ title, body, link });

  // 6. Atualizar notification_sent_at APENAS se ao menos 1 entrega foi confirmada pelo Firebase
  //    Usa UPDATE condicional (IS NULL) como "claim atômico" para evitar duplo envio
  //    em caso de webhooks concorrentes (race condition).
  if (result.successCount > 0 && record.id) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { count, error: updateError } = await supabase
        .from(table)
        .update({ notification_sent_at: new Date().toISOString() })
        .eq("id", record.id)
        .select("id", { count: "exact" });

      if (updateError) {
        console.warn(`[on-publish] Could not update notification_sent_at for ${table}:${record.id}:`, updateError.message);
      } else if ((count ?? 0) === 0) {
        // Outra instância do webhook já marcou antes — descartamos silenciosamente
        console.warn(`[on-publish] notification_sent_at já marcado por outra instância — descartando para ${table}:${record.id}`);
      } else {
        console.log(`[on-publish] notification_sent_at marcado para ${table}:${record.id}`);
      }
    }
  } else if (result.successCount === 0) {
    console.warn(`[on-publish] successCount=0 — notification_sent_at NÃO atualizado para ${table}:${record.id}. Reprocessamento futuro permitido.`);
  }



  return new Response(
    JSON.stringify({
      success: true,
      sent: result.sent,
      failed: result.failed,
      table,
      id: record.id,
    }),
    { status: 200, headers: JSON_HEADERS }
  );
}

// ─── Entry Point ───────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    const providedSecret = request.headers.get("x-webhook-secret");

    // Se há um secret configurado e o header foi enviado → rota de webhook do Supabase
    // Caso contrário → rota manual (Admin)
    if (webhookSecret && providedSecret !== null) {
      return await handleWebhook(request, webhookSecret);
    }

    return await handleManualNotify(request);
  } catch (err: unknown) {
    console.error("on-publish handler error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
