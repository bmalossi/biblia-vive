// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.3"
import OpenAI from "npm:openai@4.28.0"
import { Ratelimit } from "npm:@upstash/ratelimit@2"
import { Redis } from "npm:@upstash/redis@1"
import { log } from "../lib/logger.ts"


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
    barnes:   { author: "Albert Barnes",                        era: "Século XIX, Era Pós-Reforma",           tradition: "Presbiteriana, Evangélica",                     work: "Notes on the Bible",                                          year: "N/A",        original_language: "Inglês"  },
    clarke:   { author: "Adam Clarke",                          era: "Século XVIII-XIX",                      tradition: "Metodista, Arminiana",                          work: "Commentary on the Bible",                                     year: "1810–1826",  original_language: "Inglês"  },
    darby:    { author: "John Nelson Darby",                    era: "Século XIX",                            tradition: "Plymouth Brethren, Dispensacionalista",         work: "Synopsis of the Books of the Bible",                          year: "1857-1862",  original_language: "Inglês"  },
    geneva:   { author: "Reformadores de Genebra",              era: "Século XVI, Reforma Protestante",       tradition: "Reformada, Calvinista, Puritana",               work: "The Geneva Bible Translation Notes",                          year: "1599",       original_language: "Inglês"  },
    gill:     { author: "John Gill",                            era: "Século XVIII, Pós-Reforma",             tradition: "Batista Reformada, Calvinista",                 work: "Exposition of the Entire Bible",                              year: "1746-1763",  original_language: "Inglês"  },
    henry:    { author: "Matthew Henry",                        era: "Século XVII-XVIII",                     tradition: "Não-conformista Puritan, Calvinista",           work: "Complete Commentary on the Whole Bible",                      year: "1708-1714",  original_language: "Inglês"  },
    mhc:      { author: "Matthew Henry",                        era: "Século XVII-XVIII",                     tradition: "Não-conformista Puritan, Calvinista",           work: "Concise Commentary on the Whole Bible",                       year: "1708-1710",  original_language: "Inglês"  },
    mhcc:     { author: "Matthew Henry",                        era: "Século XVII-XVIII",                     tradition: "Não-conformista Puritan, Calvinista",           work: "Concise Commentary on the Whole Bible",                       year: "1708-1710",  original_language: "Inglês"  },
    jfb:      { author: "Jamieson, Fausset, Brown",             era: "Século XIX, Era Vitoriana",             tradition: "Presbiteriana e Anglicana, Evangélica",         work: "A Commentary, Critical, Practical, and Explanatory",          year: "1871",       original_language: "Inglês"  },
    kd:       { author: "Carl Friedrich Keil, Franz Delitzsch", era: "Século XIX, Era Moderna",               tradition: "Luterana Alemã, Conservadora",                  work: "Biblical Commentary on the Old Testament",                    year: "1857-1878",  original_language: "Alemão"  },
    johnson:  { author: "B.W. Johnson",                         era: "Século XIX, Movimento de Restauração",  tradition: "Discípulos de Cristo, Dispensacionalista",      work: "The People's New Testament",                                  year: "1891",       original_language: "Inglês"  },
    spurgeon: { author: "Charles Haddon Spurgeon",              era: "Século XIX, Era Vitoriana",             tradition: "Batista Reformada, Calvinista",                 work: "The Treasury of David",                                       year: "1869-1885",  original_language: "Inglês"  },
    scofield: { author: "Cyrus Ingerson Scofield",              era: "Século XX, Era Moderna",                tradition: "Presbiteriana, Dispensacionalista",             work: "Scofield Reference Notes",                                    year: "1909",       original_language: "Inglês"  },
    torrey:   { author: "R. A. Torrey",                         era: "Século XIX-XX, Despertamento",          tradition: "Evangélica, Fundamentalista",                   work: "Treasury of Scriptural Knowledge",                            year: "ca. 1880",   original_language: "Inglês"  },
    vws:  { author: "Marvin R. Vincent",                    era: "Século XIX, Era Pós-Guerra Civil",      tradition: "Episcopal, Evangélica",                         work: "Vincent's Word Studies",                                      year: "1887",       original_language: "Inglês"  },
    wesley:   { author: "John Wesley",                          era: "Século XVIII, Despertamento Metodista", tradition: "Metodista, Arminiana",                          work: "Explanatory Notes on the Whole Bible",                        year: "1754-1765",  original_language: "Inglês"  },
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
        const match     = content.match(re);
        const extracted = match?.[1]?.trim();
        if (extracted && extracted.length > 40) return extracted.slice(0, maxChars);
    }

    // P5: encontra chapter:verse em linha curta (≤120 chars) = marcador de bloco
    // Linhas longas com chapter:verse no meio são referências cruzadas — ignorar
    const lines = content.split('\n');
    let lastIdx = -1;
    let charPos = 0;

    const markerRe = chapter
        ? new RegExp(`(?<![\\d])${chapter}:${verse}(?!\\d)`)
        : new RegExp(`(?<![\\d])\\d+:${verse}(?!\\d)`);

    for (const line of lines) {
        const trimmed = line.trim();
        // Linha curta (≤120 chars) com o marcador = início de bloco de versículo
        if (trimmed.length <= 120 && markerRe.test(trimmed)) {
            lastIdx = charPos;
        }
        charPos += line.length + 1; // +1 pelo \n
    }

    if (lastIdx !== -1) {
        const blockStart = lastIdx;
        const afterLast  = content.slice(blockStart);

        const nextAnyVerseRe = new RegExp(
            chapter ? `(?<![\\d])${chapter}:(\\d+)(?!\\d)` : `(?<![\\d])\\d+:(\\d+)(?!\\d)`,
            'g'
        );

        // Busca próximo marcador de versículo em linha curta
        let nextBoundaryIdx = -1;
        let linePos2 = 0;
        for (const line of afterLast.split('\n')) {
            if (linePos2 === 0) { linePos2 += line.length + 1; continue; } // pula a própria linha do versículo alvo
            const trimmed2 = line.trim();
            if (trimmed2.length <= 120) {
                const nm = nextAnyVerseRe.exec(trimmed2);
                nextAnyVerseRe.lastIndex = 0;
                if (nm) {
                    const foundVerse = parseInt(nm[1], 10);
                    if (foundVerse > verse) {
                        nextBoundaryIdx = linePos2;
                        break;
                    }
                }
            }
            linePos2 += line.length + 1;
        }

        const end     = nextBoundaryIdx > 0 ? blockStart + nextBoundaryIdx : blockStart + maxChars;
        const excerpt = content.slice(blockStart, Math.min(end, blockStart + maxChars)).trim();
        if (excerpt.length > 40) return excerpt;
    }

    return "";
}

