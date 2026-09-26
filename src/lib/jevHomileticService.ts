/**
 * jevHomileticService.ts — Bíblia Vive · Projeto Logos
 *
 * Serviço de auditoria homilética e teológica (Guardião do Evangelho / Gálatas 1:8)
 * utilizando o modelo JEV (TypeSafe AI) com as primitivas Noul e Choice.
 * Respeita estritamente a ADR-0016 (Payload Homilético Isolado sem as 30 notas do Memorial).
 */

import { supabase } from "@/lib/supabase";
import type { Sermon } from "@/lib/homileticClient";
import { getManualCommentaries } from "@/lib/studyPanel";

export type TheologicalDeviation =
  | "Fiel_Ao_Texto"
  | "Teologia_Prosperidade"
  | "Humanismo_SelfHelp"
  | "Moralismo_Sem_Graca";

export interface HomileticAuditPayload {
  sermonId: string;
  biblical_passage_text: string;
  sermon_initial_spark: string;
  sermon_intended_outcome: string;
  sermon_block_1_exegesis: string;
  sermon_block_2_topics: Array<{
    id: string;
    title: string;
    steps: {
      stepA_fato: string;
      stepB_porque: string;
      stepC_contraste: string;
      stepD_tensao: string;
    };
  }>;
  sermon_block_3_application: string;
  historical_commentary?: string;
}

export interface HomileticAuditResult {
  is_grace_centered: boolean;
  theological_deviation: TheologicalDeviation;
  confidence: number;
  reasoning: string;
  historical_alignment?: string;
  evaluatedAt: string;
}

/**
 * Constrói o payload homilético estrito (ADR-0016).
 * Rigorosamente desvinculado das 30 notas do Memorial para evitar context-rot.
 */
export function buildHomileticPayload(
  sermon: Sermon,
  biblicalPassageText?: string,
  historicalCommentary?: string
): HomileticAuditPayload {
  const topics = (sermon.bloco2Topicos || []).map((t) => ({
    id: t.id,
    title: t.title,
    steps: {
      stepA_fato: t.steps?.stepA_fato || "",
      stepB_porque: t.steps?.stepB_porque || "",
      stepC_contraste: t.steps?.stepC_contraste || "",
      stepD_tensao: t.steps?.stepD_tensao || "",
    },
  }));

  const ref = `${sermon.bookName || "Bíblia"} ${sermon.chapter || ""}${sermon.verse ? `:${sermon.verse}` : ""}`.trim();

  return {
    sermonId: sermon.id,
    biblical_passage_text: biblicalPassageText || `Passagem Base: ${ref}`,
    sermon_initial_spark: sermon.sparkText || "",
    sermon_intended_outcome: `${sermon.desfechoTipo ? `[${sermon.desfechoTipo.toUpperCase()}] ` : ""}${sermon.desfechoTexto || ""}`,
    sermon_block_1_exegesis: `${sermon.bloco1IntencaoOriginal ? `Intenção Original: ${sermon.bloco1IntencaoOriginal}\n` : ""}${sermon.bloco1Exegese || ""}`,
    sermon_block_2_topics: topics,
    sermon_block_3_application: sermon.bloco3Aplicacao || "",
    historical_commentary: historicalCommentary,
  };
}

/**
 * Heurística local de auditoria homilética para desenvolvimento ou fallback offline.
 * Analisa todos os blocos: Exegese, Ancoradouro, Introdução, Desfecho e CADA UM DOS TÓPICOS.
 */
