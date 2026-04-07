// @ts-ignore - Deno env
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno&no-check";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const { text, slug } = body;

        if (!text || !slug) {
            return new Response(
                JSON.stringify({ fallback: true, reason: "missing_params" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
        const googleTtsKey = Deno.env.get("GOOGLE_TTS_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            return new Response(
                JSON.stringify({ fallback: true, reason: "supabase_not_configured" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Verify PRO status
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

        if (isPro && elevenLabsKey) {
            // ── PRO MODE: ElevenLabs with cache ─────────────────────────────
            const proPath = `${slug}.mp3`;
            const { data: proUrlData } = supabase.storage.from("audio_cache").getPublicUrl(proPath);
            const cacheCheck = await fetch(proUrlData.publicUrl, { method: "HEAD" });
            if (cacheCheck.ok) {
                return new Response(
                    JSON.stringify({ url: proUrlData.publicUrl, cached: true, isPro: true }),
                    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/ErXwobaYiN019PkySvjV`, {
                method: "POST",
                headers: { "xi-api-key": elevenLabsKey, "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.slice(0, 5000), model_id: "eleven_multilingual_v2" }),
            });

            if (!elevenResponse.ok) throw new Error("ElevenLabs API failed");

            const audioBuffer = await elevenResponse.arrayBuffer();
            supabase.storage.from("audio_cache").upload(proPath, audioBuffer, {
                contentType: "audio/mpeg", upsert: true
            }).catch(() => { });

            const { data: finalUrl } = supabase.storage.from("audio_cache").getPublicUrl(proPath);
            return new Response(
                JSON.stringify({ url: finalUrl.publicUrl, cached: false, isPro: true }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ── FREE MODE: Google Cloud TTS (pt-BR-Standard-B) with cache ────────
        const freePath = `free-${slug}.mp3`;
        const { data: freeUrlData } = supabase.storage.from("audio_cache").getPublicUrl(freePath);
        const freeCacheCheck = await fetch(freeUrlData.publicUrl, { method: "HEAD" });
        if (freeCacheCheck.ok) {
            return new Response(
                JSON.stringify({ url: freeUrlData.publicUrl, cached: true, isPro: false }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!googleTtsKey) {
            return new Response(
                JSON.stringify({ fallback: true, reason: "google_tts_not_configured" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const googleResponse = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    input: { text: text.slice(0, 5000) },
                    voice: { languageCode: "pt-BR", name: "pt-BR-Standard-B" },
                    audioConfig: { audioEncoding: "MP3", speakingRate: 0.92, pitch: 0 },
                }),
            }
        );

        if (!googleResponse.ok) {
            const errBody = await googleResponse.text();
            console.error("[tts] Google API error:", errBody);
            return new Response(
                JSON.stringify({ fallback: true, reason: "google_api_error" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const googleData = await googleResponse.json();
        const audioBase64: string = googleData.audioContent;

        // Decode base64 → Uint8Array (Deno-compatible)
        const binaryStr = atob(audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        supabase.storage.from("audio_cache").upload(freePath, bytes.buffer, {
            contentType: "audio/mpeg", upsert: true
        }).catch(() => { });

        const { data: savedUrl } = supabase.storage.from("audio_cache").getPublicUrl(freePath);
        return new Response(
            JSON.stringify({ url: savedUrl.publicUrl, cached: false, isPro: false }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err: any) {
        console.error("[tts] Error:", err?.message, err);
        return new Response(
            JSON.stringify({ fallback: true, reason: err?.message || "internal_error" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