function extractChapterSection(content: string, maxChars = 5000, chapter?: number): string {
    if (!chapter) return "";

    const chapterStartRe = new RegExp(
        String.raw`(?:\[(?:[^\]\n]*?\s)?${chapter}:0\]\([^\)]*\)|(?:^|\n)[^\n]*?(?<!\d)${chapter}:0(?!\d))`,
        'i'
    );

    const match = content.match(chapterStartRe);
    if (!match || typeof match.index !== 'number') return "";

    const source = content.slice(match.index).trimStart();

    const nextVerseRe = new RegExp(
        String.raw`(?:^|\n)[^\n]*?(?<!\d)${chapter}:(\d+)(?!\d)`,
        'g'
    );

    let nextBoundaryIdx = -1;
    let m: RegExpExecArray | null;
    while ((m = nextVerseRe.exec(source)) !== null) {
        const foundVerse = parseInt(m[1], 10);
        if (foundVerse > 0) {
            nextBoundaryIdx = m.index;
            break;
        }
    }

    const excerpt = (nextBoundaryIdx > 0
        ? source.slice(0, nextBoundaryIdx)
        : source.slice(0, maxChars)
    ).trim();

    return excerpt.length > 30 ? excerpt.slice(0, maxChars) : "";
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
            if (/^Índice de /i.test(t))                           return false;
            if (/^Index of /i.test(t))                             return false;
            if (/\bIndex$/i.test(t))                               return false; // "Joshua Index", "1 Timothy Index"
            if (/^Anterior\s+Próximo/i.test(t))                    return false;
            if (/^Previous\s+Next/i.test(t))                       return false;
            if (/^Capítulo\s+\d+\s+de\s+/i.test(t))               return false;
            if (/^Chapter\s+\d+\s+of\s+/i.test(t))                 return false;
            if (/\bChapter\s+\d+$/i.test(t))                       return false; // "1 Timothy Chapter 3", "Joshua Chapter 21"
            if (/sacred-texts\.com/i.test(t))                      return false;
            if (/^[a-z0-9]{2,5}\s+\d+:\d+$/i.test(t))             return false; // "jos 21:0", "ti1 3:0"
            if (/^[A-ZÀ-Ú1-9][a-zà-ú ]+$/.test(t) && t.length < 25) return false; // "Josué", "1 Timothy" sozinhos
            // Remove linhas de índice: "(Ti1 3:1-7) Título..." ou "(Jos 21:1-8) Título..."
            if (/^\([A-Za-z0-9\.]+\s+\d+:\d+[\d\-]*\)\s+\S/.test(t)) return false;
            if (/^\(v\.\s*\d+[\d\-]*\)\s+\S/.test(t))              return false;
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
        'X-RateLimit-Limit':     String(RATE_LIMIT),
        'X-RateLimit-Remaining': String(Math.max(0, remaining)),
        'X-RateLimit-Reset':     String(resetAt),
    };
}

