import { createClient } from "@supabase/supabase-js";

export const config = {
    runtime: "edge",
};

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            return new Response("Server configuration error (Supabase Missing)", { status: 500 });
        }

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response("Missing Authorization header", { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return new Response("Unauthorized Token", { status: 401 });
        }

        // Verify Pro status — Allow if subscription is active OR if user is an admin
        const isAdmin = (user?.app_metadata as any)?.role === "admin";

        const { data: sub } = await supabase
            .from("user_subscriptions")
            .select("status")
            .eq("user_id", user.id)
            .single();

        const isPro = isAdmin || (sub && (sub.status === "active" || sub.status === "trialing"));

        if (!isPro) {
            return new Response(
                JSON.stringify({ error: "Acesso Pro Necessário." }),
                { status: 402, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await req.json().catch(() => ({}));
        const { text, slug } = body;

        if (!text || !slug) {
            return new Response("Missing parameters", { status: 400 });
        }

        // Check Cache
        const checkPath = `${slug}.mp3`;
        const { data: publicUrlData } = supabase.storage.from("audio_cache").getPublicUrl(checkPath);

        const cacheCheck = await fetch(publicUrlData.publicUrl, { method: "HEAD" });
        if (cacheCheck.ok) {
            return new Response(JSON.stringify({ url: publicUrlData.publicUrl, cached: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        let audioBuffer: ArrayBuffer;

        if (elevenLabsKey) {
            // --- ELEVENLABS (MODO PREMIUM) ---
            const voiceId = body.voiceId || "ErXwobaYiN019PkySvjV";
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: "POST",
                headers: { "xi-api-key": elevenLabsKey, "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text.slice(0, 5000), // ElevenLabs limit
                    model_id: "eleven_multilingual_v2",
                })
            });

            if (!response.ok) throw new Error("ElevenLabs failed");
            audioBuffer = await response.arrayBuffer();
        } else {
            // --- FALLBACK GOOGLE (MODO TESTE GRATUITO) ---
            // Nota: Para capítulos longos, o ideal seria usar um pacote que fatia o texto.
            // Para teste, pegamos os primeiros 200 caracteres (limite do Google Translate TTS sem token).
            const testText = encodeURIComponent(text.slice(0, 200));
            const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${testText}&tl=pt-BR&client=tw-ob`;

            const response = await fetch(googleUrl);
            if (!response.ok) throw new Error("Google Fallback failed");
            audioBuffer = await response.arrayBuffer();

            console.log(`[TTS Fallback Active] Generated 200 chars for ${slug}`);
        }

        // Upload to Cache
        await supabase.storage.from("audio_cache").upload(checkPath, audioBuffer, {
            contentType: "audio/mpeg",
            upsert: true
        });

        const { data: finalUrl } = supabase.storage.from("audio_cache").getPublicUrl(checkPath);
        return new Response(JSON.stringify({ url: finalUrl.publicUrl, cached: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
