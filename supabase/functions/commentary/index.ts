// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.3"
import OpenAI from "npm:openai@4.28.0"
import { Ratelimit } from "npm:@upstash/ratelimit@2"
import { Redis } from "npm:@upstash/redis@1"


const RATE_LIMIT = 10;


// ─── Author metadata dictionary ───────────────────────────────────────────────
const AUTHOR_METADATA: Record<string, {
    author: string;
    era: string;
    tradition: string;
    work: string;
    year: string;
    original_language: string;
}> = {
    barnes: { author: "Albert Barnes", era: "Século XIX, Era Pós-Reforma", tradition: "Presbiteriana, Evangélica", work: "Notes on the Bible", year: "N/A", original_language: "Inglês" },
    clarke: { author: "Adam Clarke", era: "Século XVIII-XIX", tradition: "Metodista, Arminiana", work: "Commentary on the Bible", year: "1810–1826", original_language: "Inglês" },
    darby: { author: "John Nelson Darby", era: "Século XIX", tradition: "Plymouth Brethren, Dispensacionalista", work: "Synopsis of the Books of the Bible", year: "1857-1862", original_language: "Inglês" },
    geneva: { author: "Reformadores de Genebra", era: "Século XVI, Reforma Protestante", tradition: "Reformada, Calvinista, Puritana", work: "The Geneva Bible Translation Notes", year: "1599", original_language: "Inglês" },
    gill: { author: "John Gill", era: "Século XVIII, Pós-Reforma", tradition: "Batista Reformada, Calvinista", work: "Exposition of the Entire Bible", year: "1746-1763", original_language: "Inglês" },
    henry: { author: "Matthew Henry", era: "Século XVII-XVIII", tradition: "Não-conformista Puritan, Calvinista", work: "Complete Commentary on the Whole Bible", year: "1708-1714", original_language: "Inglês" },
    mhc: { author: "Matthew Henry", era: "Século XVII-XVIII", tradition: "Não-conformista Puritan, Calvinista", work: "Concise Commentary on the Whole Bible", year: "1708-1710", original_language: "Inglês" },
    mhcc: { author: "Matthew Henry", era: "Século XVII-XVIII", tradition: "Não-conformista Puritan, Calvinista", work: "Concise Commentary on the Whole Bible", year: "1708-1710", original_language: "Inglês" },
    jfb: { author: "Jamieson, Fausset, Brown", era: "Século XIX, Era Vitoriana", tradition: "Presbiteriana e Anglicana, Evangélica", work: "A Commentary, Critical, Practical, and Explanatory", year: "1871", original_language: "Inglês" },
    kd: { author: "Carl Friedrich Keil, Franz Delitzsch", era: "Século XIX, Era Moderna", tradition: "Luterana Alemã, Conservadora", work: "Biblical Commentary on the Old Testament", year: "1857-1878", original_language: "Alemão" },
    johnson: { author: "B.W. Johnson", era: "Século XIX, Movimento de Restauração", tradition: "Discípulos de Cristo, Dispensacionalista", work: "The People's New Testament", year: "1891", original_language: "Inglês" },
    spurgeon: { author: "Charles Haddon Spurgeon", era: "Século XIX, Era Vitoriana", tradition: "Batista Reformada, Calvinista", work: "The Treasury of David", year: "1869-1885", original_language: "Inglês" },
    scofield: { author: "Cyrus Ingerson Scofield", era: "Século XX, Era Moderna", tradition: "Presbiteriana, Dispensacionalista", work: "Scofield Reference Notes", year: "1909", original_language: "Inglês" },
    torrey: { author: "R. A. Torrey", era: "Século XIX-XX, Despertamento", tradition: "Evangélica, Fundamentalista", work: "Treasury of Scriptural Knowledge", year: "ca. 1880", original_language: "Inglês" },
    vincent: { author: "Marvin R. Vincent", era: "Século XIX, Era Pós-Guerra Civil", tradition: "Episcopal, Evangélica", work: "Vincent's Word Studies", year: "1887", original_language: "Inglês" },
    wesley: { author: "John Wesley", era: "Século XVIII, Despertamento Metodista", tradition: "Metodista, Arminiana", work: "Explanatory Notes on the Whole Bible", year: "1754-1765", original_language: "Inglês" },
};