// Wrapper de timing e contagem de tokens para chamadas OpenAI
async function callOpenAIWithMetrics(
    execId: string,
    label: string,
    fn: () => Promise<any>
): Promise<any> {
    const start = Date.now();

    try {
        const result = await fn();
        const durationMs = Date.now() - start;

        const metricName = label === "embedding" 
            ? "openai.embedding.ms" 
            : label.startsWith("gpt_translate") 
                ? "openai.translation.ms" 
                : undefined;

        await log("info", "openai_call", {
            fn:           "commentary",
            execId,
            label,
            durationMs,
            model:        result?.model ?? "unknown",
            promptTokens: result?.usage?.prompt_tokens ?? 0,
            compTokens:   result?.usage?.completion_tokens ?? 0,
            totalTokens:  result?.usage?.total_tokens ?? 0,
            ...(metricName ? { metric: metricName, value: durationMs } : {}),
        });

        return result;
    } catch (err: any) {
        const durationMs = Date.now() - start;

        await log("error", "openai_call_error", {
            fn:        "commentary",
            execId,
            label,
            durationMs,
            errorMsg:  err?.message,
            errorType: err?.type,
            status:    err?.status,
        });

        throw err;
    }
}


Deno.serve(async (req) => {
    const startTime = Date.now();
    const executionId = crypto.randomUUID();

    await log("info", "request_received_http", {
        fn: "commentary",
        execId: executionId,
        method: req.method,
        url: req.url,
    });

    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin':  '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                'Access-Control-Max-Age':       '86400',
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
            const totalDuration = Date.now() - startTime;
            await log("info", "request_completed", {
                fn: "commentary",
                execId: executionId,
                metric: "commentary.latency.ms",
                value: totalDuration,
                status: 405,
            });
            return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
        }

        const openaiKey              = Deno.env.get("OPENAI_API_KEY");
        const supabaseUrl            = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        const body = await req.json().catch(() => ({}));
        const { bookId, chapter, verse, verseText, version, language } = body;
        const lang = (typeof language === 'string' && language.trim())
            ? language.trim().toLowerCase()
            : 'pt';

        await log("info", "request_received", {
            fn:        "commentary",
            execId:    executionId,
            method:    req.method,
            bookId,
            chapter,
            verse,
            lang,
            metric:    "commentary.requests.count",
            value:     1,
        });

        if (!bookId || !chapter) {
            const totalDuration = Date.now() - startTime;
            await log("info", "request_completed", {
                fn: "commentary",
                execId: executionId,
                metric: "commentary.latency.ms",
                value: totalDuration,
                status: 400,
            });
            return new Response("Missing parameters", { status: 400, headers: corsHeaders });
        }

        const supabase       = createClient(supabaseUrl!, supabaseServiceRoleKey!);
        const isChapterLevel = verse === null || verse === undefined || verse === 0;

        // ── Cache key ──────────────────────────────────────────────────────────
        const baseId       = isChapterLevel ? `${bookId.toUpperCase()}.${chapter}.ALL` : `${bookId.toUpperCase()}.${chapter}.${verse}`;
        const verseId      = lang !== 'en' ? `${baseId}:${lang}` : baseId;
        const questionType = isChapterLevel ? "chapter_commentary" : "commentary";

        // ── 1. Check cache ─────────────────────────────────────────────────────
        const { data: cached } = await supabase
            .from("ai_study_cache")
            .select("response")
            .eq("verse_id", verseId)
            .eq("question_type", questionType)
            .maybeSingle();

        if (cached?.response) {
            const totalDuration = Date.now() - startTime;
            await log("info", "cache_hit", {
                fn: "commentary",
                execId: executionId,
                metric: "cache.hits",
                value: 1,
            });
            await log("info", "request_completed", {
                fn: "commentary",
                execId: executionId,
                metric: "commentary.latency.ms",
                value: totalDuration,
                cached: true,
                status: 200,
            });
            return new Response(JSON.stringify({ response: cached.response, cached: true }), { status: 200, headers: corsHeaders });
        }

        await log("info", "cache_miss", {
            fn: "commentary",
            execId: executionId,
            metric: "cache.misses",
            value: 1,
        });

        // ── 2. Verify PRO status & get user_id ────────────────────────────────
        let isPro  = false;
        let userId: string | null = null;
        const authHeader = req.headers.get("Authorization");
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                userId        = user.id;
                const isAdmin = user.app_metadata?.role === "admin";
                const { data: sub, error: subError } = await supabase
                    .from("user_subscriptions")
                    .select("status")
                    .eq("user_id", user.id)
                    .maybeSingle();
                if (subError) {
                    await log("error", "subscription_error", {
                        fn: "commentary",
                        execId: executionId,
                        error: subError.message,
                    });
                }
                isPro = isAdmin || !!(sub && (sub.status === "active" || sub.status === "trialing"));
                const userTier = isPro ? "pro" : "free";
                await log("info", "auth_check", {
                    fn:      "commentary",
                    userId:  user.id,
                    userTier,
                    isAdmin,
                    execId:  executionId,
                });
            }
        }

        // ── 3. Rate limiting ──────────────────────────────────────────────────
        const upstashUrl   = Deno.env.get("UPSTASH_REDIS_REST_URL");
        const upstashToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

        if (upstashUrl && upstashToken) {
            const clientIp    = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
            const redis       = new Redis({ url: upstashUrl, token: upstashToken });
            const ratelimitId = isPro && userId ? `user:${userId}` : `ip:${clientIp}`;
            const limitConfig = isPro
                ? Ratelimit.slidingWindow(RATE_LIMIT, "1 h")
                : Ratelimit.slidingWindow(3, "1 d"); // 3 comentários gratuitos por dia (igual ao frontend)
            const userLimit = isPro ? RATE_LIMIT : 3;
            const ratelimit   = new Ratelimit({ redis, limiter: limitConfig, prefix: "bv:commentary" });
            const { success, limit, remaining, reset } = await ratelimit.limit(ratelimitId);
            const rlHeaders   = buildRateLimitHeaders(corsHeaders, remaining, reset);
            if (!success) {
                const totalDuration = Date.now() - startTime;
                await log("warn", "rate_limit_hit", {
                    fn: "commentary",
                    execId: executionId,
                    userId,
                    clientIp,
                });
                await log("info", "request_completed", {
                    fn: "commentary",
                    execId: executionId,
                    metric: "commentary.latency.ms",
                    value: totalDuration,
                    status: 429,
                });
                return new Response(
                    JSON.stringify({ error: "limite_atingido", message: "Você atingiu o limite de comentários de hoje.", reset_at: reset, limit: userLimit }),
                    { status: 429, headers: rlHeaders }
                );
            }
            Object.assign(corsHeaders, {
                'X-RateLimit-Limit':     String(limit),
                'X-RateLimit-Remaining': String(remaining),
                'X-RateLimit-Reset':     String(reset),
            });
        }

        // ── 4. RAG: busca semântica em commentary_chunks ──────────────────────
        if (!openaiKey) throw new Error("OpenAI API Key not configured");

        const openai        = new OpenAI({ apiKey: openaiKey });
        const bookCode      = bookId.toLowerCase();
        const chapterPadded = String(chapter).padStart(3, '0');
        const chapterNum    = parseInt(String(chapter), 10);
        const verseNum      = parseInt(String(verse), 10);

        const verseLabel = isChapterLevel
            ? `${bookId.toUpperCase()} capítulo ${chapter} (visão geral)`
            : `${bookId.toUpperCase()} ${chapter}:${verse}`;

        const embeddingInput = isChapterLevel
            ? `${bookId.toUpperCase()} chapter ${chapter} overview`
            : `${bookId.toUpperCase()} ${chapter}:${verse} ${verseText ?? ""}`.slice(0, 8000);

        const embResp = await callOpenAIWithMetrics(executionId, "embedding", () =>
            openai.embeddings.create({
                model: "text-embedding-3-small",
                input: embeddingInput,
            })
        );

        const queryEmbedding = embResp.data[0].embedding;

        const startSem = Date.now();
        const { data: chunks, error: semError } = await supabase.rpc(
            "match_commentary_chunks",
            {
                query_embedding: queryEmbedding,
                book_filter:     bookCode,
                chapter_filter:  chapterPadded,
                verse_filter:    isChapterLevel ? null : verseNum,
                match_count:     6,
            }
        );
        const semDuration = Date.now() - startSem;
        await log("info", "semantic_search_completed", {
            fn: "commentary",
            execId: executionId,
            metric: "db.semantic_search.ms",
            value: semDuration,
        });

        if (semError) {
            await log("error", "semantic_search_error", {
                fn: "commentary",
                execId: executionId,
                error: semError.message,
            });
        }

        if (!chunks || chunks.length === 0) {
            const emptyResponse = JSON.stringify({ status: "unavailable", count: 0, commentaries: [] });
            return new Response(JSON.stringify({ response: emptyResponse, cached: false }), { status: 200, headers: corsHeaders });
        }

        await log("info", "chunks_raw", {
            fn: "commentary",
            execId: executionId,
            chunks: chunks?.map((c: any) => ({ author: c.author, verse: c.verse, content_len: c.content?.length })),
        });
        
        await log("info", "chunks_verse_field", {
            fn: "commentary",
            execId: executionId,
            chunks: chunks?.map((c: any) => ({ author: c.author, verse: c.verse, verse_type: typeof c.verse })),
        });

        // ── 5. Montar snippets a partir dos chunks ────────────────────────────
        // IMPORTANTE: filtro usa conteúdo BRUTO (antes da limpeza) para detectar ":0"
        const chapterZeroRe = new RegExp(
            String.raw`(?:\[(?:[^\]\n]*?\s)?${chapterNum}:0\]\([^\)]*\)|(?:^|\n)[^\n]*?\b${chapterNum}:0\b)`,
            'i'
        );

        const filteredChunks = isChapterLevel
            ? chunks.filter((c: any) => chapterZeroRe.test(c.content ?? ''))
            : chunks;

        await log("info", "filtered_chunks_preview", {
            fn: "commentary",
            execId: executionId,
            preview: filteredChunks?.map((c: any) => ({
                author: c.author,
                first50: stripSacredTextsHeader(c.content ?? '').trimStart().slice(0, 80)
            })),
        });

        const authorSnippets: { slug: string; meta: (typeof AUTHOR_METADATA)[string]; excerpt: string; url: string }[] =
            filteredChunks
                .filter((row: any) => {
                    if (!row.content || row.content.length <= 30) return false;
                    return true;
                })
                .map((row: any) => {
                    let source = row.content as string;


                    // Para capítulo: começa exatamente no marcador chapter:0
                    if (isChapterLevel) {
                        const chapterStartRe = new RegExp(
                            String.raw`(?:\[(?:[^\]\n]*?\s)?${chapterNum}:0\]\([^\)]*\)|(?:^|\n)[^\n]*?\b${chapterNum}:0\b)`,
                            'i'
                        );
                        const match = source.match(chapterStartRe);
                        
                        void log("info", "chapter_start_match", {
                            fn: "commentary",
                            execId: executionId,
                            author: row.author,
                            idx: match?.index,
                            match: match?.[0]
                        }).catch(() => {});                        


                        if (match && typeof match.index === 'number') {
                            source = source.slice(match.index).trimStart();
                        }
                    }


                    // Limpeza do cabeçalho APÓS localizar o início correto
                    let cleaned = isChapterLevel
                        ? source.replace(/^\s+/, '')
                        : stripSacredTextsHeader(source);


                    // Para capítulo: corta antes do primeiro BLOCO de versículo individual
                    if (isChapterLevel) {
                        const verseBlockRe = new RegExp(
                            `(?:^|\\n)[ \\t]*(?:` +
                            `Verse\\s+[1-9]|` +
                            `Ver\\.\\s+[1-9]|` +
                            `[\\w ]+?\\s+${chapterNum}:[1-9]\\d*[ \\t]*$|` +
                            `\\([\\w ]+?\\s+${chapterNum}:[1-9]|` +
                            `^[1-9]\\d*\\.\\s+[A-Z]` +
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
                    let excerpt  = cleaned;


                    if (cleaned.length > maxLen) {
                        const cutPoint = cleaned.lastIndexOf('\n\n', maxLen);
                        excerpt = cutPoint > maxLen * 0.5
                            ? cleaned.slice(0, cutPoint).trim()
                            : cleaned.slice(0, maxLen).trim();
                    }
                    
                    void log("info", "excerpt_extracted", {
                        fn: "commentary",
                        execId: executionId,
                        author: row.author,
                        excerpt_preview: cleaned.slice(0, 300),
                    }).catch(() => {});
                    
                    return {
                        slug:    row.author,
                        meta:    AUTHOR_METADATA[row.author] ?? { author: row.author, era: "Desconhecido", tradition: "Desconhecida", work: "Sacred Texts Commentary", year: "N/A", original_language: "Inglês" },
                        excerpt,
                        url:     row.url ?? "",
                    };
                });


        if (authorSnippets.length === 0) {
            const emptyResponse = JSON.stringify({ status: "unavailable", count: 0, commentaries: [] });
            return new Response(JSON.stringify({ response: emptyResponse, cached: false }), { status: 200, headers: corsHeaders });
        }
        
        await log("info", "filtered_chunks_authors", {
            fn: "commentary",
            execId: executionId,
            authors: filteredChunks.map((c: any) => c.author),
        });
        await log("info", "author_snippets_authors", {
            fn: "commentary",
            execId: executionId,
            authors: authorSnippets.map((s: any) => s.slug),
        });
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

        // ── 6a. CAPÍTULO e VERSÍCULO usam fallback determinístico na tabela commentaries ─
        let result: any = { status: "unavailable", count: 0, commentaries: [] };


        if (isChapterLevel) {
            await log("info", "chapter_fallback_triggered", {
                fn: "commentary",
                execId: executionId,
                verseLabel,
            });

            const { data: chapterRows } = await supabase
                .from("commentaries")
                .select("author, content, url")
                .eq("book_code", bookCode)
                .eq("chapter", chapterPadded)
                .order("author");

            if (chapterRows && chapterRows.length > 0) {
                const chapterSnippetsRaw = chapterRows
                    .map((row: any) => {
                        const content = row.content ?? "";
                        const lines = content.split('\n');

                        let startLine = -1;
                        let endLine = lines.length;

                        const chapterZeroLineRe = new RegExp(`(?<!\\d)${chapterNum}:0(?!\\d)`, 'i');
                        const verseOneLineRe = new RegExp(`(?<!\\d)${chapterNum}:1(?!\\d)`, 'i');

                        for (let i = 0; i < lines.length; i++) {
                            const trimmed = lines[i].trim();
                            if (trimmed.length <= 120 && chapterZeroLineRe.test(trimmed)) {
                                startLine = i;
                                break;
                            }
                        }

                        if (startLine !== -1) {
                            for (let i = startLine + 1; i < lines.length; i++) {
                                const trimmed = lines[i].trim();
                                if (trimmed.length <= 120 && verseOneLineRe.test(trimmed)) {
                                    endLine = i;
                                    break;
                                }
                            }
                        }

                        let excerpt = startLine !== -1
                            ? lines.slice(startLine, endLine).join('\n').trim()
                            : "";

                        excerpt = excerpt.slice(0, 6000).trim();

                        return {
                            slug: row.author,
                            meta: AUTHOR_METADATA[row.author] ?? {
                                author: row.author,
                                era: "Desconhecido",
                                tradition: "Desconhecida",
                                work: "Sacred Texts Commentary",
                                year: "N/A",
                                original_language: "Inglês"
                            },
                            excerpt,
                            url: row.url ?? "",
                            hasChapterOverview: excerpt.length > 30,
                        };
                    })
                    .filter((s: any) => s.hasChapterOverview);

                const bestByAuthor = new Map<string, any>();
                for (const s of chapterSnippetsRaw) {
                    const authorKey = (s.meta.author || s.slug || "").trim().toLowerCase();
                    if (!authorKey) continue;

                    const existing = bestByAuthor.get(authorKey);
                    if (!existing || s.excerpt.length > existing.excerpt.length) {
                        bestByAuthor.set(authorKey, s);
                    }
                }

                const chapterSnippets = Array.from(bestByAuthor.values())
                    .sort((a: any, b: any) => b.excerpt.length - a.excerpt.length)
                    .slice(0, 3);

                await log("info", "fallback_chapter_authors", {
                    fn: "commentary",
                    execId: executionId,
                    authors: chapterSnippets.map((s: any) => s.slug),
                });
                await log("info", "fallback_chapter_excerpt_preview", {
                    fn: "commentary",
                    execId: executionId,
                    preview: chapterSnippets[0]?.excerpt?.slice(0, 200),
                });

                if (chapterSnippets.length > 0) {
                    result = {
                        status: "complete",
                        count: chapterSnippets.length,
                        commentaries: chapterSnippets.map((s: any) => ({
                            author: s.meta.author,
                            era: s.meta.era,
                            tradition: s.meta.tradition,
                            work: s.meta.work,
                            year: s.meta.year,
                            original_language: s.meta.original_language,
                            text: s.excerpt,
                            source_url: s.url || null,
                        })),
                    };
                } else {
                    await log("warn", "fallback_no_chapter_notes", {
                        fn: "commentary",
                        execId: executionId,
                        verseLabel,
                    });
                }
            }
        } else {
            await log("info", "verse_fallback_triggered", {
                fn: "commentary",
                execId: executionId,
                verseLabel,
            });
        }

        // ── 6b. FALLBACK: monta JSON direto em código, sem GPT ────────────────
        // GPT não é necessário aqui — extração já foi feita por extractVerseSection.
        // A tradução será feita pelo step 6c (gpt-4.1-nano) separadamente.
         if (!isChapterLevel) {
            await log("info", "fallback_triggered", {
                fn: "commentary",
                execId: executionId,
                verseLabel,
            });

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
                            slug:            row.author,
                            meta:            AUTHOR_METADATA[row.author] ?? { author: row.author, era: "Desconhecido", tradition: "Desconhecida", work: "Sacred Texts Commentary", year: "N/A", original_language: "Inglês" },
                            excerpt,
                            url:             row.url ?? "",
                            isVerseSpecific: verseSpecificRe.test(excerpt),
                        };
                    })
                    .filter((s: any) => s.isVerseSpecific && s.excerpt.length > 30)
                    .sort((a: any, b: any) => b.excerpt.length - a.excerpt.length)
                    .slice(0, 3);

                await log("info", "fallback_verse_authors", {
                    fn: "commentary",
                    execId: executionId,
                    authors: fallbackSnippets.map((s: any) => s.slug),
                });
                await log("info", "fallback_verse_excerpt_preview", {
                    fn: "commentary",
                    execId: executionId,
                    preview: fallbackSnippets[0]?.excerpt?.slice(0, 200),
                });

                if (fallbackSnippets.length > 0) {
                    // Monta o JSON estruturado direto — sem chamada GPT
                    result = {
                        status: "complete",
                        count:  fallbackSnippets.length,
                        commentaries: fallbackSnippets.map((s: any) => ({
                            author:            s.meta.author,
                            era:               s.meta.era,
                            tradition:         s.meta.tradition,
                            work:              s.meta.work,
                            year:              s.meta.year,
                            original_language: s.meta.original_language,
                            text:              s.excerpt,   // inglês — será traduzido no step 6c
                            source_url:        s.url || null,
                        })),
                    };
                    await log("info", "fallback_count", {
                        fn: "commentary",
                        execId: executionId,
                        count: result.count,
                    });
                } else {
                    await log("warn", "fallback_no_verse_notes", {
                        fn: "commentary",
                        execId: executionId,
                        verseLabel,
                    });
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
                    const translateCompletion = await callOpenAIWithMetrics(
                        executionId,
                        `gpt_translate_${i}`,
                        () => openai.chat.completions.create({
                            model: "gpt-4.1-nano",
                            messages: [{ role: "user", content:
                                `Traduza fielmente e em sua completude o texto abaixo para ${langLabel}.\n` +
                                `Regras:\n` +
                                `- Preserve referências bíblicas (ex: "Isa 37:28"), travessões (—) e pontuação do autor.\n` +
                                `- Não parafraseie, não resuma, não adicione palavras.\n` +
                                `- Retorne APENAS a tradução, sem explicações, sem JSON, sem marcadores.\n\n` +
                                `Texto:\n${original}`
                            }],
                            max_completion_tokens: 6000,
                            temperature: 0.1,
                        })
                    );

                    const translated = translateCompletion.choices[0]?.message?.content?.trim() || "";
                    if (translated.length > 10) {
                        result.commentaries[i].text = translated;
                        await log("info", "translation_applied", {
                            fn: "commentary",
                            execId: executionId,
                            index: i,
                            author: result.commentaries[i].author,
                        });
                    } else {
                        await log("warn", "translation_empty", {
                            fn: "commentary",
                            execId: executionId,
                            index: i,
                        });
                    }
                } catch (translateErr: any) {
                    await log("error", "translation_error", {
                        fn: "commentary",
                        execId: executionId,
                        index: i,
                        error: translateErr?.message,
                    });
                }
            }
        }
        
        // ── 7. Salvar no cache e retornar ─────────────────────────────────────
        const commentariesArray = result.commentaries || [];
        const commentaryJson    = JSON.stringify(result);

        if (commentariesArray.length > 0 && result.status !== "unavailable") {
            try {
                await supabase.from("ai_study_cache").upsert({
                    verse_id:      verseId,
                    question_type: questionType,
                    response:      commentaryJson,
                    created_at:    new Date().toISOString()
                }, { onConflict: "verse_id,question_type" });
            } catch (e) {
                await log("error", "cache_insert_failed", {
                    fn: "commentary",
                    execId: executionId,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }

        const totalDuration = Date.now() - startTime;
        await log("info", "request_completed", {
            fn: "commentary",
            execId: executionId,
            metric: "commentary.latency.ms",
            value: totalDuration,
            cached: false,
            status: 200,
        });

        return new Response(
            JSON.stringify({ response: commentaryJson, cached: false }),
            { status: 200, headers: corsHeaders }
        );

    } catch (err: any) {
        const totalDuration = Date.now() - startTime;
        await log("error", "request_failed", {
            fn: "commentary",
            execId: executionId,
            metric: "commentary.failed.count",
            value: 1,
            error: err?.message,
        });
        await log("error", "api_error", {
            fn: "commentary",
            execId: executionId,
            status: err?.status,
            message: err?.message,
            full: JSON.stringify(err, Object.getOwnPropertyNames(err)),
            metric: "commentary.latency.ms",
            value: totalDuration,
        });
        return new Response(
            JSON.stringify({ error: err.message || "Internal Server Error" }),
            { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
        );
    }
});