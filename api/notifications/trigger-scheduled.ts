import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "./_send.js";

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function POST(request: Request) {
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

    // 1. Buscar capítulos de jornadas agendados/publicados até hoje e sem notificação
    const { data: chapters, error: chapterErr } = await supabase
      .from("editorial_chapters")
      .select("*")
      .eq("status", "publicado")
      .lte("publish_date", todayStr)
      .is("notification_sent_at", null);

    if (chapterErr) {
      console.error("[trigger-scheduled] Erro ao buscar capítulos:", chapterErr);
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

    // 2. Buscar artigos agendados/publicados sem notificação
    const { data: articles, error: articleErr } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "publicado")
      .is("notification_sent_at", null);

    if (articleErr) {
      console.error("[trigger-scheduled] Erro ao buscar artigos:", articleErr);
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
          : `Processados ${totalProcessed} item(ns). Envia dos: ${totalSent}.`,
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err: unknown) {
    console.error("trigger-scheduled error:", err);
    const message = err instanceof Error ? err.message : "Erro interno no servidor";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