// ─── Extrai seção do versículo do texto completo do capítulo ──────────────────
function extractVerseSection(content: string, verse: number, maxChars = 5000, chapter?: number): string {
    const patterns = [
        new RegExp(`(?:Verse|Ver\\.)\\s*${verse}[:.)(]([\\s\\S]*?)(?=(?:Verse|Ver\\.)\\s*${verse + 1}[:.)(]|$)`, 'i'),
        new RegExp(`(?:^|\\n)\\s*${verse}[.:]\\s+([\\s\\S]*?)(?=\\n\\s*${verse + 1}[.:]|$)`, 'm'),
        new RegExp(`(?:v\\.\\s*|\\()${verse}[).:]([\\s\\S]*?)(?=(?:v\\.\\s*|\\()${verse + 1}[).:])`, 'i'),
        new RegExp(`\\[[^\\]]*[:\\s]${verse}\\b[^\\]]*\\](?:[^\\n]*\\n){0,3}([\\s\\S]*?)(?=\\[[^\\]]*[:\\s]${verse + 1}\\b[^\\]]*\\]|$)`, 'i'),
    ];

    for (const re of patterns) {
        const match = content.match(re);
        const extracted = match?.[1]?.trim();
        if (extracted && extracted.length > 40) return extracted.slice(0, maxChars);
    }

    // P5: encontra a última ocorrência de chapter:verse (ex: "32:32")
    const p5Re = chapter
        ? new RegExp(`${chapter}:${verse}(?!\\d)`, 'g')
        : new RegExp(`\\d+:${verse}(?!\\d)`, 'g');

    let lastIdx = -1;
    let m: RegExpExecArray | null;
    while ((m = p5Re.exec(content)) !== null) { lastIdx = m.index; }

    if (lastIdx !== -1) {
        const afterLast = content.slice(lastIdx + 1);

        // ✅ FIX: busca o PRÓXIMO versículo do mesmo capítulo com número > verse
        // Antes buscava apenas verse+1 — autores como JFB pulam versículos (32:32 → 32:44)
        // e o fallback de 2000 chars engolia versículos seguintes desnecessariamente
        const nextAnyVerseRe = new RegExp(
            chapter ? `${chapter}:(\\d+)(?!\\d)` : `\\d+:(\\d+)(?!\\d)`,
            'g'
        );

        let nextBoundaryIdx = -1;
        let nm: RegExpExecArray | null;
        while ((nm = nextAnyVerseRe.exec(afterLast)) !== null) {
            const foundVerse = parseInt(nm[1], 10);
            if (foundVerse > verse) {
                nextBoundaryIdx = nm.index;
                break;
            }
        }

        const end = nextBoundaryIdx > 0 ? lastIdx + 1 + nextBoundaryIdx : lastIdx + maxChars;
        const excerpt = content.slice(lastIdx, Math.min(end, lastIdx + maxChars)).trim();
        if (excerpt.length > 40) return excerpt;
    }

    return "";
}

// ─── [NOVO] Define tamanho máximo do chunk pelo score de similaridade ─────────
function chunkSizeByScore(score: number): number {
    if (score >= 0.85) return 4000;
    if (score >= 0.70) return 2500;
    return 1500;
}

