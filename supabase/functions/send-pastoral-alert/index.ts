import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequestBody {
  trigger_type: "care_signal" | "explicit_help";
  note_id?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Atalaia <atalaia@bibliavive.com.br>";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor ausente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Autenticação do Leitor
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Extração dos parâmetros do alerta
    const body: AlertRequestBody = await req.json().catch(() => ({ trigger_type: "care_signal" }));
    const triggerType = body.trigger_type;
    const noteId = body.note_id || null;

    if (triggerType !== "care_signal" && triggerType !== "explicit_help") {
      return new Response(
        JSON.stringify({ error: "trigger_type inválido. Utilize care_signal ou explicit_help." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verificar se o Leitor possui Contato de Cuidado ATIVO
    const { data: contact, error: contactError } = await supabase
      .from("pastoral_contacts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({
          error: "no_active_contact",
          message: "Você não possui um Contato de Cuidado ativo no momento.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Buscar histórico de alertas para checar Rate Limiting (ADR 0004)
    const isAdmin = (user?.app_metadata as any)?.role === "admin" || user?.email === "contato@automab.dev";

    if (!isAdmin) {
      const { data: previousAlerts, error: alertsError } = await supabase
        .from("pastoral_alerts")
        .select("id, trigger_type, note_id, sent_at, delivery_status")
        .eq("user_id", user.id)
        .in("delivery_status", ["delivered", "pending"])
        .order("sent_at", { ascending: false });

      const nowMs = Date.now();
      const alerts = previousAlerts || [];

      // Checagem de Rate Limiting
      if (triggerType === "explicit_help") {
        const lastExplicit = alerts.find((a: any) => a.trigger_type === "explicit_help");
        if (lastExplicit) {
          const diffMs = nowMs - new Date(lastExplicit.sent_at).getTime();
          const limit24hMs = 24 * 60 * 60 * 1000;
          if (diffMs < limit24hMs) {
            const remainingHours = Math.ceil((limit24hMs - diffMs) / (1000 * 60 * 60));
            return new Response(
              JSON.stringify({
                error: "rate_limited",
                reason: "explicit_help_24h",
                remaining_hours: remainingHours,
                message: "Você já enviou um pedido de ajuda hoje. Seu contato foi notificado e pode entrar em contato a qualquer momento.",
              }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } else if (triggerType === "care_signal") {
        // Trava 7 dias mesmo registro
        if (noteId) {
          const sameNoteAlert = alerts.find(
            (a: any) => a.trigger_type === "care_signal" && a.note_id === noteId
          );
          if (sameNoteAlert) {
            const diffMs = nowMs - new Date(sameNoteAlert.sent_at).getTime();
            const limit7dMs = 7 * 24 * 60 * 60 * 1000;
            if (diffMs < limit7dMs) {
              const remainingHours = Math.ceil((limit7dMs - diffMs) / (1000 * 60 * 60));
              return new Response(
                JSON.stringify({
                  error: "rate_limited",
                  reason: "same_note_7d",
                  remaining_hours: remainingHours,
                  message: "Um sinal de cuidado sobre este registro já foi enviado recentemente (cooldown de 7 dias).",
                }),
                { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }

        // Trava 48 horas registro distinto
        const lastCareSignal = alerts.find((a: any) => a.trigger_type === "care_signal");
        if (lastCareSignal) {
          const diffMs = nowMs - new Date(lastCareSignal.sent_at).getTime();
          const limit48hMs = 48 * 60 * 60 * 1000;
          if (diffMs < limit48hMs) {
            const remainingHours = Math.ceil((limit48hMs - diffMs) / (1000 * 60 * 60));
            return new Response(
              JSON.stringify({
                error: "rate_limited",
                reason: "distinct_note_48h",
                remaining_hours: remainingHours,
                message: "Um sinal de cuidado foi enviado nas últimas 48 horas. Aguarde a aproximação pastoral natural antes de um novo aviso.",
              }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    } else {
      console.log(`[send-pastoral-alert] Modo Administrador ativo para ${user.email}: Limites de 48h/7d ignorados.`);
    }

    // 5. Montar e-mail afetuoso e discreto (Zero text leaks)
    const isExplicit = triggerType === "explicit_help";
    const subject = isExplicit
      ? `[Bíblia Vive] Pedido de Conversa: ${contact.requester_name}`
      : `[Bíblia Vive] Lembrança Pastoral: ${contact.requester_name}`;

    const mainMessage = isExplicit
      ? `<strong>${contact.requester_name}</strong> fez um pedido direto de amparo através do aplicativo Memorial e solicitou ativamente uma conversa ou ligação com você.`
      : `<strong>${contact.requester_name}</strong> autorizou este aviso discreto para você. Ele está passando por dias pesados e expressou o desejo de ser lembrado em oração.`;

    const promptText = isExplicit
      ? `Recomendamos que você procure <strong>${contact.requester_name}</strong> com brevidade para uma conversa fraterna ou ligação, oferecendo sua presença pastoral.`
      : `Recomendamos puxar uma conversa casual e amigável hoje, sem mencionar relatórios técnicos ou sem transparecer qualquer alarme:
         <br/><br/>
         <em>"Olá, ${contact.requester_name}! Lembrei de você em oração hoje e queria saber como você está."</em>`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0E0D11; color: #EFECE6; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #18171D; border: 1px solid #2B2836; border-radius: 12px; padding: 36px 32px;">
    <div style="font-size: 11px; letter-spacing: 2px; color: #E7B075; text-transform: uppercase; margin-bottom: 12px; font-weight: 600;">
      BÍBLIA VIVE · ATALAIA
    </div>
    <h1 style="font-size: 20px; font-weight: 600; color: #F7F5F0; margin: 0 0 16px 0; line-height: 1.4;">
      ${isExplicit ? "Pedido Direto de Conversa Pastoral" : "Lembrete Afetuoso de Cuidado Pastoral"}
    </h1>
    <p style="font-size: 15px; line-height: 1.6; color: #CBC7BD; margin: 0 0 16px 0;">
      Olá, <strong>${contact.name}</strong>.
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #CBC7BD; margin: 0 0 20px 0;">
      ${mainMessage}
    </p>

    <div style="background-color: #141318; border: 1px solid #282531; border-radius: 8px; padding: 22px 24px; margin: 28px 0; text-align: center;">
      <div style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #D6A369; margin-bottom: 6px; font-weight: 700;">
        Pacto de Confidencialidade
      </div>
      <div style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; color: #F5F2EB; margin-bottom: 10px;">
        "O Memorial guarda. O Atalaia cuida."
      </div>
      <div style="width: 28px; height: 1px; background-color: #383446; margin: 0 auto 12px auto;"></div>
      <p style="font-size: 13px; line-height: 1.6; color: #9E988D; margin: 0; text-align: left;">
        Nenhuma palavra das reflexões íntimas dele foi compartilhada. O diário espiritual dele diante de Deus continua totalmente privado e inviolável.
      </p>
    </div>

    <div style="font-size: 14px; line-height: 1.6; color: #CBC7BD; margin: 0 0 24px 0;">
      ${promptText}
    </div>

    <p style="font-size: 12px; color: #726E7E; margin: 24px 0 0 0; text-align: center;">
      Você recebeu esta mensagem porque aceitou ser o Contato de Cuidado pastoral de ${contact.requester_name}.
    </p>
  </div>
</body>
</html>
    `.trim();

    let emailSent = false;
    let deliveryStatus = "delivered";

    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [contact.email],
            subject,
            html: htmlBody,
          }),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          console.warn("[send-pastoral-alert] Resend error:", errText);
          deliveryStatus = "failed";
        } else {
          emailSent = true;
          deliveryStatus = "delivered";
        }
      } catch (err: any) {
        console.warn("[send-pastoral-alert] Erro no envio Resend:", err);
        deliveryStatus = "failed";
      }
    } else {
      console.log("[send-pastoral-alert] Modo simulação (RESEND_API_KEY não configurada):", {
        to: contact.email,
        triggerType,
      });
      emailSent = true;
      deliveryStatus = "delivered";
    }

    // 6. Gravar auditoria técnica mínima em pastoral_alerts (Zero texto, zero memórias)
    const { data: newAlert, error: insertAlertError } = await supabase
      .from("pastoral_alerts")
      .insert({
        user_id: user.id,
        contact_id: contact.id,
        trigger_type: triggerType,
        note_id: noteId,
        delivery_status: deliveryStatus,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertAlertError) {
      console.error("[send-pastoral-alert] Erro ao gravar auditoria:", insertAlertError);
    }

    return new Response(
      JSON.stringify({
        success: deliveryStatus === "delivered",
        alert_id: newAlert?.id,
        delivery_status: deliveryStatus,
        email_sent: emailSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-pastoral-alert] Erro fatal:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
