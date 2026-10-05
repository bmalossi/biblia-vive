import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConnectionRequestBody {
  text: string;
  title?: string;
  category?: string;
  bibleRef?: {
    book?: string;
    slug?: string;
    chapter?: number;
    verse?: number;
    display?: string;
  };
  tags?: string[];
}

interface BibleConnection {
  reference: string;
  book_slug: string;
  chapter: number;
  verse: number;
  verse_text: string;
  explanation: string;
  jev_category: string;
  confidence: number;
}

function isMeaningfulText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 12) return false;

  // Bloco contínuo sem espaços (ex: "skdoaskdoaskdo", "asdfasdfasdf")
  if (!trimmed.includes(" ") && trimmed.length >= 8) return false;

  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) return false;

  // Caracteres repetitivos (ex: "aaaaaa", "kkkkkkk")
  if (/(.)\1{4,}/i.test(trimmed)) return false;

  // 5 ou mais consoantes seguidas sem vogais (padrão de digitação aleatória)
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(trimmed)) return false;

  return true;
}

function getFallbackForCategory(categoryOrJev: string): {
  jev_category: string;
  connections: BibleConnection[];
} {
  const norm = (categoryOrJev || "").toLowerCase();

  if (norm === "oracao" || norm === "resposta_de_oracao") {
    return {
      jev_category: "Resposta_de_Oracao",
      connections: [
        {
          reference: "Filipenses 4:6-7",
          book_slug: "fp",
          chapter: 4,
          verse: 6,
          verse_text:
            "Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e pela súplica, com ações de graças.",
          explanation:
            "O clamor colocado em oração encontra repouso na promessa de paz que excede todo o entendimento humano.",
          jev_category: "Resposta_de_Oracao",
          confidence: 0.94,
        },
        {
          reference: "Salmos 34:17",
          book_slug: "sl",
          chapter: 34,
          verse: 17,
          verse_text:
            "Clamam os justos, e o Senhor os escuta e os livra de todas as suas tribulações.",
          explanation:
            "A promessa de que nenhuma súplica sincera passa desapercebida pelo Senhor.",
          jev_category: "Resposta_de_Oracao",
          confidence: 0.91,
        },
      ],
    };
  }

  if (norm === "testemunho" || norm === "cumprimento_profetico") {
    return {
      jev_category: "Cumprimento_Profetico",
      connections: [
        {
          reference: "Salmos 126:3",
          book_slug: "sl",
          chapter: 126,
          verse: 3,
          verse_text:
            "Com efeito, grandes coisas fez o Senhor por nós; por isso, estamos alegres.",
          explanation:
            "O memorial de fidelidade testifica publicamente que a graça de Deus se manifestou de forma palpável na sua história.",
          jev_category: "Cumprimento_Profetico",
          confidence: 0.96,
        },
        {
          reference: "1 Samuel 7:12",
          book_slug: "1sm",
          chapter: 7,
          verse: 12,
          verse_text:
            "Tomou então Samuel uma pedra, e a pôs entre Mispá e Sem, e lhe chamou Ebenézer, e disse: Até aqui nos ajudou o Senhor.",
          explanation:
            "Como a pedra de Ebenézer, este registro funciona como um marco visível de auxílio divino preservado para a memória.",
          jev_category: "Cumprimento_Profetico",
          confidence: 0.93,
        },
      ],
    };
  }

  if (norm === "jejum" || norm === "contraste_de_alianca") {
    return {
      jev_category: "Contraste_de_Alianca",
      connections: [
        {
          reference: "Isaías 58:6",
          book_slug: "is",
          chapter: 58,
          verse: 6,
          verse_text:
            "Porventura não é este o jejum que escolhi: que soltes as ligaduras da impiedade, que desfaças as ataduras da servidão...?",
          explanation:
            "O jejum bíblico opera uma mudança interior de coração, alinhando a consagração pessoal à justiça e à misericórdia de Deus.",
          jev_category: "Contraste_de_Alianca",
          confidence: 0.95,
        },
      ],
    };
  }

  return {
    jev_category: "Eco_de_Linguagem",
    connections: [
      {
        reference: "Salmos 119:105",
        book_slug: "sl",
        chapter: 119,
        verse: 105,
        verse_text:
          "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.",
        explanation:
          "A reflexão sobre a Palavra ilumina as decisões práticas e discerne a direção divina em meio aos caminhos do leitor.",
        jev_category: "Eco_de_Linguagem",
        confidence: 0.95,
      },
      {
        reference: "Hebreus 4:12",
        book_slug: "hb",
        chapter: 4,
        verse: 12,
        verse_text:
          "Porque a palavra de Deus é viva e eficaz, e mais cortante do que qualquer espada de dois gumes...",
        explanation:
          "O texto das Escrituras penetra a consciência e molda o discernimento espiritual do coração.",
        jev_category: "Eco_de_Linguagem",
        confidence: 0.9,
      },
    ],
  };
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
    const typesafeApiKey = (Deno.env.get("TYPESAFE_API_KEY") ?? "").trim();
    const openAiApiKey = (
      Deno.env.get("OPENAI_API_KEY") ||
      Deno.env.get("GEMINI_API_KEY") ||
      ""
    ).trim();

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

    // 2. Extração dos dados do marco
    const body: ConnectionRequestBody = await req.json().catch(() => ({ text: "" }));
    const text = (body.text || "").trim();
    const title = (body.title || "").trim();
    const category = body.category || "reflexao";
    const bibleRef = body.bibleRef?.display || "";
    const tags = Array.isArray(body.tags) ? body.tags.join(", ") : "";

    // 3. Validação anti-gibberish inicial via regex
    if (!isMeaningfulText(text)) {
      return new Response(
        JSON.stringify({
          connections: [],
          jev_category: "Eco_de_Linguagem",
          empty: true,
          message: "Texto insuficiente ou sem padrão de reflexão para identificação de conexões bíblicas.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Avaliação preliminar via TypeSafe JEV (System One) — rápida (~150ms) e sem custo de saída
    let jevDeterminedCategory: string | null = null;
    let jevConfidence = 0.90;

    if (typesafeApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const jevPayload = {
          model: "jev-latest",
          state: `[MARCO DE FÉ DO LEITOR]\nTipo informado: ${(category || "reflexao").toUpperCase()}\nTítulo: ${title || "Sem título"}\nPassagem bíblica de referência: ${bibleRef || "Nenhuma"}\nTags: ${tags || "Nenhuma"}\nRelato:\n"""\n${text.slice(0, 3500)}\n"""`,
          questions: {
            is_coherent_reflection: {
              type: "noul",
              instructions:
                "O relato expressa um pensamento, oração, reflexão bíblica, testemunho ou experiência de fé com sentido humano real (e NÃO digitação de teste aleatória, repetições mecânicas sem sentido ou caracteres desconexos tipo 'skdoaskdoaskdo')?",
            },
            primary_jev_category: {
              type: "choice",
              instructions: "Qual a categoria tipológica canônica principal desta experiência de fé?",
              criteria: {
                Cumprimento_Profetico: "Testemunho de fidelidade, promessa bíblica cumprida, bênção ou vitória recebida da graça de Deus",
                Eco_de_Linguagem: "Meditação na Palavra, sabedoria, luz para os passos, metáfora ou ressonância de termos bíblicos",
                Contraste_de_Alianca: "Quebrantamento, jejum, consagração interior, transição da lei e obras para a graça imerecida",
                Resposta_de_Oracao: "Petição, súplica, clamor expresso ou confiança na providência divina em meio à ansiedade",
              },
            },
          },
        };

        const jevRes = await fetch("https://api.typesafe.ai/v1/systemone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${typesafeApiKey}`,
          },
          body: JSON.stringify(jevPayload),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (jevRes.ok) {
          const jevData = await jevRes.json();
          const answers = jevData?.answers || jevData?.results || jevData;
          const qCoherent = answers?.is_coherent_reflection;
          const qCat = answers?.primary_jev_category;

          let coherenceProb = 1.0;
          if (qCoherent) {
            if (typeof qCoherent.probability === "number") coherenceProb = qCoherent.probability;
            else if (typeof qCoherent.noul === "number") coherenceProb = qCoherent.noul;
            else if (typeof qCoherent.answer === "number") coherenceProb = qCoherent.answer;
          }

          // Se o JEV classificar como texto sem significado real (< 0.60), encerra imediatamente sem chamar OpenAI
          if (coherenceProb < 0.60) {
            console.log(`[memorial-connections] TypeSafe JEV detectou texto sem sentido espiritual (coerência: ${coherenceProb.toFixed(3)}). Rejeitando sem chamar OpenAI.`);
            return new Response(
              JSON.stringify({
                connections: [],
                jev_category: "Eco_de_Linguagem",
                empty: true,
                message: "Texto não possui conteúdo semântico ou reflexivo para conexões bíblicas.",
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          if (qCat) {
            const chosen = qCat.choice || qCat.answer;
            if (chosen && typeof chosen === "string") {
              jevDeterminedCategory = chosen;
            }
            if (typeof qCat.confidence === "number") {
              jevConfidence = qCat.confidence;
            }
          }
          console.log(`[memorial-connections] TypeSafe JEV classificou categoria: ${jevDeterminedCategory} (confiança: ${jevConfidence})`);
        } else {
          console.warn("[memorial-connections] TypeSafe JEV status HTTP:", jevRes.status);
        }
      } catch (jevErr) {
        console.warn("[memorial-connections] Erro ao consultar TypeSafe JEV:", jevErr);
      }
    }

    const effectiveCategory = jevDeterminedCategory || (
      category === "oracao" ? "Resposta_de_Oracao" :
      category === "testemunho" ? "Cumprimento_Profetico" :
      category === "jejum" ? "Contraste_de_Alianca" :
      "Eco_de_Linguagem"
    );

    // 5. Se temos chave OpenAI (ou similar), invocar gpt-4o-mini para identificar versículos canônicos e explicações
    if (openAiApiKey) {
      const systemPrompt = `Você é o motor de hermenêutica bíblica e inteligência teológica do Memorial (Bíblia Vive).
Sua missão solene é analisar o relato de fé do leitor (uma oração, um testemunho de milagre/provisão, uma reflexão bíblica ou um propósito de jejum) e identificar de 1 a 3 passagens bíblicas canônicas fundamentais que convergem com aquela experiência vivida.

DIRETRIZES FUNDAMENTAIS:
1. Reverência e Gravitas: A IA atua como uma lâmpada para as Escrituras, jamais como conselheiro loquaz ou bajulador. Sem AI slop, sem floreios vazios.
2. Fidelidade Textual: Citações das Escrituras devem corresponder estritamente ao texto bíblico em português (Almeida ARA/ARC). Nunca alucine versículos.
3. Se o relato for sem sentido, texto aleatório de teste, ou irrelevante espiritualmente, retorne "connections": [].
4. Taxonomia TypeSafe JEV:
   A categoria principal já pré-classificada para este relato é: "${effectiveCategory}".
   Classifique cada conexão retornada nessa taxonomia:
   - "Cumprimento_Profetico": prefiguração, tipo e antítipo, promessa bíblica cumprida na aliança ou na vida do leitor.
   - "Eco_de_Linguagem": ressonância temática, repetição de termos ou metáforas bíblicas fundamentais.
   - "Contraste_de_Alianca": distinção reveladora entre sombra e substância, lei e graça, obras humanas e favor divino.
   - "Resposta_de_Oracao": clamor, súplica ou petição do leitor que encontra evidência de providência ou intervenção divina nas Escrituras.

FORMATO DE SAÍDA:
Retorne OBRIGATORIAMENTE um objeto JSON válido no seguinte formato:
{
  "primary_jev_category": "${effectiveCategory}",
  "connections": [
    {
      "reference": "Salmos 34:18",
      "book_slug": "sl",
      "chapter": 34,
      "verse": 18,
      "verse_text": "Perto está o Senhor dos que têm o coração quebrantado, e salva os de espírito oprimido.",
      "explanation": "Explicação editorial breve e profunda (máx 2 frases) de como esta passagem ressoa com a experiência do leitor.",
      "jev_category": "${effectiveCategory}",
      "confidence": 0.95
    }
  ]
}
Regras para book_slug: use slugs bíblicos padronizados em minúsculas (ex: gn, ex, lv, nm, dt, js, jz, rt, 1sm, 2sm, 1rs, 2rs, 1cr, 2cr, ed, ne, et, jo, sl, pv, ec, ct, is, jr, lm, ez, dn, os, jl, am, ob, jn, mq, na, hc, sf, ag, zc, ml, mt, mc, lc, joa, at, rm, 1co, 2co, gl, ef, fp, cl, 1ts, 2ts, 1tm, 2tm, tt, fm, hb, tg, 1pe, 2pe, 1jo, 2jo, 3jo, jd, ap).`;

      const userPrompt = `DADOS DO MARCO DE FÉ:
- Categoria Dominante: ${effectiveCategory}
- Título: ${title || "Sem título específico"}
- Passagem Associada Inicialmente: ${bibleRef || "Nenhuma informada"}
- Tags: ${tags || "Nenhuma"}
- Relato do Leitor:
"""
${text}
"""

Analise com solenidade e retorne as conexões bíblicas no formato JSON estrito.`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const contentText = aiData?.choices?.[0]?.message?.content || "{}";
          const parsed = JSON.parse(contentText);

          const validCategories = [
            "Cumprimento_Profetico",
            "Eco_de_Linguagem",
            "Contraste_de_Alianca",
            "Resposta_de_Oracao",
          ];

          const primaryCategory = validCategories.includes(parsed.primary_jev_category)
            ? parsed.primary_jev_category
            : effectiveCategory;

          const rawConnections = Array.isArray(parsed.connections) ? parsed.connections : [];
          const connections: BibleConnection[] = rawConnections.map((c: any) => ({
            reference: String(c.reference || "Escritura Sagrada"),
            verse_text: String(c.verse_text || ""),
            explanation: String(c.explanation || ""),
            book_slug: String(c.book_slug || "sl").toLowerCase(),
            chapter: Number(c.chapter) || 1,
            verse: Number(c.verse) || 1,
            jev_category: validCategories.includes(c.jev_category)
              ? c.jev_category
              : primaryCategory,
            confidence: typeof c.confidence === "number" ? c.confidence : jevConfidence,
          }));

          return new Response(
            JSON.stringify({
              connections,
              jev_category: primaryCategory,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (aiErr) {
        console.warn("[memorial-connections] Falha ao consultar OpenAI, avaliando fallback:", aiErr);
      }
    }

    // 6. Fallback somente se o texto for significativo (nunca para digitação aleatória)
    const fallback = getFallbackForCategory(effectiveCategory);
    return new Response(
      JSON.stringify(fallback),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[memorial-connections] Exceção:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erro interno ao processar conexões" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
