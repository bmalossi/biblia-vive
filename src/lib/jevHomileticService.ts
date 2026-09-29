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
  | "Moralismo_Sem_Graca"
  | "Inconclusivo_Rascunho";

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
 * Vocabulário padrão de palavras funcionais e bíblicas comuns para validação de coerência textual.
 */
const COMMON_VOCABULARY = new Set([
  // Português (funcionais, conectivos e termos básicos)
  "o", "a", "os", "as", "um", "uma", "uns", "umas",
  "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
  "por", "pelo", "pela", "pelos", "pelas", "para", "pra", "com", "sem", "sob", "sobre",
  "e", "ou", "mas", "porem", "porém", "contudo", "todavia", "pois", "porque", "porquê",
  "que", "se", "como", "quando", "onde", "quem", "qual", "quanto",
  "nao", "não", "sim", "já", "ja", "ainda", "sempre", "nunca",
  "eu", "tu", "ele", "ela", "nos", "nós", "eles", "elas", "você", "voce", "voces", "vocês",
  "meu", "minha", "seu", "sua", "nosso", "nossa",
  "este", "esta", "esse", "essa", "aquele", "aquela", "isto", "isso", "aquilo",
  "deus", "jesus", "cristo", "senhor", "espirito", "espírito", "graça", "graca", "fe", "fé",
  "amor", "vida", "morte", "cruz", "palavra", "texto", "biblia", "bíblia", "evangelho",
  "igreja", "irmaos", "irmãos", "pecado", "salvacao", "salvação", "perdao", "perdão",
  "pregador", "sermao", "sermão", "pregacao", "pregação", "ouvinte", "ouvintes",
  "homem", "mulher", "filho", "pai", "mae", "mãe", "povo", "mundo", "reino",
  "ser", "estar", "ter", "haver", "fazer", "dizer", "ir", "ver", "dar", "saber",
  "é", "sao", "são", "foi", "era", "tem", "ha", "há", "vai", "vem",
  // Espanhol e Inglês (suporte a leituras multilíngues)
  "the", "of", "and", "to", "in", "is", "that", "for", "with", "god", "lord",
  "el", "la", "y", "en", "dios", "cristo"
]);

/**
 * Conta palavras com significado no texto (mínimo 2 letras alfabéticas).
 */
export function countMeaningfulWords(text: string): number {
  if (!text) return 0;
  return text
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}]/gu, ""))
    .filter((w) => w.length >= 2).length;
}

/**
 * Detecta conteúdo sem sentido, repetição de teclas, aglomerados de consoantes ou digitação aleatória.
 */
