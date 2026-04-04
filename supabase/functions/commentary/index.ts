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
        const { bookId, chapter, verse, verseText, version } = body;

        if (!bookId || !chapter || verse === undefined) {
            return new Response("Missing parameters", { status: 400, headers: corsHeaders });
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
        const verseId = `${bookId.toUpperCase()}.${chapter}.${verse}`;

        // 1. Check Cache FIRST
        const { data: cached } = await supabase
            .from("ai_study_cache")
            .select("response")
            .eq("verse_id", verseId)
            .eq("question_type", "commentary")
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

        const systemPrompt = `Você é um curador de comentários bíblicos protestantes históricos. Retorne um JSON com até 2 comentários de teólogos reais (Calvino, Spurgeon, Henry, Lutero, etc.). NUNCA invente comentaristas.

JSON obrigatório:
{"commentaries":[{"author":"Nome","era":"Época","work":"Obra","year":"Ano","text":"Texto (máx 400 chars)","source_url":null}]}

Se não houver comentários confiáveis: {"commentaries":[]}`;

        const userPrompt = `${bookId} ${chapter}:${verse} (${version}): "${verseText?.slice(0, 200) ?? ""}"`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
            max_tokens: 800,
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
        const commentaryJson = JSON.stringify(result.commentaries || []);

        // 4. Save to Cache
        supabase.from("ai_study_cache").upsert({
            verse_id: verseId,
            question_type: "commentary",
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