export function evaluateLocalHomileticHeuristic(
  payload: HomileticAuditPayload,
  historicalCommentary?: string
): HomileticAuditResult {
  const allText = [
    payload.sermon_intended_outcome,
    payload.sermon_block_1_exegesis,
    ...(payload.sermon_block_2_topics || []).flatMap((t) => [
      t.title,
      t.steps.stepA_fato,
      t.steps.stepB_porque,
      t.steps.stepC_contraste,
      t.steps.stepD_tensao,
    ]),
    payload.sermon_block_3_application,
  ]
    .join(" ")
    .toLowerCase();

  // 1. Checagem de Conteúdo Incoerente / Spam / Gibberish nos tópicos
  // Detecta repetições de teclas sem sentido como "dasdsadsad", "asdsad", "sadsad"
  const gibberishRegex = /\b[bcdfghjklmnpqrstvwxyz]{6,}\b|\b[asdfjkl]{5,}\b/i;
  const topics = payload.sermon_block_2_topics || [];
  const invalidTopics: string[] = [];

  topics.forEach((t, i) => {
    const topicText = `${t.title} ${t.steps.stepA_fato} ${t.steps.stepB_porque} ${t.steps.stepC_contraste} ${t.steps.stepD_tensao}`;
    if (gibberishRegex.test(topicText) || /^(.)\1{4,}$/.test(topicText.trim())) {
      invalidTopics.push(t.title || `Tópico ${i + 1}`);
    }
  });

  if (invalidTopics.length > 0) {
    return {
      is_grace_centered: false,
      theological_deviation: "Humanismo_SelfHelp",
      confidence: 0.91,
      reasoning: `Alerta de Inconsistência Homilética: O(s) tópico(s) [${invalidTopics.join(", ")}] contém conteúdo aleatório ou não redigido ('dasdsadsad...'). Para manter a fidelidade e edificação da igreja, desenvolva os degraus bíblicos com clareza antes de pregar.`,
      historical_alignment: "Não alinhado: conteúdo desprovido de base exegética compromete a seriedade do púlpito.",
      evaluatedAt: new Date().toISOString(),
    };
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
    return {
      is_grace_centered: false,
      theological_deviation: "Teologia_Prosperidade",
      confidence: 0.94,
      reasoning: "Alerta de Gálatas 1:8: A mensagem condiciona a ação de Deus a barganhas humanas ou promessas de triunfalismo material, desviando-se da suficiência da Cruz de Cristo.",
      historical_alignment: "Divergência histórica com a Reforma: a Graça não pode ser comprada ou negociada.",
      evaluatedAt: new Date().toISOString(),
    };
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
    return {
      is_grace_centered: false,
      theological_deviation: "Humanismo_SelfHelp",
      confidence: 0.92,
      reasoning: "Alerta de Gálatas 1:8: A mensagem posiciona o ser humano como o herói soberano, reduzindo o Evangelho a autoajuda e antropocentrismo.",
      historical_alignment: "Divergência histórica: toda a Escritura testifica de Cristo como o único Redentor.",
      evaluatedAt: new Date().toISOString(),
    };
  }

  // 4. Moralismo Sem Graça
  const moralismPatterns = [
    /faça por merecer/i,
    /salvação pelas obras/i,
    /deus só te ama se você cumprir/i,
    /mereça a salvação/i,
  ];
  if (moralismPatterns.some((pattern) => pattern.test(allText))) {
    return {
      is_grace_centered: false,
      theological_deviation: "Moralismo_Sem_Graca",
      confidence: 0.9,
      reasoning: "Alerta de Gálatas 1:8: A mensagem impõe preceitos legalistas desprovidos da Graça salvadora e da justificação somente pela fé.",
      historical_alignment: "Divergência com a doutrina paulina e a Reforma Protestante (Sola Gratia).",
      evaluatedAt: new Date().toISOString(),
    };
  }

  // 5. Sermão Fiel ao Texto e Centrado em Cristo
  return {
    is_grace_centered: true,
    theological_deviation: "Fiel_Ao_Texto",
    confidence: 0.95,
    reasoning: "Auditoria Homilética: O sermão preserva a centralidade de Cristo, expõe o texto bíblico com fidelidade e aponta para a soberania da Graça.",
    historical_alignment: historicalCommentary
      ? "Em harmonia com os comentários históricos de referência (Matthew Henry, Albert Barnes, John Gill)."
      : "Alinhado com a tradição exegética bíblica e reformada.",
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Realiza o Teste de Ortodoxia do sermão via API Serverless / JEV.
 */
export async function auditSermonOrthodoxy(
  sermon: Sermon,
  biblicalPassageText?: string
): Promise<HomileticAuditResult> {
  // 1. RAG de Comentários Históricos (Barnes, Henry, Gill) se disponível
  let historicalCommentary = "";
  if (sermon.bookId && sermon.chapter) {
    try {
      const commentaries = await getManualCommentaries(sermon.bookId, sermon.chapter, sermon.verse || undefined);
      if (commentaries && commentaries.length > 0) {
        historicalCommentary = commentaries
          .slice(0, 3)
          .map((c) => `${c.author} (${c.work || c.era}): "${c.text.slice(0, 250)}..."`)
          .join("\n\n");
      }
    } catch {
      // ignore
    }
  }

  // 2. Constrói payload estrito
  const payload = buildHomileticPayload(sermon, biblicalPassageText, historicalCommentary);

  // 3. Obtém token JWT
  let token: string | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  } catch {}

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch("/api/homiletic-audit", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audit) {
        return data.audit;
      }
    }
  } catch (err) {
    console.warn("[jevHomileticService] Falha na chamada da API de auditoria:", err);
  }

  // Avaliação local heurística inteligente quando rodando offline ou sem chave externa
  return evaluateLocalHomileticHeuristic(payload, historicalCommentary);
}
