export default async function handler(req: Request) {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: "ASSEMBLYAI_API_KEY is not configured on the server" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    // ─── GET /api/stt?id=<transcript_id> ─── Polling status & result
    if (req.method === "GET") {
        try {
            const url = new URL(req.url);
            const id = url.searchParams.get("id");

            if (!id) {
                return new Response(
                    JSON.stringify({ error: "Query parameter 'id' is required" }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { "Authorization": apiKey }
            });

            if (!pollRes.ok) {
                const errText = await pollRes.text();
                return new Response(
                    JSON.stringify({ error: `Polling error: ${errText}` }),
                    { status: pollRes.status, headers: { "Content-Type": "application/json" } }
                );
            }

            const pollData = await pollRes.json();
            return new Response(
                JSON.stringify({
                    id: pollData.id,
                    status: pollData.status, // "queued" | "processing" | "completed" | "error"
                    text: pollData.text || "",
                    error: pollData.error || null,
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        } catch (err: any) {
            console.error("[STT GET Error]", err);
            return new Response(
                JSON.stringify({ error: err.message || "Internal server error" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
    }

    // ─── POST /api/stt ─── Upload audio & submit transcript job (fast response < 3s)
    if (req.method === "POST") {
        try {
            let audioBuffer: ArrayBuffer;
            const contentType = req.headers.get("content-type") || "";

            if (contentType.includes("multipart/form-data")) {
                const formData = await req.formData();
                const file = formData.get("audio");
                if (!file || !(file instanceof Blob)) {
                    return new Response(
                        JSON.stringify({ error: "Audio file is missing in form-data" }),
                        { status: 400, headers: { "Content-Type": "application/json" } }
                    );
                }
                audioBuffer = await file.arrayBuffer();
            } else {
                audioBuffer = await req.arrayBuffer();
            }

            if (!audioBuffer || audioBuffer.byteLength < 100) {
                return new Response(
                    JSON.stringify({ error: "Audio payload is empty or too short" }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            // 1. Upload raw binary to AssemblyAI
            const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
                method: "POST",
                headers: {
                    "Authorization": apiKey,
                    "Content-Type": "application/octet-stream"
                },
                body: audioBuffer
            });

            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                console.error("[STT Upload Error]", uploadRes.status, errText);
                return new Response(
                    JSON.stringify({ error: `Upload failed: ${errText}` }),
                    { status: uploadRes.status, headers: { "Content-Type": "application/json" } }
                );
            }

            const uploadData = await uploadRes.json();
            const audio_url = uploadData.upload_url;

            // 2. Submit transcription job (universal-2 para melhor custo-benefício)
            const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
                method: "POST",
                headers: {
                    "Authorization": apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    audio_url,
                    speech_models: ["universal-2"],
                    language_code: "pt",
                    punctuate: true,
                    format_text: true
                })
            });

            if (!transcriptRes.ok) {
                const errText = await transcriptRes.text();
                console.error("[STT Transcript Submit Error]", transcriptRes.status, errText);
                return new Response(
                    JSON.stringify({ error: `Transcription submit failed: ${errText}` }),
                    { status: transcriptRes.status, headers: { "Content-Type": "application/json" } }
                );
            }

            const transcriptData = await transcriptRes.json();

            // Retorna imediatamente o id para o cliente fazer o polling
            return new Response(
                JSON.stringify({
                    id: transcriptData.id,
                    status: transcriptData.status || "queued"
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );

        } catch (err: any) {
            console.error("[STT POST Error]", err);
            return new Response(
                JSON.stringify({ error: err.message || "Internal server error" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
    }

    return new Response("Method Not Allowed", { status: 405 });
}
