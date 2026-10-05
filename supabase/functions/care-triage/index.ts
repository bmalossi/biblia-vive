// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno&no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriageRequestBody {
  text: string;
  category?: string;
  platform?: "android" | "ios" | "web";
}

// Padrões de ressonância de dor profunda e clamor por socorro (heurística complementar/fallback)
const DISTRESS_PATTERNS = [
  /n[ãa]o aguent(o|ei) mais/i,
  /quer(o|ia) sumir/i,
  /vontade de desistir/i,
  /vontade de morrer/i,
  /tirar a (pr[óo]pria )?vida/i,
  /acabar com tudo/i,
  /dor insuport[áa]vel/i,
  /ang[úu]stia profunda/i,
  /vazio sem fim/i,
  /desespero/i,
  /solid[ãa]o insuport[áa]vel/i,
  /ningu[ée]m se importa/i,
  /completamente sozinh[oa]/i,
  /perd(i|endo) as esperan[çc]as/i,
  /pedindo socorro/i,
  /socorro de deus/i,
  /sem for[çc]as para continuar/i,
];

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
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor ausente" }),
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

    // 2. Extração transitória do texto
    const body: TriageRequestBody = await req.json().catch(() => ({ text: "" }));
    const text = (body.text || "").trim();
    const platform = body.platform || "android";

    if (!text || text.length < 5) {
      return new Response(
        JSON.stringify({ eligible_for_care_prompt: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let isEligible = false;

    // 3. Avaliação semântica via OpenAI gpt-4o-mini (se chave configurada nos Secrets)
    if (openAiApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Você é um classificador discreto e ético de triagem de cuidado para o aplicativo Bíblia Vive/Memorial. " +
                  "Sua única função é identificar se o relato pessoal do leitor expressa dor profunda, angústia aguda, solidão sufocante, crise de desespero, esgotamento espiritual ou luto inconsolável, onde uma aproximação pastoral acolhedora ou canal de apoio (CVV) seria humanamente benéfica. " +
                  "Retorne ESTRITAMENTE um JSON no formato: {\"eligible\": boolean}. " +
                  "NÃO forneça explicações, diagnósticos, rótulos clínicos ou resumos.",
              },
              {
                role: "user",
                content: `Avalie o seguinte relato de forma efêmera e confidencial:\n"""\n${text}\n"""`,
              },
            ],
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const parsed = JSON.parse(aiData?.choices?.[0]?.message?.content || "{}");
          isEligible = Boolean(parsed.eligible);
        } else {
          // Fallback para heurística caso API de IA falhe
          isEligible = DISTRESS_PATTERNS.some((pat) => pat.test(text));
        }
      } catch (aiErr) {
        console.warn("[care-triage] Erro na avaliação por IA, aplicando fallback:", aiErr);
        isEligible = DISTRESS_PATTERNS.some((pat) => pat.test(text));
      }
    } else {
      // Sem chave externa nos Secrets: usa heurística linguística respeitosa
      isEligible = DISTRESS_PATTERNS.some((pat) => pat.test(text));
    }

    // 4. Se elegível e o leitor NÃO tem contato pastoral ativo, registrar Telemetria Cega (ADR 0001)
    if (isEligible) {
      try {
        const { data: activeContact } = await supabase
          .from("pastoral_contacts")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        const hasActiveContact = Boolean(activeContact);

        // Telemetria Cega: apenas quando desassistido de contato ativo
        if (!hasActiveContact) {
          await supabase.from("care_telemetry_events").insert({
            has_care_contact: false,
            platform,
            created_at: new Date().toISOString(),
          });
        }
      } catch (telemetryErr) {
        console.warn("[care-triage] Erro silencioso ao emitir telemetria cega:", telemetryErr);
      }
    }

    // 5. Retornar APENAS o booleano efêmero (INVARIANTE DE SEGURANÇA ABSOLUTA: zero texto, zero scores)
    return new Response(
      JSON.stringify({ eligible_for_care_prompt: isEligible }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[care-triage] Erro fatal:", error);
    return new Response(
      JSON.stringify({ eligible_for_care_prompt: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
