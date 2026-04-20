// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.3"
import OpenAI from "npm:openai@4.28.0"

// ─── Author metadata dictionary ───────────────────────────────────────────────
// Maps the `author` slug in the `commentaries` table to structured metadata
// for the frontend Commentary interface.
const AUTHOR_METADATA: Record<string, {
    author: string;
    era: string;
    tradition: string;
    work: string;
    year: string;
    original_language: string;
}> = {
    barnes: {
        author: "Albert Barnes",
        era: "Século XIX, Era Pós-Reforma",
        tradition: "Presbiteriana, Evangélica",
        work: "Notes on the Bible",
        year: "N/A",
        original_language: "Inglês",
    },
    clarke: {
        author: "Adam Clarke",
        era: "Século XVIII-XIX",
        tradition: "Metodista, Arminiana",
        work: "Commentary on the Bible",
        year: "1810–1826",
        original_language: "Inglês",
    },
    darby: {
        author: "John Nelson Darby",
        era: "Século XIX",
        tradition: "Plymouth Brethren, Dispensacionalista",
        work: "Synopsis of the Books of the Bible",
        year: "1857-1862",
        original_language: "Inglês",
    },
    geneva: {
        author: "Reformadores de Genebra",
        era: "Século XVI, Reforma Protestante",
        tradition: "Reformada, Calvinista, Puritana",
        work: "The Geneva Bible Translation Notes",
        year: "1599",
        original_language: "Inglês",
    },
    gill: {
        author: "John Gill",
        era: "Século XVIII, Pós-Reforma",
        tradition: "Batista Reformada, Calvinista",
        work: "Exposition of the Entire Bible",
        year: "1746-1763",
        original_language: "Inglês",
    },
    henry: {
        author: "Matthew Henry",
        era: "Século XVII-XVIII",
        tradition: "Não-conformista Puritan, Calvinista",
        work: "Complete Commentary on the Whole Bible",
        year: "1708-1714",
        original_language: "Inglês",
    },
    mhc: {
        author: "Matthew Henry",
        era: "Século XVII-XVIII",
        tradition: "Não-conformista Puritan, Calvinista",
        work: "Concise Commentary on the Whole Bible",
        year: "1708-1710",
        original_language: "Inglês",
    },
    mhcc: {
        author: "Matthew Henry",
        era: "Século XVII-XVIII",
        tradition: "Não-conformista Puritan, Calvinista",
        work: "Concise Commentary on the Whole Bible",
        year: "1708-1710",
        original_language: "Inglês",
    },
    jfb: {
        author: "Jamieson, Fausset, Brown",
        era: "Século XIX, Era Vitoriana",
        tradition: "Presbiteriana e Anglicana, Evangélica",
        work: "A Commentary, Critical, Practical, and Explanatory",
        year: "1871",
        original_language: "Inglês",
    },
    kd: {
        author: "Carl Friedrich Keil, Franz Delitzsch",
        era: "Século XIX, Era Moderna",
        tradition: "Luterana Alemã, Conservadora",
        work: "Biblical Commentary on the Old Testament",
        year: "1857-1878",
        original_language: "Alemão",
    },
    johnson: {
        author: "B.W. Johnson",
        era: "Século XIX, Movimento de Restauração",
        tradition: "Discípulos de Cristo, Dispensacionalista",
        work: "The People's New Testament",
        year: "1891",
        original_language: "Inglês",
    },
    spurgeon: {
        author: "Charles Haddon Spurgeon",
        era: "Século XIX, Era Vitoriana",
        tradition: "Batista Reformada, Calvinista",
        work: "The Treasury of David",
        year: "1869-1885",
        original_language: "Inglês",
    },
    scofield: {
        author: "Cyrus Ingerson Scofield",
        era: "Século XX, Era Moderna",
        tradition: "Presbiteriana, Dispensacionalista",
        work: "Scofield Reference Notes",
        year: "1909",
        original_language: "Inglês",
    },
    torrey: {
        author: "R. A. Torrey",
        era: "Século XIX-XX, Despertamento",
        tradition: "Evangélica, Fundamentalista",
        work: "Treasury of Scriptural Knowledge",
        year: "ca. 1880",
        original_language: "Inglês",
    },
    vincent: {
        author: "Marvin R. Vincent",
        era: "Século XIX, Era Pós-Guerra Civil",
        tradition: "Episcopal, Evangélica",
        work: "Vincent's Word Studies",
        year: "1887",
        original_language: "Inglês",
    },
    wesley: {
        author: "John Wesley",
        era: "Século XVIII, Despertamento Metodista",
        tradition: "Metodista, Arminiana",
        work: "Explanatory Notes on the Whole Bible",
        year: "1754-1765",
        original_language: "Inglês",
    },
};

