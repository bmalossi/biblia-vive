export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "ASSEMBLYAI_API_KEY is not configured on the server" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

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

        // 2. Submit transcription job (usando universal-2 como modelo mais econômico para MVP)
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
        const transcriptId = transcriptData.id;

        // 3. Poll for completion
        const maxWaitMs = 50000;
        const intervalMs = 1200;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitMs) {
            const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
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
            if (pollData.status === "completed") {
                return new Response(
                    JSON.stringify({
                        text: pollData.text,
                        confidence: pollData.confidence,
                        words: pollData.words
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            }

            if (pollData.status === "error") {
                return new Response(
                    JSON.stringify({ error: pollData.error || "Transcription failed" }),
                    { status: 500, headers: { "Content-Type": "application/json" } }
                );
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        return new Response(
            JSON.stringify({ error: "Transcription timed out on server" }),
            { status: 504, headers: { "Content-Type": "application/json" } }
        );

    } catch (err: any) {
        console.error("[STT Handler Error]", err);
        return new Response(
            JSON.stringify({ error: err.message || "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
