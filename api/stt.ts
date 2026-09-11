import { createHash, createHmac, randomBytes } from "node:crypto";

function createPresignedPutUrl({
    endpoint,
    bucket,
    key,
    accessKeyId,
    secretAccessKey,
    expiresIn = 300,
}: {
    endpoint: string;
    bucket: string;
    key: string;
    accessKeyId: string;
    secretAccessKey: string;
    expiresIn?: number;
}): string {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const amzDate = now.toISOString().replace(/[:-]/g, "").replace(/\.\d+/, "");

    const region = "auto";
    const service = "s3";
    const host = new URL(endpoint).host;
    const scope = `${ymd}/${region}/${service}/aws4_request`;
    const credential = `${accessKeyId}/${scope}`;

    const pathParts = [bucket, ...key.split("/")].map(s => encodeURIComponent(s));
    const encodedPath = "/" + pathParts.join("/");

    const rawParams: [string, string][] = [
        ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
        ["X-Amz-Credential", credential],
        ["X-Amz-Date", amzDate],
        ["X-Amz-Expires", String(expiresIn)],
        ["X-Amz-SignedHeaders", "host"],
    ];
    rawParams.sort((a, b) => a[0].localeCompare(b[0]));
    const qs = rawParams.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");

    const canonicalRequest = [
        "PUT",
        encodedPath,
        qs,
        `host:${host}\n`,
        "host",
        "UNSIGNED-PAYLOAD",
    ].join("\n");

    const reqHash = createHash("sha256").update(canonicalRequest).digest("hex");
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${reqHash}`;

    const kDate = createHmac("sha256", `AWS4${secretAccessKey}`).update(ymd).digest();
    const kRegion = createHmac("sha256", kDate).update(region).digest();
    const kService = createHmac("sha256", kRegion).update(service).digest();
    const kReq = createHmac("sha256", kService).update("aws4_request").digest();
    const signature = createHmac("sha256", kReq).update(stringToSign).digest("hex");

    return `${endpoint}/${bucket}/${key}?${qs}&X-Amz-Signature=${signature}`;
}

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

    // ─── GET /api/stt?action=upload-url OU GET /api/stt?id=<transcript_id> ───
    if (method === "GET") {
        try {
            let id: string | null = null;
            let action: string | null = null;
            if (req.query) {
                id = req.query.id ? String(req.query.id) : null;
                action = req.query.action ? String(req.query.action) : null;
            } else if (req.url) {
                const url = new URL(req.url, "http://localhost");
                id = url.searchParams.get("id");
                action = url.searchParams.get("action");
            }

            // Sub-ação: Gerar presigned PUT URL para o Cloudflare R2
            if (action === "upload-url") {
                const r2AccessKeyId = process.env.VOICE_R2_ACCESS_KEY_ID || process.env.R2_VOICE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
                const r2SecretAccessKey = process.env.VOICE_R2_SECRET_ACCESS_KEY || process.env.R2_VOICE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
                const r2Endpoint = process.env.VOICE_R2_ENDPOINT || process.env.R2_ENDPOINT;
                const r2BucketName = process.env.VOICE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;
                const r2PublicUrl = process.env.VOICE_R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || "https://midia.bibliavive.com.br";

                if (!r2AccessKeyId || !r2SecretAccessKey || !r2Endpoint || !r2BucketName) {
                    return respondJson({ error: "R2 voice storage credentials are not configured on the server" }, 500);
                }

                const randomSuffix = randomBytes(6).toString("hex");
                const key = `speech-to-text/${Date.now()}-${randomSuffix}.webm`;

                const uploadUrl = createPresignedPutUrl({
                    endpoint: r2Endpoint,
                    bucket: r2BucketName,
                    key,
                    accessKeyId: r2AccessKeyId,
                    secretAccessKey: r2SecretAccessKey,
                    expiresIn: 300,
                });

                const audioUrl = `${r2PublicUrl.replace(/\/$/, "")}/${key}`;

                return respondJson({
                    uploadUrl,
                    audioUrl,
                    key,
                    expiresIn: 300
                }, 200);
            }

            // Consulta de resultado AssemblyAI
            if (!apiKey) {
                return respondJson({ error: "ASSEMBLYAI_API_KEY is not configured on the server" }, 500);
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

