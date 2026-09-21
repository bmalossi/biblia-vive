import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

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

    // Montagem das opções de notas para a identificação da Nota Candidata pelo JEV
    const noteCriteria: Record<string, string> = {};
    notes.slice(0, 30).forEach((n, idx) => {
      const num = String(idx + 1);
      const title = n.title ? ` · "${n.title}"` : "";
      const clean = (n.content || "").replace(/\s+/g, " ").trim().slice(0, 100);
      noteCriteria[num] = `Nota ${num}: [${(n.type || "reflexao").toUpperCase()}] ${n.bookName || ""}${title} - ${clean}`;
    });
    noteCriteria["nenhuma"] = "Nenhuma das anteriores possui conexão tipológica ou espiritual relevante";

    // Definição das Primitivas JEV (System One)
    const jevPayload = {
      model: "jev-latest",
      state,
      questions: {
        has_spiritual_echo: {
          type: "noul",
          instructions:
            "Existe uma conexão tipológica, profética, de cumprimento de aliança ou de resposta de oração entre o capítulo bíblico lido e algum dos Registros do Memorial apresentados?",
        },
        echo_category: {
          type: "choice",
          instructions: "Qual a categoria tipológica principal desta conexão?",
          criteria: {
            Cumprimento_Profetico:
              "Continuidade direta, profecia, prefiguração, tipo e antítipo entre as alianças (ex: sacrifício de Isaque e o sacrifício de Cristo)",
            Eco_de_Linguagem:
              "Ressonância temática, repetição de termos ou imagens bíblicas fundamentais",
            Contraste_de_Alianca:
              "Distinção reveladora entre a Antiga e a Nova Aliança, lei e graça, sombra e substância",
            Resposta_de_Oracao:
              "Conexão entre o texto bíblico lido e um clamor ou oração registrada pelo leitor",
          },
        },
        echo_relevance: {
          type: "score",
          instructions:
            "Qual a relevância e clareza espiritual desta conexão para a fé e reflexão do Leitor em uma escala de 1 a 5?",
          criteria: [
            "Sem conexão aparente",
            "Conexão tênue ou indireta",
            "Conexão moderada",
            "Conexão clara e edificante",
            "Conexão profunda e profética",
          ],
        },
        matched_note_index: {
          type: "choice",
          instructions: `Qual o número do Registro do Memorial (1 a ${Math.min(notes.length, 30)}) que possui a conexão espiritual mais forte com o capítulo lido?`,
          criteria: noteCriteria,
        },
      },
    };

    // Chamada à API TypeSafe AI REST
    const rawUrl = process.env.TYPESAFE_API_URL || "https://api.typesafe.ai/v1/systemone";
    const evalUrl = rawUrl.includes("/v1/eval") ? "https://api.typesafe.ai/v1/systemone" : rawUrl;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

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
      const errText = await jevRes.text().catch(() => "");
      console.warn("[scriptureThread] TypeSafe AI erro HTTP:", jevRes.status, errText);
      return new Response(
        JSON.stringify({ thread: null, reason: `typesafe_http_${jevRes.status}` }),
        {
          status: 200,
          headers: jsonHeaders,
        }
      );
    }

    const jevData = await jevRes.json();
    console.log("[scriptureThread] Resposta bruta do TypeSafe AI:", JSON.stringify(jevData));

    // Extração dos resultados das primitivas (tolerante a formatos do JEV)
    let noulScore = 0;
    let category = "Cumprimento_Profetico";
    let categoryConfidence = 0;
    let relevanceScore = 8;
    let matchedNoteId: string | undefined;
    let matchedNoteExcerpt: string | undefined;

    const answers = jevData.answers || jevData.results || jevData;

    if (answers && typeof answers === "object" && !Array.isArray(answers)) {
      const qNoul = answers.has_spiritual_echo;
      const qChoice = answers.echo_category;
      const qScore = answers.echo_relevance;
      const qMatched = answers.matched_note_index;

      if (qNoul) {
        if (typeof qNoul.noul === "number") {
          noulScore = qNoul.noul;
        } else if (typeof qNoul.probability === "number") {
          noulScore = qNoul.probability;
        } else if (typeof qNoul.answer === "number") {
          noulScore = qNoul.answer;
        } else if (qNoul.answer === true) {
          noulScore = 1;
        }
      }

      if (qChoice) {
        if (typeof qChoice.choice === "string") {
          category = qChoice.choice;
        } else if (typeof qChoice.answer === "string") {
          category = qChoice.answer;
        }

        if (typeof qChoice.confidence === "number") {
          categoryConfidence = qChoice.confidence;
        } else if (qChoice.probabilities && typeof qChoice.probabilities[category] === "number") {
          categoryConfidence = qChoice.probabilities[category];
        } else if (noulScore > 0) {
          categoryConfidence = noulScore;
        }
      }

      if (qScore) {
        if (typeof qScore.score === "number") {
          relevanceScore = qScore.score <= 5 ? Math.min(10, Math.max(2, (qScore.score + 1) * 2)) : qScore.score;
        } else if (typeof qScore.answer === "number") {
          relevanceScore = qScore.answer;
        }
      }

      if (qMatched) {
        const choiceKey = qMatched.choice || qMatched.answer;
        if (choiceKey && typeof choiceKey === "string" && choiceKey !== "nenhuma") {
          const idx = parseInt(choiceKey, 10) - 1;
          if (idx >= 0 && idx < notes.length) {
            matchedNoteId = notes[idx].id;
            matchedNoteExcerpt = notes[idx].content?.slice(0, 300);
          }
        }
      }
    } else if (Array.isArray(answers)) {
      for (const item of answers) {
        if (item.id === "has_spiritual_echo") {
          noulScore = typeof item.noul === "number" ? item.noul : typeof item.answer === "number" ? item.answer : item.answer === true ? 1 : 0;
        } else if (item.id === "echo_category") {
          category = item.choice || item.answer || category;
          categoryConfidence = item.confidence || categoryConfidence;
        } else if (item.id === "echo_relevance") {
          relevanceScore = item.score || item.answer || relevanceScore;
        } else if (item.id === "matched_note_index") {
          const choiceKey = item.choice || item.answer;
          if (choiceKey && typeof choiceKey === "string" && choiceKey !== "nenhuma") {
            const idx = parseInt(choiceKey, 10) - 1;
            if (idx >= 0 && idx < notes.length) {
              matchedNoteId = notes[idx].id;
              matchedNoteExcerpt = notes[idx].content?.slice(0, 300);
            }
          }
        }
      }
    }

    if (!categoryConfidence && noulScore > 0) {
      categoryConfidence = noulScore;
    }

    // Regra de Confidence-Gated Routing:
    // Noul ≥ 0.80 E Confiança ≥ 0.85 — caso contrário, silêncio absoluto
    const meetsNoulGate = noulScore >= 0.80;
    const meetsConfidenceGate = categoryConfidence >= 0.85;

    console.log("[scriptureThread] Gating check:", {
      noulScore,
      category,
      categoryConfidence,
      relevanceScore,
      matchedNoteId,
      meetsNoulGate,
      meetsConfidenceGate,
    });

    if (!meetsNoulGate || !meetsConfidenceGate) {
      return new Response(
        JSON.stringify({
          thread: null,
          reason: "below_confidence_gate",
          scores: { noul: noulScore, confidence: categoryConfidence },
        }),
        {
          status: 200,
          headers: jsonHeaders,
        }
      );
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
          matchedNoteId,
          matchedNoteExcerpt,
          evaluatedAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError" || err?.message?.includes("aborted");
    console.warn("[scriptureThread] Falha durante avaliação JEV:", isTimeout ? "Timeout (8s)" : err?.message);
    // Em qualquer cenário de erro, retorna silêncio reverente (status 200, thread null)
    return new Response(
      JSON.stringify({ thread: null, reason: isTimeout ? "timeout" : "internal_error" }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    );
  }
}
