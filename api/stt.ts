export default async function handler(req: any, res?: any) {
    const method = req.method || (req as Request).method;
    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    const respondJson = (data: any, status = 200) => {
        if (res && typeof res.status === "function") {
            return res.status(status).json(data);
        }
        return new Response(JSON.stringify(data), {
            status,
            headers: { "Content-Type": "application/json" }
        });
    };

    if (!apiKey) {
        return respondJson({ error: "ASSEMBLYAI_API_KEY is not configured on the server" }, 500);
    }

    // ─── GET /api/stt?id=<transcript_id> ─── Polling status & result
    if (method === "GET") {
        try {
            let id: string | null = null;
            if (req.query && req.query.id) {
                id = String(req.query.id);
            } else if (req.url) {
                const url = new URL(req.url, "http://localhost");
                id = url.searchParams.get("id");
            }

            if (!id) {
                return respondJson({ error: "Query parameter 'id' is required" }, 400);
            }

            const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { "Authorization": apiKey }
            });

            if (!pollRes.ok) {
                const errText = await pollRes.text();
                return respondJson({ error: `Polling error: ${errText}` }, pollRes.status);
            }

            const pollData = await pollRes.json();
            return respondJson({
                id: pollData.id,
                status: pollData.status, // "queued" | "processing" | "completed" | "error"
                text: pollData.text || "",
                error: pollData.error || null,
            }, 200);
        } catch (err: any) {
            console.error("[STT GET Error]", err);
            return respondJson({ error: err.message || "Internal server error" }, 500);
        }
    }

    // ─── POST /api/stt ─── Submeter transcrição via URL (R2) ou upload direto
    if (method === "POST") {
        try {
            let audioUrl = "";

            // 1. Tenta extrair audioUrl de JSON body (Fluxo recomendado via Cloudflare R2)
            if (req.body) {
                const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
                audioUrl = body?.audioUrl || body?.audio_url || "";
            } else if (typeof (req as Request).json === "function") {
                try {
                    const body = await (req as Request).json();
                    audioUrl = body?.audioUrl || body?.audio_url || "";
                } catch {
                    // body pode ser multipart ou binário
                }
            }

            // 2. Se não veio audioUrl, verifica se veio binário direto (fallback legado)
            if (!audioUrl) {
                let audioBuffer: ArrayBuffer | null = null;
                const contentType = (req.headers && (req.headers["content-type"] || req.headers.get?.("content-type"))) || "";

                if (typeof (req as Request).formData === "function" && contentType.includes("multipart/form-data")) {
                    const formData = await (req as Request).formData();
                    const file = formData.get("audio");
                    if (file && file instanceof Blob) {
                        audioBuffer = await file.arrayBuffer();
                    }
                } else if (typeof (req as Request).arrayBuffer === "function") {
                    audioBuffer = await (req as Request).arrayBuffer();
                }

                if (audioBuffer && audioBuffer.byteLength >= 100) {
                    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
                        method: "POST",
                        headers: {
                            "Authorization": apiKey,
                            "Content-Type": "application/octet-stream"
                        },
                        body: audioBuffer
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        audioUrl = uploadData.upload_url;
                    }
                }
            }

            if (!audioUrl) {
                return respondJson({ error: "audioUrl is required or audio payload was empty" }, 400);
            }

            // 3. Submeter job de transcrição para a AssemblyAI (modelo universal-2 em pt-BR)
            const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
                method: "POST",
                headers: {
                    "Authorization": apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    speech_models: ["universal-2"],
                    language_code: "pt",
                    punctuate: true,
                    format_text: true
                })
            });

            if (!transcriptRes.ok) {
                const errText = await transcriptRes.text();
                console.error("[STT Transcript Submit Error]", transcriptRes.status, errText);
                return respondJson({ error: `Transcription submit failed: ${errText}` }, transcriptRes.status);
            }

            const transcriptData = await transcriptRes.json();

            return respondJson({
                id: transcriptData.id,
                status: transcriptData.status || "queued"
            }, 200);

        } catch (err: any) {
            console.error("[STT POST Error]", err);
            return respondJson({ error: err.message || "Internal server error" }, 500);
        }
    }

    return respondJson({ error: "Method Not Allowed" }, 405);
}

