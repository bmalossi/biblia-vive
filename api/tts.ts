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
        const { text, slug, voiceId } = body;

        if (!text || !slug) {
            return new Response("Missing parameters", { status: 400 });
        }

        // If ElevenLabs key is not configured → tell client to use browser fallback
        if (!elevenLabsKey) {
            return new Response(
                JSON.stringify({ fallback: true, reason: "elevenlabs_not_configured" }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        // Verify PRO status (non-blocking: if auth fails, falls back to browser)
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

        if (!isPro) {
            // Not PRO → tell client to use browser TTS fallback
            return new Response(
                JSON.stringify({ fallback: true, reason: "not_pro" }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        // PRO MODE: Check Supabase cache first
        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
        const checkPath = `${slug}.mp3`;
        const { data: publicUrlData } = supabase.storage.from("audio_cache").getPublicUrl(checkPath);

        const cacheCheck = await fetch(publicUrlData.publicUrl, { method: "HEAD" });
        if (cacheCheck.ok) {
            return new Response(
                JSON.stringify({ url: publicUrlData.publicUrl, cached: true, isPro: true }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        // PRO MODE: Generate via ElevenLabs
        const selectedVoiceId = voiceId || "ErXwobaYiN019PkySvjV";
        const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
            method: "POST",
            headers: { "xi-api-key": elevenLabsKey, "Content-Type": "application/json" },
            body: JSON.stringify({ text: text.slice(0, 5000), model_id: "eleven_multilingual_v2" })
        });

        if (!elevenResponse.ok) throw new Error("ElevenLabs API failed");

        const audioBuffer = await elevenResponse.arrayBuffer();

        // Upload to Supabase Storage (fire and forget)
        supabase.storage.from("audio_cache").upload(checkPath, audioBuffer, {
            contentType: "audio/mpeg", upsert: true
        }).then(() => { }).catch(() => { });

        const { data: finalUrl } = supabase.storage.from("audio_cache").getPublicUrl(checkPath);

        return new Response(
            JSON.stringify({ url: finalUrl.publicUrl, cached: false, isPro: true }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err: any) {
        console.error("[TTS Error]:", err);
        // On any error, tell client to fall back to browser TTS
        return new Response(
            JSON.stringify({ fallback: true, reason: err.message }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }
}
