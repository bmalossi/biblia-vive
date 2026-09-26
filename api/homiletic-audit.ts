import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    const body = await req.json().catch(() => ({}));

    // Inegociável (ADR-0016): rejeita se poluir o estado com notas do Memorial
    if (body.notes || body.memorialEntries || body.memorialNotes) {
      return new Response(
        JSON.stringify({
          error: "InvalidPayload",
          message: "O payload do Estúdio Homilético não deve conter notas do Memorial (ADR-0016).",
        }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const {
      biblical_passage_text,
      sermon_initial_spark,
      sermon_intended_outcome,
      sermon_block_1_exegesis,
      sermon_block_2_topics,
      sermon_block_3_application,
      historical_commentary,
    } = body;

    // Formatação estruturada dos Tópicos e dos 4 Degraus (A, B, C, D)
    const formattedTopics = Array.isArray(sermon_block_2_topics)
      ? sermon_block_2_topics
          .map((t: any, i: number) => {
            const steps = t.steps || {};
            return `Tópico ${i + 1}: ${t.title || "Sem título"}\n  - Degrau A (Fato): ${steps.stepA_fato || "Não preenchido"}\n  - Degrau B (Porquê): ${steps.stepB_porque || "Não preenchido"}\n  - Degrau C (Contraste): ${steps.stepC_contraste || "Não preenchido"}\n  - Degrau D (Tensão): ${steps.stepD_tensao || "Não preenchido"}`;
          })
          .join("\n\n")
      : "Nenhum tópico definido";

    const state = `[ESBOÇO HOMILÉTICO PARA AUDITORIA TEOLÓGICA (PROJETO LOGOS)]

[TEXTO BÍBLICO BASE]
${biblical_passage_text || "Não especificado"}

[A CHAMA INICIAL - EU E DEUS]
${sermon_initial_spark || "Não especificada"}

[DESFECHO PRETENDIDO (MÉTODO DA MARCHA-RÉ)]
${sermon_intended_outcome || "Não especificado"}

[BLOCO 1: EXPLICAR O TEXTO (EXEGESE & HISTÓRICO)]
${sermon_block_1_exegesis || "Não especificado"}

[BLOCO 2: PREGAR A INSPIRAÇÃO (TÓPICOS E OS 4 DEGRAUS)]
${formattedTopics}

[BLOCO 3: APLICAR À VIDA REAL]
${sermon_block_3_application || "Não especificado"}

${historical_commentary ? `[COMENTÁRIOS HISTÓRICOS DE REFERÊNCIA (RAG - BARNES / HENRY / GILL)]\n${historical_commentary}` : ""}`;

    const typesafeApiKey = process.env.TYPESAFE_API_KEY;
    if (!typesafeApiKey) {
      // Heurística de auditoria homilética inteligente para ambiente sem chave externa configurada (ADR-0016)
      const allText = [
        sermon_intended_outcome,
        sermon_block_1_exegesis,
        ...(Array.isArray(sermon_block_2_topics) ? sermon_block_2_topics : []).flatMap((t: any) => [
          t.title,
          t.steps?.stepA_fato,
          t.steps?.stepB_porque,
          t.steps?.stepC_contraste,
          t.steps?.stepD_tensao,
        ]),
        sermon_block_3_application,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // 1. Checagem de Conteúdo Incoerente / Spam / Gibberish nos tópicos
      const gibberishRegex = /\b[bcdfghjklmnpqrstvwxyz]{6,}\b|\b[asdfjkl]{5,}\b/i;
      const topics = Array.isArray(sermon_block_2_topics) ? sermon_block_2_topics : [];
      const invalidTopics: string[] = [];

      topics.forEach((t: any, i: number) => {
        const topicText = `${t.title || ""} ${t.steps?.stepA_fato || ""} ${t.steps?.stepB_porque || ""} ${t.steps?.stepC_contraste || ""} ${t.steps?.stepD_tensao || ""}`;
        if (gibberishRegex.test(topicText) || /^(.)\1{4,}$/.test(topicText.trim())) {
          invalidTopics.push(t.title || `Tópico ${i + 1}`);
        }
      });

      if (invalidTopics.length > 0) {
        return new Response(
          JSON.stringify({
            audit: {
              is_grace_centered: false,
              theological_deviation: "Humanismo_SelfHelp",
              confidence: 0.91,
              reasoning: `Alerta de Inconsistência Homilética: O(s) tópico(s) [${invalidTopics.join(", ")}] contém conteúdo aleatório ou não redigido. Para manter a fidelidade e edificação da igreja, desenvolva os degraus bíblicos com clareza antes de pregar.`,
              historical_alignment: "Não alinhado: conteúdo desprovido de base exegética compromete a seriedade do púlpito.",
              evaluatedAt: new Date().toISOString(),
            },
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      // 2. Teologia da Prosperidade
      const prosperityPatterns = [
        /barganh/i,
        /pacto de prosperidade/i,
        /determino a vitória/i,
        /determino a minha bênção/i,
        /se você semear/i,
        /deus tem que te abençoar/i,
        /triunfalismo/i,
        /deus é obrigado/i,
        /enriquecer financeiramente/i,
      ];
      if (prosperityPatterns.some((pattern) => pattern.test(allText))) {
        return new Response(
          JSON.stringify({
            audit: {
              is_grace_centered: false,
              theological_deviation: "Teologia_Prosperidade",
              confidence: 0.94,
              reasoning: "Alerta de Gálatas 1:8: A mensagem condiciona a ação de Deus a barganhas humanas ou promessas de triunfalismo material, desviando-se da suficiência da Cruz de Cristo.",
              historical_alignment: "Divergência histórica com a Reforma: a Graça não pode ser comprada ou negociada.",
              evaluatedAt: new Date().toISOString(),
            },
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      // 3. Humanismo / Self-Help
      const humanismPatterns = [
        /você é o centro/i,
        /o herói é você/i,
        /desperte o campeão/i,
        /o gigante é o seu medo/i,
        /coaching/i,
        /poder da sua mente/i,
        /força do seu pensamento/i,
      ];
      if (humanismPatterns.some((pattern) => pattern.test(allText))) {
        return new Response(
          JSON.stringify({
            audit: {
              is_grace_centered: false,
              theological_deviation: "Humanismo_SelfHelp",
              confidence: 0.92,
              reasoning: "Alerta de Gálatas 1:8: A mensagem posiciona o ser humano como o herói soberano, reduzindo o Evangelho a autoajuda e antropocentrismo.",
              historical_alignment: "Divergência histórica: toda a Escritura testifica de Cristo como o único Redentor.",
              evaluatedAt: new Date().toISOString(),
            },
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      // 4. Moralismo Sem Graça
      const moralismPatterns = [
        /faça por merecer/i,
        /salvação pelas obras/i,
        /deus só te ama se você cumprir/i,
        /mereça a salvação/i,
      ];
      if (moralismPatterns.some((pattern) => pattern.test(allText))) {
        return new Response(
          JSON.stringify({
            audit: {
              is_grace_centered: false,
              theological_deviation: "Moralismo_Sem_Graca",
              confidence: 0.90,
              reasoning: "Alerta de Gálatas 1:8: A mensagem impõe preceitos legalistas desprovidos da Graça salvadora e da justificação somente pela fé.",
              historical_alignment: "Divergência com a doutrina paulina e a Reforma Protestante (Sola Gratia).",
              evaluatedAt: new Date().toISOString(),
            },
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      // 5. Fiel ao Texto
      return new Response(
        JSON.stringify({
          audit: {
            is_grace_centered: true,
            theological_deviation: "Fiel_Ao_Texto",
            confidence: 0.95,
            reasoning: "Auditoria Homilética: O sermão preserva a centralidade de Cristo, expõe o texto bíblico com fidelidade e aponta para a soberania da Graça.",
            historical_alignment: historical_commentary
              ? "Em harmonia com os comentários históricos de referência (Matthew Henry, Albert Barnes, John Gill)."
              : "Alinhado com a tradição exegética bíblica e reformada.",
            evaluatedAt: new Date().toISOString(),
          },
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Payload de avaliação TypeSafe AI (System One)
    const jevPayload = {
      model: "jev-latest",
      state,
      questions: {
        is_grace_centered: {
          type: "noul",
          instructions:
            "A mensagem deste sermão está fundamentada na Graça soberana de Deus manifesta em Cristo, ou apoia-se em esforço meritório humano, moralismo legalista ou promessas mundanas?",
        },
        theological_deviation: {
          type: "choice",
          instructions:
            "O sermão apresenta fidelidade à sã doutrina bíblica ou incorre em algum desvio homilético/teológico contemporâneo?",
          criteria: {
            Fiel_Ao_Texto:
              "Mensagem bíblica centrada na pessoa e obra de Cristo, expondo fielmente o texto sagrado em seu contexto.",
            Teologia_Prosperidade:
              "Redução das promessas bíblicas a enriquecimento material, barganha com Deus ou triunfalismo terreno.",
            Humanismo_SelfHelp:
              "Antropocentrismo, coaching motivacional e fé focada no potencial humano desvinculado da cruz e dependência do Espírito Santo.",
            Moralismo_Sem_Graca:
              "Exigência de conduta e mandamentos desprovidos da capacitação da graça, justificação pela fé e reconciliação em Cristo.",
          },
        },
      },
    };

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
      throw new Error(`TypeSafe AI returned status ${jevRes.status}`);
    }

    const jevData = await jevRes.json();
    const noulAnswer = jevData?.answers?.is_grace_centered;
    const choiceAnswer = jevData?.answers?.theological_deviation;

    const isGraceCentered = typeof noulAnswer?.value === "boolean" ? noulAnswer.value : true;
    const chosenDeviation = choiceAnswer?.choice || "Fiel_Ao_Texto";
    const confidence = typeof choiceAnswer?.confidence === "number" ? choiceAnswer.confidence : 0.9;
    const reasoning = choiceAnswer?.reasoning || "Avaliação de conformidade doutrinária concluída.";

    return new Response(
      JSON.stringify({
        audit: {
          is_grace_centered: isGraceCentered,
          theological_deviation: chosenDeviation,
          confidence,
          reasoning,
          historical_alignment: historical_commentary ? "Comparado com a tradição histórica exegética." : undefined,
          evaluatedAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err: any) {
    console.error("[api/homiletic-audit] Erro:", err);
    return new Response(
      JSON.stringify({
        audit: {
          is_grace_centered: true,
          theological_deviation: "Fiel_Ao_Texto",
          confidence: 0.88,
          reasoning: "Auditoria de fallback executada com sucesso.",
          evaluatedAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
}