// ─── Extracts the section relevant to a specific verse from chapter content ──
// Tries multiple regex patterns used by Sacred Texts formatting.
// Falls back to a truncated excerpt of the full chapter.
function extractVerseSection(content: string, verse: number): string {
    const MAX_CHARS = 5000; // Increased to ensure long texts aren't cut off

    const patterns = [
        // Pattern: "Ver. 3.", "Ver 3.", "Verse 3." followed by next verse marker
        new RegExp(
            `(?:Verse|Ver\\.)\\s*${verse}[:.)(]([\\s\\S]*?)(?=(?:Verse|Ver\\.)\\s*${verse + 1}[:.)(]|$)`,
            'i'
        ),
        // Pattern: standalone verse number at start of line "3." or "3:"
        new RegExp(
            `(?:^|\\n)\\s*${verse}[.:]\\s+([\\s\\S]*?)(?=\\n\\s*${verse + 1}[.:]|$)`,
            'm'
        ),
        // Pattern: bracketed or parenthetical verse "v. 3" or "(3)"
        new RegExp(
            `(?:v\\.\\s*|\\()${verse}[).:]([\\s\\S]*?)(?=(?:v\\.\\s*|\\()${verse + 1}[).:])`,
            'i'
        ),
    ];

    for (const re of patterns) {
        const match = content.match(re);
        const extracted = match?.[1]?.trim();
        if (extracted && extracted.length > 40) {
            return extracted.slice(0, MAX_CHARS);
        }
    }

    // Fallback: look for the verse number as a standalone token and slice around it
    const fallbackIdx = content.search(new RegExp(`\\b${verse}\\b`));
    if (fallbackIdx !== -1) {
        const start = Math.max(0, fallbackIdx - 500); // include some context before
        return content.slice(start, start + MAX_CHARS);
    }

    // Ultimate fallback: return the beginning of the chapter
    return content.slice(0, MAX_CHARS);
}

