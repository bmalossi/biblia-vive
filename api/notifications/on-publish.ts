import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "./_send.js";

const JSON_HEADERS = { "Content-Type": "application/json" };

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, any> | null;
  old_record: Record<string, any> | null;
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    const providedSecret = request.headers.get("x-webhook-secret");

    // 1. Validação estrita do header de autenticação
    if (!webhookSecret || providedSecret !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid or missing x-webhook-secret header" }),
        { status: 401, headers: JSON_HEADERS }
      );
    }

    const payload: SupabaseWebhookPayload = await request.json();
    const { type, table, record, old_record } = payload;

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
    // O status deve ser "publicado" e notification_sent_at deve ser nulo
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
      // Para UPDATE: notificar apenas se o status anterior NÃO era "publicado" AND notification_sent_at for nulo
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
      link =
        record.book_slug && record.chapter
          ? `${appUrl}/nvi/${record.book_slug.toLowerCase()}/${record.chapter}`
          : `${appUrl}/jornadas`;
    }

    // 5. Disparar notificação push via Firebase Cloud Messaging
    const result = await sendPushNotification({ title, body, link });

    // 6. Atualizar notification_sent_at APÓS confirmação de envio no Firebase (se houver ID do registro)
    if (record.id) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error: updateError } = await supabase
          .from(table)
          .update({ notification_sent_at: new Date().toISOString() })
          .eq("id", record.id);

        if (updateError) {
          console.warn(`Could not update notification_sent_at for ${table}:${record.id}:`, updateError.message);
        }
      }
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
  } catch (err: unknown) {
    console.error("on-publish webhook handler error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
