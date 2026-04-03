import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const openaiKey = process.env.OPENAI_API_KEY;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const body = await req.json().catch(() => ({}));
        const { bookId, chapter, verse, verseText, version, language = 'pt' } = body;

        if (!bookId || !chapter || verse === undefined) {
            return new Response("Missing parameters", { status: 400 });
        }

        // 1. Verify Authentication & PRO Status
        let isPro = false;
        let userId = null;

        if (supabaseUrl && supabaseServiceRoleKey) {
            const authHeader = req.headers.get("Authorization");
            if (authHeader) {
                const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
                const token = authHeader.replace("Bearer ", "");
                const { data: { user } } = await supabase.auth.getUser(token);
                if (user) {
                    userId = user.id;
                    const isAdmin = (user?.app_metadata as any)?.role === "admin";
                    const { data: sub } = await supabase
                        .from("user_subscriptions")
                        .select("status")
                        .eq("user_id", user.id)
                        .maybeSingle();
                    isPro = isAdmin || !!(sub && (sub.status === "active" || sub.status === "trialing"));
                }
            }
        }

        if (!isPro) {
            return new Response(JSON.stringify({ error: "Pro subscription required" }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
        const verseId = `${bookId.toUpperCase()}.${chapter}.${verse}`;
        const questionType = 'commentary';

        // 2. Check Cache
        const { data: cached } = await supabase
            .from('ai_study_cache')
            .select('response')
            .eq('verse_id', verseId)
            .eq('question_type', questionType)
            .maybeSingle();

        if (cached?.response) {
            return new Response(JSON.stringify({ response: cached.response, cached: true }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        // 3. Generate with AI
        if (!openaiKey) {
            throw new Error("OpenAI API Key not configured");
        }

        const openai = new OpenAI({ apiKey: openaiKey });

        const systemPrompt = `Você é um curador de comentários bíblicos históricos e teológicos de alta credibilidade na tradição PROTESTANTE (clássica e contemporânea).
Sua tarefa é retornar uma lista de até 3 comentários para um versículo específico.

REGRAS ESTREITAS DE IMPARCIALIDADE:
1. Você deve ser 100% IMPARCIAL. Nunca emita opinião própria ou do sistema.
2. Nunca indique qual interpretação é "correta" ou "melhor".
3. Use apenas linguagem neutra e atributiva: "Segundo [Autor]...", "Na perspectiva de [Autor]...", "Conforme documentado em [Obra]...".
4. Nunca use adjetivos avaliativos como "excelente", "profundo" ou "correto" de forma subjetiva.

REGRAS DE CONTEÚDO:
1. Busque no máximo 3 comentários por versículo.
2. Priorize teólogos protestantes reais e históricos (ex: Lutero, Calvino, Spurgeon, Henry, etc.) ou acadêmicos contemporâneos de peso.
3. Garanta diversidade: tente trazer autores de épocas ou tradições (batista, reformada, anglicana, etc.) diferentes se disponível.
4. NUNCA invente comentaristas ou atribua textos falsos. Se não houver comentários confiáveis, retorne uma lista vazia.

VOCÊ DEVE RETORNAR ESTRITAMENTE UM JSON NO SEGUINTE FORMATO:
{
  "commentaries": [
    {
      "author": "Nome Completo do Autor",
      "era": "Século ou datas (ex: Século XIX ou 1834-1892)",
      "work": "Nome da Obra de Origem",
      "year": "Ano da Obra",
      "text": "Texto íntegro do comentário (máximo 600 caracteres)",
      "source_url": "URL da fonte (ex: CCEL, Archive.org) ou null se não houver"
    }
  ]
}

Se nenhum comentário for encontrado, retorne: {"commentaries": []}.`;

        const userPrompt = `Versículo: ${bookId} ${chapter}:${verse}
Versão: ${version}
Texto: "${verseText}"

Por favor, forneça os comentários teológicos protestantes para este versículo seguindo o formato JSON solicitado.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
        const commentaryJson = JSON.stringify(result.commentaries || []);

        if (!commentaryJson) {
            throw new Error("AI generation failed");
        }

        // 4. Update Cache
        await supabase
            .from('ai_study_cache')
            .upsert({
                verse_id: verseId,
                question_type: questionType,
                response: commentaryJson,
                created_at: new Date().toISOString()
            }, { onConflict: 'verse_id,question_type' });

        return new Response(JSON.stringify({ response: commentaryJson, cached: false }), {
            status: 200, headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("[Commentary API Error]:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