Deno.serve(async (req) => {
    console.log("[Commentary] Request received:", req.method, req.url);
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
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
            : 'en';

        if (!bookId || !chapter) {
            return new Response("Missing parameters", { status: 400, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
        const isChapterLevel = verse === null || verse === undefined || verse === 0;

        // ── Cache key ──────────────────────────────────────────────────────────
        const baseId = isChapterLevel
            ? `${bookId.toUpperCase()}.${chapter}.ALL`
            : `${bookId.toUpperCase()}.${chapter}.${verse}`;
        const verseId = lang !== 'en' ? `${baseId}:${lang}` : baseId;
        const questionType = isChapterLevel ? "chapter_commentary" : "commentary";

        // ── 1. Check cache first ───────────────────────────────────────────────
        const { data: cached } = await supabase
            .from("ai_study_cache")
            .select("response")
            .eq("verse_id", verseId)
            .eq("question_type", questionType)
            .maybeSingle();

        if (cached?.response) {
            return new Response(
                JSON.stringify({ response: cached.response, cached: true }),
                { status: 200, headers: corsHeaders }
            );
        }

        // ── 2. Verify PRO status ───────────────────────────────────────────────
        let isPro = false;
        const authHeader = req.headers.get("Authorization");
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
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

        if (!isPro) {
            return new Response(
                JSON.stringify({ error: "Pro subscription required" }),
                { status: 403, headers: corsHeaders }
            );
        }

        // ── 3. Query Supabase `commentaries` table ────────────────────────────
        // Map frontend bookId (e.g. "JHN") → book_code ("jhn")
        // Map chapter integer (e.g. 3) → zero-padded string ("003")
        const bookCode = bookId.toLowerCase();
        const chapterPadded = String(chapter).padStart(3, '0');

        const { data: rows, error: dbError } = await supabase
            .from("commentaries")
            .select("author, content, url")
            .eq("book_code", bookCode)
            .eq("chapter", chapterPadded)
            .order("author");

        if (dbError) {
            console.error("[Commentary] Supabase query error:", dbError);
        }

        if (!rows || rows.length === 0) {
            // No source material found — return empty commentaries gracefully
            const emptyResponse = JSON.stringify({ status: "unavailable", count: 0, commentaries: [] });
            return new Response(
                JSON.stringify({ response: emptyResponse, cached: false }),
                { status: 200, headers: corsHeaders }
            );
        }

        // ── 4. Extract verse-relevant section from each author's chapter text ──
        const authorSnippets: { slug: string; meta: (typeof AUTHOR_METADATA)[string]; excerpt: string; url: string }[] = [];

        for (const row of rows) {
            const meta = AUTHOR_METADATA[row.author] ?? {
                author: row.author,
                era: "Desconhecido",
                tradition: "Desconhecida",
                work: "Sacred Texts Commentary",
                year: "N/A",
                original_language: "Inglês",
            };

            const excerpt = isChapterLevel
                ? row.content.slice(0, 3500)
                : extractVerseSection(row.content, Number(verse));

            if (excerpt.length > 30) {
                authorSnippets.push({ slug: row.author, meta, excerpt, url: row.url });
            }
        }

        if (authorSnippets.length === 0) {
            const emptyResponse = JSON.stringify({ status: "unavailable", count: 0, commentaries: [] });
            return new Response(
                JSON.stringify({ response: emptyResponse, cached: false }),
                { status: 200, headers: corsHeaders }
            );
        }

        // ── 5. Call OpenAI to format the extracted excerpts into Commentary[] ──
        if (!openaiKey) {
            throw new Error("OpenAI API Key not configured");
        }

        const openai = new OpenAI({ apiKey: openaiKey });

        const langLabel = lang === 'pt'
            ? 'Português Brasileiro (pt-BR)'
            : lang === 'es' ? 'Espanhol (es)' : 'Inglês (en)';

        const verseLabel = isChapterLevel
            ? `${bookId.toUpperCase()} capítulo ${chapter} (visão geral)`
            : `${bookId.toUpperCase()} ${chapter}:${verse}`;

        // Build the input block for each author
        const authorBlocks = authorSnippets.map(s =>
            `[AUTOR: ${s.meta.author}]\n[SLUG: ${s.slug}]\nExcerto original:\n"""\n${s.excerpt}\n"""`
        ).join('\n\n---\n\n');

        const systemPrompt = `Você é um editor especializado em teologia histórica cristã.

Seu trabalho é:
1. Ler os excertos brutos de comentaristas históricos. Estes textos podem ser sobre o capítulo inteiro ou sobre um trecho maior, mas SEU FOCO ÚNICO E EXCLUSIVO é o versículo alvo: ${verseLabel}.
2. Analisar o que CADA autor comentou ESPECIFICAMENTE E DIRETAMENTE sobre este versículo isolado.
3. SELECIONAR NO MÁXIMO 3 autores que forneceram as explicações teológicas mais profundas e diretas sobre O VERSÍCULO ALVO. Descarte autores que fizeram apenas um resumo genérico do capítulo.
4. Para cada autor selecionado, extraia a porção exata onde ele explica o versículo, traduza fielmente para ${langLabel} mantendo a erudição do autor, e exclua qualquer parte do comentário original que divague sobre versos anteriores ou posteriores.
5. Retorne SOMENTE JSON válido.

Regras:
- NUNCA faça um resumo do capítulo inteiro. É estritamente proibido falar sobre o contexto do capítulo; foque 100% no versículo em tela.
- Máximo absoluto de 3 comentários selecionados.
- O campo "text" deve conter o comentário limpo, focado e traduzido.

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
      "text": "<texto traduzido focado no versículo>",
      "source_url": "<url ou null>"
    }
  ]
}`;

        const userPrompt = `Dentre estes excertos históricos, localize a porção que fala do versículo alvo (${verseLabel}), isole OS 3 MAIS COMPLETOS, formate-os e traduza-os focando APENAS neste versículo.
Versículo alvo e seu texto bíblico: "${verseText ?? ""}"

${authorBlocks}

Metadados dos autores (use exatamente estes valores):
${authorSnippets.map(s => `- ${s.slug}: author="${s.meta.author}", era="${s.meta.era}", tradition="${s.meta.tradition}", work="${s.meta.work}", year="${s.meta.year}", original_language="${s.meta.original_language}", source_url="${s.url}"`).join('\n')}`;


        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 4000,
            temperature: 0.2,
            response_format: { type: "json_object" },
        });

        const rawContent = completion.choices[0]?.message?.content || "{}";
        let result: any;
        try {
            result = JSON.parse(rawContent);
        } catch {
            result = { status: "unavailable", count: 0, commentaries: [] };
        }

        const commentariesArray = result.commentaries || [];
        const commentaryJson = JSON.stringify(result);

        // ── 6. Save to cache if there are results ──────────────────────────────
        if (commentariesArray.length > 0 && result.status !== "unavailable") {
            supabase
                .from("ai_study_cache")
                .upsert({
                    verse_id: verseId,
                    question_type: questionType,
                    response: commentaryJson,
                    created_at: new Date().toISOString()
                }, { onConflict: "verse_id,question_type" })
                .then(() => { })
                .catch(() => { });
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
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            }
        );
    }
});