function stripSacredTextsHeader(text: string): string {
    return text
        .split('\n')
        .filter(line => {
            const t = line.trim();
            if (t === '') return true;
            if (/^Índice de /i.test(t)) return false;
            if (/^Index of /i.test(t)) return false;
            if (/^\w+ Index$/i.test(t)) return false;
            if (/^Anterior\s+Próximo/i.test(t)) return false;
            if (/^Previous\s+Next/i.test(t)) return false;
            if (/^Capítulo\s+\d+\s+de\s+/i.test(t)) return false;
            if (/^Chapter\s+\d+\s+of\s+/i.test(t)) return false;
            if (/^\w+\s+Chapter\s+\d+$/i.test(t)) return false;
            if (/sacred-texts\.com/i.test(t)) return false;
            if (/^[a-z]{2,5}\s+\d+:\d+$/i.test(t)) return false;
            if (/^[A-ZÀ-Ú][a-zà-ú]+$/.test(t) && t.length < 20) return false;
            // [NOVO] Remove linhas de índice: "(Jos 21:1-8) Título..." ou "(v. 9-42) Título..."
            if (/^\([A-Za-z\.]+\s+\d+:\d+[\d\-]*\)\s+\S/.test(t)) return false;
            if (/^\(v\.\s*\d+[\d\-]*\)\s+\S/.test(t)) return false;
            return true;
        })
        .join('\n')
        .replace(/^\n+/, '')
        .trim();
}

// ─── Build rate limit headers ─────────────────────────────────────────────────
function buildRateLimitHeaders(
    corsHeaders: Record<string, string>,
    remaining: number,
    resetAt: number
): Record<string, string> {
    return {
        ...corsHeaders,
        'X-RateLimit-Limit': String(RATE_LIMIT),
        'X-RateLimit-Remaining': String(Math.max(0, remaining)),
        'X-RateLimit-Reset': String(resetAt),
    };
}


