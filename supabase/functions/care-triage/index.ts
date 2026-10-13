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
  is_answered?: boolean;
  bible_ref?: { display?: string; book?: string };
  mode?: string;
}

type PastoralPillarChoice =
  | "CRISIS"
  | "THANKSGIVING"
  | "THEOLOGICAL_QUERY"
  | "ANSWERED_PRAYER"
  | "NEUTRAL_NOTE";

// Padrões de emergência extrema (ideação de morte/suicídio explícita).
// Utilizado apenas como safety-net caso os motores de IA estejam indisponíveis.
const EMERGENCY_CRISIS_PATTERNS = [
  /vontade de morrer/i,
  /quer(o|ia) morrer/i,
  /preferia morrer/i,
  /tirar a (pr[óo]pria )?vida/i,
  /tirar minha vida/i,
  /acabar com a minha vida/i,
  /suic[íi]d(io|a)/i,
  /desistir de viver/i,
  /desistir da vida/i,
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

    // 2. Extração transitória do payload
    const body: TriageRequestBody = await req.json().catch(() => ({ text: "" }));
    const text = (body.text || "").trim();
    const platform = body.platform || "android";

    if (!text || text.length < 5) {
      return new Response(
        JSON.stringify({
          eligible_for_care_prompt: false,
          pastoral_intent: null,
          confidence: 0.0,
          reason: "Texto insuficiente para classificação.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let isEligible = false;
    let pastoralIntent: "CRISIS" | "THANKSGIVING" | "THEOLOGICAL_QUERY" | "ANSWERED_PRAYER" | null = null;
    let intentConfidence = 0.0;
    let intentReason = "Classificação contextual efêmera JEV.";
    let evaluatedByAi = false;

    const isAdmin =
      (user?.app_metadata as any)?.role === "admin" ||
      user?.email?.toLowerCase().trim() === "contato@automab.dev";

    // ── Determinações Explícitas Pré-IA ──────────────────────────────────────────

    // A. Marcação explícita de oração respondida pelo usuário
    if (body.is_answered === true) {
      pastoralIntent = "ANSWERED_PRAYER";
      intentConfidence = 0.99;
      intentReason = "Oração explicitamente marcada como respondida pelo usuário.";
    }

    // B. Comandos explícitos de teste para Administrador
    if (isAdmin) {
      if (/#teste-?crise/i.test(text)) {
        isEligible = true;
        pastoralIntent = "CRISIS";
        intentConfidence = 0.99;
        intentReason = "Teste de Crise (Administrador via #teste-crise).";
      } else if (/#teste-?gracas/i.test(text)) {
        isEligible = false;
        pastoralIntent = "THANKSGIVING";
        intentConfidence = 0.99;
        intentReason = "Teste de Ação de Graças (Administrador via #teste-gracas).";
      } else if (/#teste-?estudo/i.test(text)) {
        isEligible = false;
        pastoralIntent = "THEOLOGICAL_QUERY";
        intentConfidence = 0.99;
        intentReason = "Teste de Estudo Bíblico (Administrador via #teste-estudo).";
      }
    }

    // ── 3. Classificação Semântica Contextual TypeSafe JEV (Choice) ───────────────
    if (!pastoralIntent && typesafeApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const jevResponse = await fetch("https://api.typesafe.ai/v1/systemone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${typesafeApiKey}`,
          },
          body: JSON.stringify({
            model: "jev-latest",
            state: `[RELATO CONFIDENCIAL DO LEITOR]\n"""\n${text.slice(0, 3000)}\n"""`,
            questions: {
              pastoral_intent: {
                type: "choice",
                instructions:
                  "Qual é a intenção pastoral e natureza predominante deste relato pessoal do leitor?",
                criteria: {
                  CRISIS:
                    "O AUTOR do relato descreve, em primeira pessoa, sofrimento agudo atual, dor emocional insuportável, desespero pessoal, solidão extrema, vontade de desistir ou clamor por socorro. Descarte menções a sofrimento de terceiros, sermões anotados ou críticas eclesiológicas.",
                  THANKSGIVING:
                    "O autor expressa gratidão, celebração, bênção recebida, conquista, nova oportunidade de emprego/trabalho, vitória, milagre ou testemunho do agir de Deus na sua vida.",
                  THEOLOGICAL_QUERY:
                    "Dúvida sincera sobre fé, estudo bíblico profundo, reflexão apologética ou dúvida exegética/hermenêutica sobre o sentido de uma passagem bíblica.",
                  ANSWERED_PRAYER:
                    "Celebração específica de uma oração respondida por Deus, cumprimento de clamor ou promessa que havia sido apresentada em oração.",
                  NEUTRAL_NOTE:
                    "Anotação de sermão ou pregação, estudo sereno sem dúvida pessoal, crítica/desabafo sobre liderança ou igreja, reflexão teológica geral sem crise pessoal nem testemunho de vitória.",
                },
              },
            },
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (jevResponse.ok) {
          const jevData = await jevResponse.json();
          const answers = jevData?.answers || jevData?.results || jevData;
          const qChoice = answers?.pastoral_intent;

          if (qChoice && qChoice.choice) {
            const chosen = qChoice.choice as PastoralPillarChoice;
            const conf = typeof qChoice.confidence === "number" ? qChoice.confidence : 0.85;
            evaluatedByAi = true;

            // Confidence-Gated Routing (TypeSafe pattern): threshold >= 0.70
            if (chosen !== "NEUTRAL_NOTE" && conf >= 0.70) {
              pastoralIntent = chosen;
              intentConfidence = conf;
              intentReason = `Classificado contextualmente como ${chosen} pelo motor JEV (TypeSafe AI, confiança: ${(conf * 100).toFixed(0)}%).`;
              if (chosen === "CRISIS") {
                isEligible = true;
              }
            } else {
              // NEUTRAL_NOTE ou confiança abaixo de 0.70: rota segura/silenciosa
              pastoralIntent = null;
              intentConfidence = conf;
              intentReason = "Relato classificado como reflexão neutra/estudo pelo motor JEV.";
              isEligible = false;
            }

            console.log(
              `[care-triage] JEV Choice avaliado: ${chosen} (confiança: ${conf.toFixed(2)}) -> Elegível para crise: ${isEligible}`
            );
          }
        } else {
          const errText = await jevResponse.text().catch(() => "");
          console.warn("[care-triage] TypeSafe JEV erro HTTP:", jevResponse.status, errText);
        }
      } catch (jevErr) {
        console.warn("[care-triage] Exceção ao consultar TypeSafe JEV:", jevErr);
      }
    }

    // ── 4. Fallback OpenAI gpt-4o-mini (se JEV não respondeu) ─────────────────────
    if (!evaluatedByAi && !pastoralIntent && openAiApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Você é o classificador discreto e ético dos 4 Pilares de Cuidado Pastoral para o ecossistema Bíblia Vive/Memorial.\n" +
                  "Avalie o contexto completo do relato e classifique em uma das 5 categorias:\n" +
                  "- \"CRISIS\": O AUTOR em primeira pessoa está em dor aguda, desespero pessoal, solidão sufocante ou ideação de desistência. (Ignore críticas à igreja ou sofrimento de terceiros).\n" +
                  "- \"THANKSGIVING\": Testemunho de vitória, bênção recebida, conquista, emprego, livramento ou gratidão a Deus.\n" +
                  "- \"THEOLOGICAL_QUERY\": Dúvida de estudo bíblico, pergunta hermenêutica ou reflexão exegética sincera.\n" +
                  "- \"ANSWERED_PRAYER\": Oração ou clamor atendido por Deus.\n" +
                  "- \"NEUTRAL_NOTE\": Anotação de sermão, estudo sereno, crítica sobre liderança/igreja, desabafo eclesiológico geral.\n\n" +
                  "Retorne ESTRITAMENTE um JSON no formato:\n" +
                  "{\"intent\": \"CRISIS\"|\"THANKSGIVING\"|\"THEOLOGICAL_QUERY\"|\"ANSWERED_PRAYER\"|\"NEUTRAL_NOTE\", \"confidence\": number}\n" +
                  "NÃO inclua diagnósticos, rótulos clínicos ou resumos.",
              },
              {
                role: "user",
                content: `Avalie o seguinte relato de forma confidencial:\n"""\n${text}\n"""`,
              },
            ],
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const parsed = JSON.parse(aiData?.choices?.[0]?.message?.content || "{}");
          const intent = parsed.intent as PastoralPillarChoice;
          const conf = typeof parsed.confidence === "number" ? parsed.confidence : 0.85;
          evaluatedByAi = true;

          if (intent && intent !== "NEUTRAL_NOTE" && conf >= 0.70) {
            pastoralIntent = intent;
            intentConfidence = conf;
            intentReason = `Classificado contextualmente como ${intent} via gpt-4o-mini (confiança: ${(conf * 100).toFixed(0)}%).`;
            if (intent === "CRISIS") {
              isEligible = true;
            }
          } else {
            pastoralIntent = null;
            intentConfidence = conf;
            intentReason = "Classificado como neutro via gpt-4o-mini.";
            isEligible = false;
          }

          console.log(`[care-triage] OpenAI gpt-4o-mini avaliado: ${intent} (confiança: ${conf.toFixed(2)})`);
        }
      } catch (aiErr) {
        console.warn("[care-triage] Erro na avaliação OpenAI:", aiErr);
      }
    }

    // ── 5. Rede de Segurança Extrema (Apenas se nenhuma IA respondeu) ─────────────
    if (!evaluatedByAi && !pastoralIntent) {
      const hasEmergencyCrisis = EMERGENCY_CRISIS_PATTERNS.some((pat) => pat.test(text));
      if (hasEmergencyCrisis) {
        isEligible = true;
        pastoralIntent = "CRISIS";
        intentConfidence = 0.95;
        intentReason = "Padrão de emergência de segurança detectado em fallback offline.";
        console.warn("[care-triage] Padrão de emergência extrema acionado sem IA.");
      }
    }

    // ── 6. Telemetria Cega (ADR 0001) ─────────────────────────────────────────────
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

    // ── 7. Resposta Estruturada ──────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        eligible_for_care_prompt: isEligible,
        pastoral_intent: pastoralIntent,
        confidence: intentConfidence,
        reason: intentReason,
        biblical_reference: body.bible_ref?.display || body.bible_ref?.book,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[care-triage] Erro fatal:", error);
    return new Response(
      JSON.stringify({
        eligible_for_care_prompt: false,
        pastoral_intent: null,
        confidence: 0.0,
        reason: "Erro interno no processamento da triagem.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
