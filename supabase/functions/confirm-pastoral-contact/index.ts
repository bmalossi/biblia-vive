import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. GET: Consulta de informações do token para renderizar a página web
  if (req.method === "GET") {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: "missing_token", message: "Token de confirmação não fornecido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase.rpc("get_pastoral_invitation_info", {
      p_token: token,
    });

    if (error) {
      console.error("[confirm-pastoral-contact] Erro no RPC get_pastoral_invitation_info:", error);
      return new Response(
        JSON.stringify({ valid: false, error: "rpc_error", message: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. POST: Ação de aceitar ou declinar o convite
  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      const token = body.token?.trim();
      const action = body.action?.trim(); // 'accept' ou 'decline'

      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: "missing_token", message: "Token de confirmação é obrigatório." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!action || (action !== "accept" && action !== "decline")) {
        return new Response(
          JSON.stringify({ success: false, error: "invalid_action", message: "Ação inválida. Utilize 'accept' ou 'decline'." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase.rpc("confirm_pastoral_contact_by_token", {
        p_token: token,
        p_action: action,
      });

      if (error) {
        console.error("[confirm-pastoral-contact] Erro no RPC confirm_pastoral_contact_by_token:", error);
        return new Response(
          JSON.stringify({ success: false, error: "rpc_error", message: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const status = data?.success ? 200 : 400;
      return new Response(
        JSON.stringify(data),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      console.error("[confirm-pastoral-contact] Erro ao processar:", err);
      return new Response(
        JSON.stringify({ success: false, error: "server_error", message: err.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Method Not Allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