Deno.serve(async (req) => {
    console.log("[Commentary] Request received:", req.method, req.url);

    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                'Access-Control-Max-Age': '86400',
            }
        });
    }

    const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset'
    };

    try {
        if (req.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
        }

        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        const body = await req.json().catch(() => ({}));
        const { bookId, chapter, verse, verseText, version, language } = body;
        const lang = (typeof language === 'string' && language.trim())
            ? language.trim().toLowerCase()
            : 'pt';

        if (!bookId || !chapter) {
            return new Response("Missing parameters", { status: 400, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
        const isChapterLevel = verse === null || verse === undefined || verse === 0;

        // ── Cache key ──────────────────────────────────────────────────────────
        const baseId = isChapterLevel ? `${bookId.toUpperCase()}.${chapter}.ALL` : `${bookId.toUpperCase()}.${chapter}.${verse}`;
        const verseId = lang !== 'en' ? `${baseId}:${lang}` : baseId;
        const questionType = isChapterLevel ? "chapter_commentary" : "commentary";

        // ── 1. Check cache ─────────────────────────────────────────────────────
        const { data: cached } = await supabase
            .from("ai_study_cache")
            .select("response")
            .eq("verse_id", verseId)
            .eq("question_type", questionType)
            .maybeSingle();

        if (cached?.response) {
            return new Response(JSON.stringify({ response: cached.response, cached: true }), { status: 200, headers: corsHeaders });
        }

        // ── 2. Verify PRO status & get user_id ────────────────────────────────
        let isPro = false;
        let userId: string | null = null;
        const authHeader = req.headers.get("Authorization");
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                userId = user.id;
                const isAdmin = user.app_metadata?.role === "admin";
                const { data: sub, error: subError } = await supabase
                    .from("user_subscriptions")
                    .select("status")
                    .eq("user_id", user.id)
                    .maybeSingle();
                if (subError) console.error("[Commentary] Sub error:", subError);
                isPro = isAdmin || !!(sub && (sub.status === "active" || sub.status === "trialing"));
                console.log("[Commentary] Auth check:", { userId: user.id, isAdmin, isPro });
            }
        }

        // ── 3. Rate limiting ──────────────────────────────────────────────────
        const upstashUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
        const upstashToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

        if (upstashUrl && upstashToken) {
            const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
            const redis = new Redis({ url: upstashUrl, token: upstashToken });
            const ratelimitId = isPro && userId ? `user:${userId}` : `ip:${clientIp}`;
            const limitConfig = isPro
                ? Ratelimit.slidingWindow(RATE_LIMIT, "1 h")
                : Ratelimit.slidingWindow(1, "1 d");
            const ratelimit = new Ratelimit({ redis, limiter: limitConfig, prefix: "bv:commentary" });
            const { success, limit, remaining, reset } = await ratelimit.limit(ratelimitId);
            const rlHeaders = buildRateLimitHeaders(corsHeaders, remaining, reset);
            if (!success) {
                console.log(`[Commentary] Rate limit hit for user: ${userId}`);
                return new Response(
                    JSON.stringify({ error: "limite_atingido", message: "Você atingiu o limite de comentários desta hora.", reset_at: reset, limit: RATE_LIMIT }),
                    { status: 429, headers: rlHeaders }
                );
            }
            Object.assign(corsHeaders, {
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': String(remaining),
                'X-RateLimit-Reset': String(reset),
            });
        }

        // ── 4. RAG: busca semântica em commentary_chunks ──────────────────────
        if (!openaiKey) throw new Error("OpenAI API Key not configured");

        const openai = new OpenAI({ apiKey: openaiKey });
        const bookCode = bookId.toLowerCase();
        const chapterPadded = String(chapter).padStart(3, '0');
        const chapterNum = parseInt(String(chapter), 10);
        const verseNum = parseInt(String(verse), 10);

        const verseLabel = isChapterLevel
            ? `${bookId.toUpperCase()} capítulo ${chapter} (visão geral)`
            : `${bookId.toUpperCase()} ${chapter}:${verse}`;

        const embeddingInput = isChapterLevel
            ? `${bookId.toUpperCase()} chapter ${chapter} overview`
            : `${bookId.toUpperCase()} ${chapter}:${verse} ${verseText ?? ""}`.slice(0, 8000);

        const embResp = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: embeddingInput,
        });

        const queryEmbedding = embResp.data[0].embedding;

        const { data: chunks, error: semError } = await supabase.rpc(
            "match_commentary_chunks",
            {
                query_embedding: queryEmbedding,
                book_filter: bookCode,
                chapter_filter: chapterPadded,
                verse_filter: isChapterLevel ? null : verseNum,
                match_count: 6,
            }
        );

        if (semError) console.error("[Commentary] Semantic search error:", semError);

        if (!chunks || chunks.length === 0) {
            const emptyResponse = JSON.stringify({ status: "unavailable", count: 0, commentaries: [] });
            return new Response(JSON.stringify({ response: emptyResponse, cached: false }), { status: 200, headers: corsHeaders });
        }

        // DEBUG TEMPORÁRIO — remover após confirmar
        console.log("[Commentary] chunks RAW:", JSON.stringify(
            chunks?.map((c: any) => ({ author: c.author, verse: c.verse, content_len: c.content?.length }))
        ));

        // ← ADICIONA AQUI
        console.log("[Commentary] chunks VERSE field:", JSON.stringify(
            chunks?.map((c: any) => ({ author: c.author, verse: c.verse, verse_type: typeof c.verse }))
        ));

        // ── 5. Montar snippets a partir dos chunks ────────────────────────────
        // IMPORTANTE: filtro usa conteúdo BRUTO (antes da limpeza) para detectar ":0"
        const filteredChunks = isChapterLevel
            ? chunks.filter((c: any) =>
                new RegExp(`${bookCode}\\s+${chapterNum}:0\\b`, 'i').test(c.content ?? '')
            )
            : chunks;


        const authorSnippets: { slug: string; meta: (typeof AUTHOR_METADATA)[string]; excerpt: string; url: string }[] =
            filteredChunks
                .filter((row: any) => {
                    if (!row.content || row.content.length <= 30) return false;
                    // Descarta chunk que, após limpeza, começa direto em versículo individual
                    const preCleaned = stripSacredTextsHeader(row.content as string);
                    const verseAtStartRe = new RegExp(
                        `^[ \\t]*(?:\\w+\\.?\\s+${chapterNum}:[1-9]|\\(\\w+\\.?\\s+${chapterNum}:[1-9])`,
                        'im'
                    );
                    if (verseAtStartRe.test(preCleaned.trimStart().slice(0, 50))) {
                        console.log(`[Commentary] Chunk descartado (sem intro): ${row.author}`);
                        return false;
                    }
                    return true;
                })
                .map((row: any) => {
                    // Limpeza do cabeçalho APÓS o filtro — não interfere na detecção do ":0"
                    const full = stripSacredTextsHeader(row.content as string);
                    let cleaned = full;

                    // Para capítulo: corta antes do primeiro BLOCO de versículo individual
                    if (isChapterLevel) {
                        const verseBlockRe = new RegExp(
                            `(?:^|\\n)[ \\t]*(?:` +
                            `Verse\\s+[1-9]|` +                              // "Verse 1"
                            `Ver\\.\\s+[1-9]|` +                             // "Ver. 1"
                            `\\w+\\.?\\s+${chapterNum}:[1-9]\\d*[ \\t]*$|` + // "Joshua 21:1" ou "Jos. 21:1" sozinho na linha
                            `\\(\\w+\\.?\\s+${chapterNum}:[1-9]|` + // "(Jos 21:1" ou "(Joshua 21:1"
                            `^[1-9]\\d*\\.\\s+[A-Z]` +                        // "1. The Lord..."
                            `)`,
                            'im'
                        );
                        const firstBlock = cleaned.search(verseBlockRe);
                        if (firstBlock > 50) {
                            cleaned = cleaned.slice(0, firstBlock).trim();
                        }
                    }

                    // Trunca por score de similaridade no último parágrafo completo
                    const maxLen = chunkSizeByScore(row.similarity ?? 1);
                    let excerpt = cleaned;

                    if (cleaned.length > maxLen) {
                        const cutPoint = cleaned.lastIndexOf('\n\n', maxLen);
                        excerpt = cutPoint > maxLen * 0.5
                            ? cleaned.slice(0, cutPoint).trim()
                            : cleaned.slice(0, maxLen).trim();
                    }
                    // DEBUG TEMPORÁRIO — remover após confirmar
                    console.log(`[Commentary] excerpt[${row.author}] (300):`, cleaned.slice(0, 300));

                    return {
                        slug: row.author,
                        meta: AUTHOR_METADATA[row.author] ?? { author: row.author, era: "Desconhecido", tradition: "Desconhecida", work: "Sacred Texts Commentary", year: "N/A", original_language: "Inglês" },
                        excerpt,
                        url: row.url ?? "",
                    };
                });


        if (authorSnippets.length === 0) {
            const emptyResponse = JSON.stringify({ status: "unavailable", count: 0, commentaries: [] });
            return new Response(JSON.stringify({ response: emptyResponse, cached: false }), { status: 200, headers: corsHeaders });
        }

        // DEBUG TEMPORÁRIO
        console.log("[Commentary] filteredChunks authors:", filteredChunks.map((c: any) => c.author));
        console.log("[Commentary] authorSnippets authors:", authorSnippets.map((s: any) => s.slug));
        // ── [NOVO] 5b. Pré-selecionar top 3 por tamanho do excerpt ───────────
        const authorSnippetsForGPT = isChapterLevel
            ? [...authorSnippets]
                .sort((a, b) => b.excerpt.length - a.excerpt.length)
                .slice(0, 3)
            : authorSnippets;

        // ── 6. Helpers de prompt ──────────────────────────────────────────────
        const buildAuthorBlocks = (snippets: typeof authorSnippets) =>
            snippets.map(s => `[AUTOR: ${s.meta.author}]\n[SLUG: ${s.slug}]\nExcerto original:\n"""\n${s.excerpt}\n"""`).join('\n\n---\n\n');

        const buildMetaLine = (snippets: typeof authorSnippets) =>
            snippets.map(s => `- ${s.slug}: author="${s.meta.author}", era="${s.meta.era}", tradition="${s.meta.tradition}", work="${s.meta.work}", year="${s.meta.year}", original_language="${s.meta.original_language}", source_url="${s.url}"`).join('\n');

        // ── Step 6a: systemPrompt — apenas seleciona e estrutura (sem tradução) ─
        const systemPrompt = `Você é um especialista em teologia histórica cristã.
Sua função é SELECIONAR e ESTRUTURAR trechos de comentaristas históricos — nunca reescrever, resumir ou parafrasear.
O campo "text" deve conter o trecho original copiado palavra por palavra, sem nenhuma alteração.

TAREFA:
1. Identificar os trechos onde o autor fala DIRETAMENTE sobre: ${verseLabel}.
2. Selecionar NO MÁXIMO 3 autores com as explicações mais diretas.
3. Para cada autor:
   - COPIE o trecho original palavra por palavra, sem omitir nada.
   - Preserve pontuação, travessões e referências bíblicas (ex: "Isa 37:28-29").
   - NÃO remova, reorganize ou adicione nada.
4. Retorne SOMENTE JSON válido.

PROIBIÇÕES:
- É PROIBIDO resumir, parafrasear ou reescrever.
- É PROIBIDO inventar trechos que não estejam na fonte original.

Schema de retorno JSON:
{
  "status": "complete",
  "count": <número entre 1 e 3>,
  "commentaries": [
    {
      "author": "<nome completo>",
      "era": "<era>",
      "tradition": "<tradição>",
      "work": "<obra>",
      "year": "<ano>",
      "original_language": "<idioma>",
      "text": "<trecho original copiado literalmente>",
      "source_url": "<url ou null>"
    }
  ]
}`;

        const buildUserPrompt = (blocks: string, meta: string) =>
            `Localize a porção que fala do versículo alvo (${verseLabel}), isole OS 3 MAIS COMPLETOS e estruture-os.\nVersículo alvo: "${verseText ?? ""}"\n\n${blocks}\n\nMetadados (use exatamente estes valores):\n${meta}`;

        // ── 6a. Chamada RAG — skip se todos os chunks são nível de capítulo ────
        const hasVerseSpecificChunks = !isChapterLevel &&
            chunks.some((c: any) => c.verse !== null && c.verse === verseNum);

        let result: any = { status: "unavailable", count: 0, commentaries: [] };

        if (isChapterLevel || hasVerseSpecificChunks) {
            const completion = await openai.chat.completions.create({
                model: "gpt-5-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: buildUserPrompt(buildAuthorBlocks(authorSnippetsForGPT), buildMetaLine(authorSnippetsForGPT)) }
                ],
                max_completion_tokens: 5000,
                temperature: 1,
                response_format: { type: "json_object" },
            });

            const rawContent = completion.choices[0]?.message?.content || "{}";
            console.log("[Commentary] RAG rawContent (200):", rawContent.slice(0, 200));

            try { result = JSON.parse(rawContent); }
            catch { result = null; }
            if (!result?.status || !Array.isArray(result?.commentaries)) {
                result = { status: "unavailable", count: 0, commentaries: [] };
            }
        } else {
            console.log("[Commentary] RAG GPT skip — chunks nível de capítulo, indo direto ao fallback");
        }

        // ── 6b. FALLBACK: monta JSON direto em código, sem GPT ────────────────
        // GPT não é necessário aqui — extração já foi feita por extractVerseSection.
        // A tradução será feita pelo step 6c (gpt-4.1-nano) separadamente.
        if (result.commentaries.length === 0 && !isChapterLevel) {
            console.log("[Commentary] Fallback acionado para", verseLabel);

            const { data: fallbackRows } = await supabase
                .from("commentaries")
                .select("author, content, url")
                .eq("book_code", bookCode)
                .eq("chapter", chapterPadded)
                .order("author");

            if (fallbackRows && fallbackRows.length > 0) {
                const verseSpecificRe = new RegExp(`${chapterNum}:${verseNum}(?!\\d)`);

                const fallbackSnippets = fallbackRows
                    .map((row: any) => {
                        const excerpt = extractVerseSection(row.content ?? "", verseNum, 6000, chapterNum);
                        return {
                            slug: row.author,
                            meta: AUTHOR_METADATA[row.author] ?? { author: row.author, era: "Desconhecido", tradition: "Desconhecida", work: "Sacred Texts Commentary", year: "N/A", original_language: "Inglês" },
                            excerpt,
                            url: row.url ?? "",
                            isVerseSpecific: verseSpecificRe.test(excerpt),
                        };
                    })
                    .filter((s: any) => s.isVerseSpecific && s.excerpt.length > 30)
                    .sort((a: any, b: any) => b.excerpt.length - a.excerpt.length)
                    .slice(0, 3);

                console.log("[Commentary] Fallback verse-specific autores:", fallbackSnippets.map((s: any) => s.slug).join(", "));
                console.log("[Commentary] Fallback excerpt[0] (200):", fallbackSnippets[0]?.excerpt?.slice(0, 200));

                if (fallbackSnippets.length > 0) {
                    // Monta o JSON estruturado direto — sem chamada GPT
                    result = {
                        status: "complete",
                        count: fallbackSnippets.length,
                        commentaries: fallbackSnippets.map((s: any) => ({
                            author: s.meta.author,
                            era: s.meta.era,
                            tradition: s.meta.tradition,
                            work: s.meta.work,
                            year: s.meta.year,
                            original_language: s.meta.original_language,
                            text: s.excerpt,   // inglês — será traduzido no step 6c
                            source_url: s.url || null,
                        })),
                    };
                    console.log("[Commentary] Fallback count:", result.count);
                } else {
                    console.log("[Commentary] Fallback: nenhum autor com nota verse-specific para", verseLabel);
                }
            }
        }

        // ── 6c. TRADUÇÃO: gpt-4.1-nano — só executa se lang !== 'en' ──────────
        if (result.commentaries?.length > 0 && lang !== 'en') {
            const langLabel = lang === 'pt' ? 'Português Brasileiro (pt-BR)' : lang === 'es' ? 'Espanhol (es)' : lang;

            for (let i = 0; i < result.commentaries.length; i++) {
                const original = result.commentaries[i].text;
                if (!original || original.length < 10) continue;

                try {
                    const translateCompletion = await openai.chat.completions.create({
                        model: "gpt-4.1-nano",
                        messages: [{
                            role: "user", content:
                                `Traduza fielmente e em sua completude o texto abaixo para ${langLabel}.\n` +
                                `Regras:\n` +
                                `- Preserve referências bíblicas (ex: "Isa 37:28"), travessões (—) e pontuação do autor.\n` +
                                `- Não parafraseie, não resuma, não adicione palavras.\n` +
                                `- Retorne APENAS a tradução, sem explicações, sem JSON, sem marcadores.\n\n` +
                                `Texto:\n${original}`
                        }],
                        max_completion_tokens: 6000,
                        temperature: 0.1,
                    });

                    const translated = translateCompletion.choices[0]?.message?.content?.trim() || "";
                    if (translated.length > 10) {
                        result.commentaries[i].text = translated;
                        console.log(`[Commentary] Tradução aplicada: comentário ${i} (${result.commentaries[i].author})`);
                    } else {
                        console.warn(`[Commentary] Tradução vazia para comentário ${i} — mantendo inglês`);
                    }
                } catch (translateErr: any) {
                    console.error(`[Commentary] Translation error comentário ${i} (mantendo inglês):`, translateErr?.message);
                }
            }
        }

        // ── 7. Salvar no cache e retornar ─────────────────────────────────────
        const commentariesArray = result.commentaries || [];
        const commentaryJson = JSON.stringify(result);

        if (commentariesArray.length > 0 && result.status !== "unavailable") {
            try {
                await supabase.from("ai_study_cache").upsert({
                    verse_id: verseId,
                    question_type: questionType,
                    response: commentaryJson,
                    created_at: new Date().toISOString()
                }, { onConflict: "verse_id,question_type" });
            } catch (e) {
                console.error("Cache insert failed", e);
            }
        }

        return new Response(
            JSON.stringify({ response: commentaryJson, cached: false }),
            { status: 200, headers: corsHeaders }
        );

    } catch (err: any) {
        console.error("[Commentary API Error] status:", err?.status);
        console.error("[Commentary API Error] message:", err?.message);
        console.error("[Commentary API Error] full:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return new Response(
            JSON.stringify({ error: err.message || "Internal Server Error" }),
            { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
        );
    }
});