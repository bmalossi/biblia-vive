import { createClient } from "@supabase/supabase-js";

interface NotePayload {
  id: string;
  type: string;
  title: string | null;
  content: string;
  bookName?: string;
  chapter?: number;
  verse?: number | null;
}

interface RequestBody {
  chapterText: string;
  chapterRef: string;
  bookId: string;
  chapter: number;
  notes: NotePayload[];
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    const typesafeApiKey = process.env.TYPESAFE_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Se a chave do TypeSafe AI não estiver configurada no servidor, retorne silêncio seguro
    if (!typesafeApiKey) {
      return new Response(
        JSON.stringify({ thread: null, reason: "typesafe_not_configured" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const body: RequestBody = await req.json().catch(() => ({}));
    const { chapterText, chapterRef, notes } = body;

    if (!chapterText || !notes || !Array.isArray(notes) || notes.length === 0) {
      return new Response(
        JSON.stringify({ thread: null, reason: "insufficient_data" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Consulta configurações globais em app_config se o Supabase estiver disponível
    if (supabaseUrl && supabaseServiceRoleKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      const { data: configs } = await supabase
        .from("app_config")
        .select("key, value")
        .in("key", ["scripture_thread_enabled", "scripture_thread_require_pro"]);

      const configMap = new Map((configs || []).map((r) => [r.key, r.value]));

      // 1. Verificação da flag de ativação global
      if (configMap.has("scripture_thread_enabled") && configMap.get("scripture_thread_enabled") === false) {
        return new Response(
          JSON.stringify({ thread: null, disabled: true }),
          { status: 200, headers: jsonHeaders }
        );
      }

      // 2. Verificação de exigência de usuário PRO/Templo
      const requirePro = Boolean(configMap.get("scripture_thread_require_pro"));
      if (requirePro) {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ thread: null, reason: "pro_required" }),
            { status: 200, headers: jsonHeaders }
          );
        }

        const token = authHeader.replace("Bearer ", "").trim();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          return new Response(
            JSON.stringify({ thread: null, reason: "unauthorized" }),
            { status: 200, headers: jsonHeaders }
          );
        }

        const isAdmin = (user?.app_metadata as Record<string, unknown>)?.role === "admin";
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        const isPro = isAdmin || Boolean(sub && (sub.status === "active" || sub.status === "trialing"));
        if (!isPro) {
          return new Response(
            JSON.stringify({ thread: null, reason: "pro_required" }),
            { status: 200, headers: jsonHeaders }
          );
        }
      }
    }

    // Montagem estruturada do State para o JEV (System One)
    const formattedNotes = notes
      .slice(0, 30)
      .map((n, i) => {
        const ref = `${n.bookName || "Bíblia"} ${n.chapter || ""}${n.verse ? `:${n.verse}` : ""}`.trim();
        const title = n.title ? ` · "${n.title}"` : "";
        const cleanContent = (n.content || "").replace(/\s+/g, " ").trim().slice(0, 220);
        return `${i + 1}. [${n.type.toUpperCase()}] ${ref}${title}\n   "${cleanContent}"`;
      })
      .join("\n\n");

    const state = `[CAPÍTULO BÍBLICO EM LEITURA]\nReferência: ${chapterRef || "Capítulo Atual"}\nTexto Bíblico:\n${chapterText.slice(0, 3000)}\n\n[REGISTROS DO MEMORIAL DO LEITOR]\n${formattedNotes}`;

    // Definição das três Primitivas JEV em paralelo
    const jevPayload = {
      state,
      questions: [
        {
          id: "has_spiritual_echo",
          type: "noul",
          question:
            "Existe uma conexão tipológica, profética, de cumprimento de aliança ou de resposta de oração entre o capítulo bíblico lido e algum dos Registros do Memorial apresentados?",
        },
        {
          id: "echo_category",
          type: "choice",
          question: "Qual a categoria tipológica principal desta conexão?",
          options: [
            "Cumprimento_Profetico",
            "Eco_de_Linguagem",
            "Contraste_de_Alianca",
            "Resposta_de_Oracao",
          ],
        },
        {
          id: "echo_relevance",
          type: "score",
          question:
            "Qual a relevância e clareza espiritual desta conexão para a fé e reflexão do Leitor em uma escala de 1 a 10?",
        },
      ],
    };

    // Chamada à API TypeSafe AI REST
    const evalUrl = process.env.TYPESAFE_API_URL || "https://api.typesafe.ai/v1/eval";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const jevRes = await fetch(evalUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${typesafeApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jevPayload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!jevRes.ok) {
      console.warn("[scriptureThread] TypeSafe AI respondeu com erro HTTP:", jevRes.status);
      return new Response(JSON.stringify({ thread: null }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    const jevData = await jevRes.json();

    // Extração dos resultados das primitivas (tolerante a formatos do JEV)
    let noulScore = 0;
    let category = "Cumprimento_Profetico";
    let categoryConfidence = 0;
    let relevanceScore = 0;

    const results = jevData.results || jevData.answers || jevData;

    if (Array.isArray(results)) {
      for (const item of results) {
        if (item.id === "has_spiritual_echo") {
          noulScore = typeof item.answer === "number" ? item.answer : item.answer === true ? 1 : 0;
        } else if (item.id === "echo_category") {
          category = item.answer || category;
          categoryConfidence = item.confidence || 0;
        } else if (item.id === "echo_relevance") {
          relevanceScore = item.score || item.answer || 0;
        }
      }
    } else if (typeof results === "object" && results !== null) {
      const qNoul = results.has_spiritual_echo;
      const qChoice = results.echo_category;
      const qScore = results.echo_relevance;

      if (qNoul) {
        noulScore = typeof qNoul.answer === "number" ? qNoul.answer : qNoul.answer === true ? 1 : 0;
        if (qNoul.confidence && !categoryConfidence) categoryConfidence = qNoul.confidence;
      }
      if (qChoice) {
        category = qChoice.answer || category;
        categoryConfidence = qChoice.confidence || categoryConfidence;
      }
      if (qScore) {
        relevanceScore = qScore.score || qScore.answer || 0;
      }
    }

    // Regra de Confidence-Gated Routing:
    // Noul ≥ 0.80 E Confiança ≥ 0.85 — caso contrário, silêncio absoluto
    const meetsNoulGate = noulScore >= 0.80;
    const meetsConfidenceGate = categoryConfidence >= 0.85;

    if (!meetsNoulGate || !meetsConfidenceGate) {
      return new Response(JSON.stringify({ thread: null }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    const validCategories = [
      "Cumprimento_Profetico",
      "Eco_de_Linguagem",
      "Contraste_de_Alianca",
      "Resposta_de_Oracao",
    ];

    const safeCategory = validCategories.includes(category)
      ? category
      : "Cumprimento_Profetico";

    return new Response(
      JSON.stringify({
        thread: {
          category: safeCategory,
          confidence: categoryConfidence,
          relevanceScore,
          evaluatedAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.warn("[scriptureThread] Falha durante avaliação JEV:", err);
    // Em qualquer cenário de erro, retorna silêncio reverente (status 200, thread null)
    return new Response(JSON.stringify({ thread: null }), {
      status: 200,
      headers: jsonHeaders,
    });
  }
}
