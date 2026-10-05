import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

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
    const typesafeApiKey = (Deno.env.get("TYPESAFE_API_KEY") ?? "").trim();
    const openAiApiKey = (Deno.env.get("OPENAI_API_KEY") ?? "").trim();

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
    const isAdmin = (user?.app_metadata as any)?.role === "admin" || user?.email?.toLowerCase().trim() === "contato@automab.dev";
    const hasDistressPattern = DISTRESS_PATTERNS.some((pat) => pat.test(text));

    // 1. Rede de Segurança Imediata (Heurística de Padrões Explícitos)
    if (hasDistressPattern) {
      isEligible = true;
      console.log(`[care-triage] Padrão explícito de sofrimento/desespero reconhecido no texto.`);
    }

    // 2. Modo Administrador: Facilita testes imediatos para a conta admin
    if (isAdmin && (hasDistressPattern || /teste|desespero|angustia|socorro|dor|ajuda|tristeza|vazio/i.test(text))) {
      isEligible = true;
      console.log(`[care-triage] Administrador em teste detectado (${user.email}) -> elegível ativado.`);
    }

    // 3. Avaliação semântica via TypeSafe JEV (System One) se ainda não elegível
    if (!isEligible && typesafeApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const jevResponse = await fetch("https://api.typesafe.ai/v1/systemone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${typesafeApiKey}`,
          },
          body: JSON.stringify({
            model: "jev-latest",
            state: `[RELATO CONFIDENCIAL DO LEITOR]\n"""\n${text.slice(0, 3000)}\n"""`,
            questions: {
              indicates_deep_distress: {
                type: "noul",
                instructions:
                  "O relato pessoal do leitor expressa dor profunda, angústia aguda, desespero, solidão sufocante, esgotamento espiritual ou luto inconsolável, onde acolhimento ou apoio pastoral fraterno seria humanamente benéfico?",
                criteria: {
                  true: "O relato expressa desespero, aflição, sofrimento agudo, angústia, solidão, cansaço espiritual ou busca por socorro.",
                  false: "O relato é sereno, alegre, reflexivo, doutrinário ou sem sinais de sofrimento ou angústia.",
                },
              },
            },
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (jevResponse.ok) {
          const jevData = await jevResponse.json();
          const answers = jevData?.answers || jevData?.results || jevData;
          const qDistress = answers?.indicates_deep_distress;

          let distressProb = 0;
          if (qDistress) {
            if (typeof qDistress.noul === "number") distressProb = qDistress.noul;
            else if (typeof qDistress.probability === "number") distressProb = qDistress.probability;
            else if (typeof qDistress.answer === "number") distressProb = qDistress.answer;
            else if (qDistress.answer === true) distressProb = 1;
          }

          // Calibração do limiar Noul: probabilidade >= 0.50
          if (distressProb >= 0.50) {
            isEligible = true;
          }
          console.log(`[care-triage] TypeSafe JEV avaliado. Probabilidade: ${distressProb.toFixed(3)} -> Elegível: ${isEligible}`);
        } else {
          const errText = await jevResponse.text().catch(() => "");
          console.warn("[care-triage] TypeSafe JEV erro HTTP:", jevResponse.status, errText);
        }
      } catch (jevErr) {
        console.warn("[care-triage] Exceção ao consultar TypeSafe JEV:", jevErr);
      }
    }

    // 4. Fallback OpenAI gpt-4o-mini (se ainda não elegível e JEV não marcou)
    if (!isEligible && openAiApiKey) {
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
          if (Boolean(parsed.eligible)) {
            isEligible = true;
          }
          console.log(`[care-triage] OpenAI gpt-4o-mini executado -> Elegível: ${isEligible}`);
        }
      } catch (aiErr) {
        console.warn("[care-triage] Erro na avaliação OpenAI:", aiErr);
      }
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