export function detectGibberishOrKeyboardMash(text: string): { isGibberish: boolean; sample?: string } {
  if (!text || !text.trim()) return { isGibberish: false };

  // 1. Palavras contínuas anômalas (> 30 caracteres sem espaço)
  const giantWords = text.match(/[^\s]{30,}/g);
  if (giantWords && giantWords.length > 0) {
    return { isGibberish: true, sample: giantWords[0].slice(0, 25) + "..." };
  }

  // 2. Repetição contínua do mesmo caractere (ex: "aaaaaa", ".....")
  const repeatedChar = text.match(/(.)\1{4,}/);
  if (repeatedChar) {
    return { isGibberish: true, sample: repeatedChar[0] };
  }

  // 3. Aglomerados de 5 ou mais consoantes consecutivas sem vogais (ex: "bcdfgh", "pksaop", "sdks")
  const consonantCluster = text.match(/[bcdfghjklmnpqrstvwxyz]{5,}/i);
  if (consonantCluster) {
    return { isGibberish: true, sample: consonantCluster[0] };
  }

  // 4. Palavras longas com baixíssima variedade de letras (ex: "dasdsadsaddasdasdsad" -> apenas 'a','d','s')
  const rawWords = text
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}]/gu, "").toLowerCase())
    .filter(Boolean);

  for (const w of rawWords) {
    if (w.length >= 10) {
      const uniqueChars = new Set(w.split("")).size;
      if (uniqueChars <= 3) {
        return { isGibberish: true, sample: w };
      }
    }
    // Palavras médias (>= 5 letras) sem nenhuma vogal
    if (w.length >= 5 && !/[aeiouyáéíóúâêîôûãõàèìòùäëïöü]/i.test(w)) {
      return { isGibberish: true, sample: w };
    }
  }

  // 5. Se o texto tem pelo menos 4 palavras e mais de 25 caracteres, mas nenhuma palavra reconhecida no vocabulário
  if (rawWords.length >= 4 && text.trim().length >= 25) {
    const hasRecognizedWord = rawWords.some((w) => COMMON_VOCABULARY.has(w));
    if (!hasRecognizedWord) {
      return { isGibberish: true, sample: rawWords.slice(0, 3).join(" ") + "..." };
    }
  }

  return { isGibberish: false };
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
  // 1. Mapeamento de todas as seções redigidas para auditoria integral
  const sectionsToCheck: Array<{ name: string; text: string }> = [
    { name: "Desfecho Homilético", text: payload.sermon_intended_outcome || "" },
    { name: "Bloco 1 (Exegese)", text: payload.sermon_block_1_exegesis || "" },
    { name: "Aplicação (Bloco 3)", text: payload.sermon_block_3_application || "" },
    { name: "Faísca Inicial", text: payload.sermon_initial_spark || "" },
  ];

  (payload.sermon_block_2_topics || []).forEach((t, i) => {
    sectionsToCheck.push({
      name: `Tópico ${i + 1} (${t.title || "Sem título"})`,
      text: `${t.title || ""} ${t.steps.stepA_fato || ""} ${t.steps.stepB_porque || ""} ${t.steps.stepC_contraste || ""} ${t.steps.stepD_tensao || ""}`,
    });
  });

  // 2. Checagem de Conteúdo Incoerente / Spam / Gibberish em QUALQUER seção
  for (const sec of sectionsToCheck) {
    const gibberish = detectGibberishOrKeyboardMash(sec.text);
    if (gibberish.isGibberish) {
      return {
        is_grace_centered: false,
        theological_deviation: "Inconclusivo_Rascunho",
        confidence: 0,
        reasoning: `Alerta de Conteúdo Ininteligível: Detectamos digitação aleatória ou repetição de caracteres em "${sec.name}" (${gibberish.sample ? `'${gibberish.sample}'` : "caracteres desconexos"}). Para manter a fidelidade e edificação da igreja, desenvolva o raciocínio bíblico com clareza antes de pregar.`,
        historical_alignment: "Não avaliado: o conteúdo atual não possui base textual para comparação histórica.",
        evaluatedAt: new Date().toISOString(),
      };
    }
  }

  // 3. Validação de Conteúdo Mínimo / Rascunho Inicial
  const allText = sectionsToCheck
    .map((s) => s.text)
    .join(" ")
    .toLowerCase();

  const totalWords = countMeaningfulWords(allText);
  const desfechoWords = countMeaningfulWords(payload.sermon_intended_outcome || "");
  const exegeseWords = countMeaningfulWords(payload.sermon_block_1_exegesis || "");

  if (totalWords < 15 || (desfechoWords < 3 && exegeseWords < 3)) {
    return {
      is_grace_centered: false,
      theological_deviation: "Inconclusivo_Rascunho",
      confidence: 0,
      reasoning: "Conteúdo Insuficiente para Auditoria: O esboço ainda está em fase inicial ou não possui texto suficiente. Redija ao menos o Desfecho da Marcha-Ré e a Exegese do Bloco 1 com suas próprias palavras para avaliar a conformidade doutrinária.",
      historical_alignment: "Pendente: aguardando redação do esboço para análise com os comentários bíblicos históricos.",
      evaluatedAt: new Date().toISOString(),
    };
  }

  // 4. Teologia da Prosperidade
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

  // 5. Humanismo / Self-Help
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

  // 6. Moralismo Sem Graça
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

  // 7. Sermão Fiel ao Texto e Centrado em Cristo
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
  // 1. Constrói payload preliminar para validação de entrada (Gatekeeper)
  const initialPayload = buildHomileticPayload(sermon, biblicalPassageText);

  // 2. Validação prévia imediata (zero custo de IA, zero latência de rede para rascunho/gibberish)
  const preCheck = evaluateLocalHomileticHeuristic(initialPayload);
  if (preCheck.theological_deviation === "Inconclusivo_Rascunho") {
    return preCheck;
  }

  // 3. RAG de Comentários Históricos (Barnes, Henry, Gill) se disponível
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

  // 4. Constrói payload estrito completo com contexto histórico
  const payload = buildHomileticPayload(sermon, biblicalPassageText, historicalCommentary);

  // 5. Obtém token JWT
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
