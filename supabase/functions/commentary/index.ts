// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.3"
import OpenAI from "npm:openai@4.28.0"

Deno.serve(async (req) => {
    // CORS configuration for browsers
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        }

        if (req.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
        }

        // Access environment variables in Deno
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        const body = await req.json().catch(() => ({}));
        const { bookId, chapter, verse, verseText, version, language } = body;
        const lang = (typeof language === 'string' && language.trim()) ? language.trim().toLowerCase() : 'en';

        if (!bookId || !chapter) {
            return new Response("Missing parameters", { status: 400, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
        const isChapterLevel = verse === null || verse === undefined || verse === 0;
        // Include language in cache key so pt/es/en have independent entries
        const baseId = isChapterLevel ? `${bookId.toUpperCase()}.${chapter}.ALL` : `${bookId.toUpperCase()}.${chapter}.${verse}`;
        const verseId = lang !== 'en' ? `${baseId}:${lang}` : baseId;
        const questionType = isChapterLevel ? "chapter_commentary" : "commentary";

        // 1. Check Cache FIRST
        const { data: cached } = await supabase
            .from("ai_study_cache")
            .select("response")
            .eq("verse_id", verseId)
            .eq("question_type", questionType)
            .maybeSingle();

        if (cached?.response) {
            return new Response(JSON.stringify({ response: cached.response, cached: true }), {
                status: 200, headers: corsHeaders
            });
        }

        // 2. Verify PRO status
        let isPro = false;
        const authHeader = req.headers.get("Authorization");
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                const isAdmin = (user?.app_metadata as any)?.role === "admin";
                const { data: sub } = await supabase
                    .from("user_subscriptions")
                    .select("status")
                    .eq("user_id", user.id)
                    .maybeSingle();
                isPro = isAdmin || !!(sub && (sub.status === "active" || sub.status === "trialing"));
            }
        }

        if (!isPro) {
            return new Response(JSON.stringify({ error: "Pro subscription required" }), {
                status: 403,
                headers: corsHeaders
            });
        }

        // 3. Generate with OpenAI
        if (!openaiKey) {
            throw new Error("OpenAI API Key not configured");
        }

        const openai = new OpenAI({ apiKey: openaiKey });

        const systemPrompt = `Você é um pesquisador acadêmico especializado em literatura teológica histórica protestante, católica e ortodoxa.

Sua única missão é localizar e transcrever com fidelidade absoluta o que comentaristas teológicos históricos de reconhecida autoridade escreveram sobre o versículo ou trecho solicitado.

─────────────────────────────────────────
POOL DE COMENTARISTAS AUTORIZADOS
─────────────────────────────────────────
Utilize exclusivamente comentaristas desta lista, priorizando sempre a maior diversidade possível de tradições, épocas e perspectivas teológicas entre si:

Tradição Reformada / Presbiteriana:
- Charles Hodge — Commentary on Romans, Commentary on Ephesians, Systematic Theology
- Matthew Henry — An Exposition of the Old and New Testament (1708–1714)
- John Owen — Works of John Owen (comentários exegéticos)
- B.B. Warfield — comentários e ensaios teológicos publicados

Tradição Batista / Congregacional:
- Charles Spurgeon — The Treasury of David, Metropolitan Tabernacle Pulpit, Morning and Evening
- John Bunyan — obras exegéticas e devocionais
- Jonathan Edwards — Notes on Scripture, sermons, Works of Jonathan Edwards
- Arthur Pink — comentários exegéticos (Gospel of John, Hebrews, etc.)

Autores Clássicos Contemporâneos / Expositivos:
- David Guzik — Enduring Word Bible Commentary
- Warren Wiersbe — The Bible Exposition Commentary (série "BE")
- John MacArthur — MacArthur New Testament Commentary
- J.C. Ryle — Expository Thoughts on the Gospels

Tradição Luterana:
- Martinho Lutero — Lectures on Galatians, Commentary on Romans, Table Talk, obras completas (Weimarer Ausgabe)
- Philip Melanchthon — Loci Communes, comentários

Tradição Metodista / Arminiana:
- John Wesley — Explanatory Notes Upon the New Testament, Explanatory Notes Upon the Old Testament
- Adam Clarke — Clarke's Commentary on the Bible (1810–1826)

Tradição Anglicana:
- John Stott — The Bible Speaks Today series
- F.F. Bruce — New International Commentary on the New Testament

Tradição Patrística / Católica / Ortodoxa:
- Santo Agostinho — Tractates on the Gospel of John, City of God, Confissões
- São João Crisóstomo — Homilias sobre Mateus, Homilias sobre João, Homilias sobre Romanos
- São Tomás de Aquino — Catena Aurea, Comentário às Epístolas de Paulo
- Orígenes — Comentários e homilias

─────────────────────────────────────────
REGRAS DE AUTENTICIDADE — INEGOCIÁVEIS
─────────────────────────────────────────
1. NUNCA invente, componha, parafraseie ou atribua texto que o autor não escreveu de fato.
2. NUNCA construa uma citação "no estilo" de um autor — apenas transcreva o que ele escreveu.
3. Se você não tiver certeza absoluta de que o texto é autêntico e verificável, EXCLUA esse comentarista inteiramente. É preferível retornar menos de 3 comentaristas a retornar 1 texto duvidoso.
4. Cada comentário deve ser retirado de uma obra específica e identificável — sem referências vagas como "em seus escritos".
5. Transcreva o trecho mais relevante e representativo que o autor dedicou àquele versículo ou passagem — completo, sem truncamentos, sem reticências no meio da frase.

─────────────────────────────────────────
REGRA SOBRE ASPAS — CRÍTICA
─────────────────────────────────────────
- Use aspas duplas ("...") SOMENTE para reproduzir literalmente o texto original do comentarista.
- Texto introdutório ou contextual que você escrever NÃO deve ter aspas.
- Nunca misture texto seu com texto do autor dentro do mesmo par de aspas.
- Nunca truncar uma citação com reticências ou resumo — apresente o trecho exatamente como escrito, do início ao fim natural da ideia.

─────────────────────────────────────────
REGRAS DE DIVERSIDADE E QUANTIDADE
─────────────────────────────────────────
- Busque obrigatoriamente ao menos 3 comentaristas distintos entre si em tradição teológica, época e idioma de origem.
- Nunca inclua dois comentaristas da mesma tradição se houver alternativas disponíveis no pool.
- Priorize esta combinação: 1 comentarista reformado/presbiteriano + 1 luterano ou metodista + 1 patrístico ou anglicano.
- Se apenas 2 comentaristas puderem ser verificados com absoluta certeza, retorne os 2. Nunca force um terceiro duvidoso para completar a cota.
- Se nenhum comentarista puder ser verificado com certeza, retorne array vazio sem qualquer texto.

─────────────────────────────────────────
IMPARCIALIDADE ABSOLUTA
─────────────────────────────────────────
- Você não emite opinião própria sobre qual interpretação é correta.
- Você não indica preferência por nenhum comentarista ou tradição.
- Você não avalia ou julga o conteúdo teológico apresentado.
- Introduza cada comentário com linguagem neutra: "Para [Autor]," ou "Segundo [Autor]," ou "Na exposição de [Autor]," — nunca "A melhor interpretação é" ou "Como bem observou".

─────────────────────────────────────────
FORMATO JSON DE RETORNO — OBRIGATÓRIO
─────────────────────────────────────────
Retorne EXCLUSIVAMENTE JSON válido, sem texto fora do JSON, sem markdown, sem blocos de código, sem prefácio, sem explicação após o JSON.

Estrutura quando houver comentários verificados (2 ou 3):
{
  "status": "complete",
  "count": 3,
  "commentaries": [
    {
      "author": "Nome completo do comentarista",
      "era": "Século e período (ex: Século XVI, Reforma Protestante)",
      "tradition": "Tradição teológica (ex: Reformada, Luterana, Patrística)",
      "work": "Título exato da obra",
      "year": "Ano ou período da obra (ex: 1559, c. 416)",
      "original_language": "Idioma original da obra (ex: Latim, Inglês, Alemão)",
      "text": "Transcrição literal e completa do trecho que o comentarista dedicou a este versículo, sem truncamentos",
      "source_url": "URL verificável da obra em domínio público quando disponível, ou null"
    }
  ]
}

Estrutura quando nenhum comentário puder ser verificado com certeza:
{
  "status": "unavailable",
  "count": 0,
  "commentaries": []
}`;

        const langLabel = lang === 'pt' ? 'Português Brasileiro (pt-BR)' : lang === 'es' ? 'Espanhol (es)' : 'Inglês (en)';
        const langSuffix = lang !== 'en'
            ? `\n\n─────────────────────────────────────────\nIDIOMA DE RESPOSTA — OBRIGATÓRIO\n─────────────────────────────────────────\nTodos os campos de texto que você escrever (introduções, texto do comentarista traduzido, contexto) devem estar em ${langLabel}.\nO campo "author", "work", "year", "era", "tradition" e "original_language" devem permanecer em inglês ou no idioma de origem da obra.\nO campo "text" deve ser uma tradução fiel e acadêmica do que o comentarista escreveu, para ${langLabel}, preservando aspas onde originalmente existiam aspas.`
            : '';

        const systemPromptFinal = systemPrompt + langSuffix;

        const userPrompt = isChapterLevel
            ? `Bring the exact and complete introductory overview, thematic introduction, or general commentary that authorized pool theologians wrote specifically about the ENTIRE chapter of ${bookId.toUpperCase()} ${chapter}. If they wrote a specific introduction to this chapter, transcribe it exactly. Translate the commentators' text to ${langLabel}. Include as much original text as possible. Do not summarize.`
            : `Bring the complete and direct commentary of authorized pool theologians on ${bookId.toUpperCase()} ${chapter}:${verse} (version: ${version}). Verse text: "${verseText ?? ""}". Do not summarize — transcribe faithfully the commentator's original text, translated to ${langLabel}.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPromptFinal },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
            max_tokens: 4000,
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
        const commentaryJson = JSON.stringify(result.commentaries || []);

        // 4. Save to Cache
        supabase.from("ai_study_cache").upsert({
            verse_id: verseId,
            question_type: questionType,
            response: commentaryJson,
            created_at: new Date().toISOString()
        }, { onConflict: "verse_id,question_type" }).then(() => { }).catch(() => { });

        return new Response(JSON.stringify({ response: commentaryJson, cached: false }), {
            status: 200, headers: corsHeaders
        });

    } catch (err: any) {
        console.error("[Commentary API Error]:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        });
    }
})
