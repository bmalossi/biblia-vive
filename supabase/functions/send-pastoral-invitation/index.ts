// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno&no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationBody {
  name: string;
  email: string;
  role?: string;
  requester_name?: string;
  requesterName?: string;
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
    const webBaseUrl = (Deno.env.get("WEB_BASE_URL") ?? "https://www.bibliavive.com.br").replace(/\/$/, "");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Autenticação obrigatória do Leitor
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

    // 2. Validação dos dados de entrada
    const body: InvitationBody = await req.json().catch(() => ({}));
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const role = body.role?.trim() || "pastor";
    const requesterName = (body.requester_name || body.requesterName)?.trim();

    if (!name || name.length < 2) {
      return new Response(
        JSON.stringify({ error: "O nome do contato pastoral é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Informe um endereço de e-mail válido para o contato." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!requesterName || requesterName.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Informe "Como seu contato deve te chamar" para que ele reconheça sua mensagem.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Gerar token criptográfico único descartável com expiração de 48 horas (ADR 0002)
    const rawUuid1 = crypto.randomUUID().replace(/-/g, "");
    const rawUuid2 = crypto.randomUUID().replace(/-/g, "");
    const confirmationToken = `${rawUuid1}${rawUuid2}`;
    const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 4. Revogar contatos pendentes ou ativos anteriores deste usuário
    await supabase
      .from("pastoral_contacts")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .in("status", ["pending", "active"]);

    // 5. Inserir novo contato no banco
    const { data: newContact, error: insertError } = await supabase
      .from("pastoral_contacts")
      .insert({
        user_id: user.id,
        name,
        email,
        role,
        requester_name: requesterName,
        status: "pending",
        confirmation_token: confirmationToken,
        token_expires_at: tokenExpiresAt,
      })
      .select()
      .single();

    if (insertError || !newContact) {
      console.error("[send-pastoral-invitation] Erro ao salvar contato:", insertError);
      return new Response(
        JSON.stringify({ error: "Falha ao registrar contato no banco de dados." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Montar e-mail pastoral sóbrio e discreto via Resend (Zero leaks)
    const confirmUrl = `${webBaseUrl}/atalaia/confirmar?token=${confirmationToken}`;
    const subject = `[Bíblia Vive] ${requesterName} indicou você como Contato de Cuidado`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Convite de Cuidado Pastoral — Atalaia</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0E0D11; color: #EFECE6; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #18171D; border: 1px solid #2B2836; border-radius: 12px; padding: 36px 32px;">
    <div style="font-size: 11px; letter-spacing: 2px; color: #E7B075; text-transform: uppercase; margin-bottom: 12px; font-weight: 600;">
      BÍBLIA VIVE · ATALAIA
    </div>
    <h1 style="font-size: 22px; font-weight: 600; color: #F7F5F0; margin: 0 0 20px 0; line-height: 1.4;">
      Convite de Cuidado Pastoral
    </h1>
    <p style="font-size: 15px; line-height: 1.6; color: #CBC7BD; margin: 0 0 16px 0;">
      Olá, <strong>${name}</strong>.
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #CBC7BD; margin: 0 0 20px 0;">
      <strong>${requesterName}</strong> indicou você como pessoa de confiança e porto seguro de oração no aplicativo Memorial.
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
        O Memorial é o espaço secreto onde o leitor registra orações e reflexões íntimas diante de Deus.
        Você <strong>nunca terá acesso às anotações</strong> ou ao conteúdo das memórias do leitor.
        Seu papel é exclusivamente espiritual: ser um porto seguro para orar e enviar uma palavra de afeto caso ele solicite ou precise de aproximação.
      </p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #CBC7BD; margin: 0 0 28px 0;">
      Para confirmar ou declinar sua disponibilidade neste papel pastoral, clique no botão abaixo diretamente em seu navegador (não é necessário baixar o aplicativo):
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmUrl}" style="background-color: #E7B075; color: #121116; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
        Responder ao Convite de Cuidado
      </a>
    </div>

    <p style="font-size: 12px; color: #726E7E; text-align: center; margin: 24px 0 0 0;">
      Este link é seguro e válido por 48 horas.<br/>
      Caso não conheça a pessoa ou não possa assumir este compromisso de oração no momento, você pode declinar respeitosamente através do link.
    </p>
  </div>
</body>
</html>
    `.trim();

    let emailSent = false;
    let emailError: string | null = null;

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
            to: [email],
            subject,
            html: htmlBody,
          }),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          console.warn("[send-pastoral-invitation] Resend error:", errText);
          emailError = errText;
        } else {
          emailSent = true;
        }
      } catch (err: any) {
        console.warn("[send-pastoral-invitation] Erro no envio Resend:", err);
        emailError = err.message;
      }
    } else {
      console.log("[send-pastoral-invitation] Modo simulação (RESEND_API_KEY não configurada):", {
        to: email,
        confirmUrl,
      });
      emailSent = true;
    }

    // Sanitizar retorno sem expor dados desnecessários
    const sanitizedContact = {
      id: newContact.id,
      name: newContact.name,
      email: newContact.email,
      role: newContact.role,
      requester_name: newContact.requester_name,
      status: newContact.status,
      token_expires_at: newContact.token_expires_at,
      created_at: newContact.created_at,
    };

    return new Response(
      JSON.stringify({
        success: true,
        contact: sanitizedContact,
        email_sent: emailSent,
        warning: emailError ? "Convite gerado, mas houve atraso no envio do e-mail." : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-pastoral-invitation] Erro fatal:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
