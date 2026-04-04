import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const body = await req.json().catch(() => ({}));
        const { text, slug } = body;

        if (!text || !slug) {
            return new Response("Missing parameters", { status: 400 });
        }

        // Determine Pro status (optional — non-blocking, free users will use Google fallback)
        let isPro = false;
        if (supabaseUrl && supabaseServiceRoleKey) {
            const authHeader = req.headers.get("Authorization");
            if (authHeader) {
                const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
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
        }

        // PRO MODE: ElevenLabs with Supabase caching
        if (isPro && elevenLabsKey && supabaseUrl && supabaseServiceRoleKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
            const checkPath = `${slug}.mp3`;
            const { data: publicUrlData } = supabase.storage.from("audio_cache").getPublicUrl(checkPath);

            const cacheCheck = await fetch(publicUrlData.publicUrl, { method: "HEAD" });
            if (cacheCheck.ok) {
                return new Response(JSON.stringify({ url: publicUrlData.publicUrl, cached: true, isPro: true }), {
                    status: 200, headers: { "Content-Type": "application/json" }
                });
            }

            const voiceId = body.voiceId || "ErXwobaYiN019PkySvjV";
            const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: "POST",
                headers: { "xi-api-key": elevenLabsKey, "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.slice(0, 5000), model_id: "eleven_multilingual_v2" })
            });

            if (!elevenResponse.ok) throw new Error("ElevenLabs failed");
            const audioBuffer = await elevenResponse.arrayBuffer();

            await supabase.storage.from("audio_cache").upload(checkPath, audioBuffer, {
                contentType: "audio/mpeg", upsert: true
            });

            const { data: finalUrl } = supabase.storage.from("audio_cache").getPublicUrl(checkPath);
            return new Response(JSON.stringify({ url: finalUrl.publicUrl, cached: false, isPro: true }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        // FREE MODE: Google TTS fallback (first 200 chars, no caching required)
        const testText = encodeURIComponent(text.slice(0, 200));
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${testText}&tl=pt-BR&client=tw-ob`;
        const googleResponse = await fetch(googleUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!googleResponse.ok) throw new Error("Google TTS fallback failed");
        const audioBuffer = await googleResponse.arrayBuffer();

        console.log(`[TTS Free Preview] slug=${slug} chars=${text.length}`);

        return new Response(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "X-Audio-Mode": "free-preview",
                "Cache-Control": "no-store",
            }
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
