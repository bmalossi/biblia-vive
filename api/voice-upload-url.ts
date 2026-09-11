import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Gera uma presigned PUT URL usando AWS Signature V4 com crypto nativo do Node.js.
 * Zero SDKs pesados, zero chamadas de rede externas -> zero risco de timeout.
 */
function createPresignedPutUrl({
    endpoint,
    bucket,
    key,
    accessKeyId,
    secretAccessKey,
    expiresIn = 300, // 5 minutos padrão para áudio temporário
}: {
    endpoint: string;
    bucket: string;
    key: string;
    accessKeyId: string;
    secretAccessKey: string;
    expiresIn?: number;
}): string {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const amzDate = now.toISOString().replace(/[:-]/g, "").replace(/\.\d+/, ""); // YYYYMMDDTHHMMSSZ

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

/**
 * Handler compatível tanto com o Vercel Serverless (req, res)
 * quanto com o ambiente de desenvolvimento Vite (req: Request).
 */
export default async function handler(req: any, res?: any) {
    const method = req.method || (req as Request).method;
    if (method !== "POST") {
        if (res && typeof res.status === "function") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        // Prioriza credenciais exclusivas de voz (VOICE_R2_*), com fallback para as gerais (R2_*)
        const r2AccessKeyId = process.env.VOICE_R2_ACCESS_KEY_ID || process.env.R2_VOICE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
        const r2SecretAccessKey = process.env.VOICE_R2_SECRET_ACCESS_KEY || process.env.R2_VOICE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
        const r2Endpoint = process.env.VOICE_R2_ENDPOINT || process.env.R2_ENDPOINT;
        const r2BucketName = process.env.VOICE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;
        const r2PublicUrl = process.env.VOICE_R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || "https://midia.bibliavive.com.br";

        if (!r2AccessKeyId || !r2SecretAccessKey || !r2Endpoint || !r2BucketName) {
            const errData = { error: "R2 voice storage credentials are not configured on the server" };
            if (res && typeof res.status === "function") {
                return res.status(500).json(errData);
            }
            return new Response(JSON.stringify(errData), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Lê extensão ou tipo de áudio se informado
        let ext = "webm";
        if (req.body) {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
            if (body.extension && typeof body.extension === "string") {
                ext = body.extension.replace(/^\./, "").toLowerCase();
            }
        } else if (typeof (req as Request).json === "function") {
            try {
                const body = await (req as Request).json();
                if (body?.extension && typeof body.extension === "string") {
                    ext = body.extension.replace(/^\./, "").toLowerCase();
                }
            } catch {
                // silencioso
            }
        }

        const randomSuffix = randomBytes(6).toString("hex");
        const key = `speech-to-text/${Date.now()}-${randomSuffix}.${ext}`;

        const uploadUrl = createPresignedPutUrl({
            endpoint: r2Endpoint,
            bucket: r2BucketName,
            key,
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretAccessKey,
            expiresIn: 300, // 5 minutos
        });

        const audioUrl = `${r2PublicUrl.replace(/\/$/, "")}/${key}`;

        const responsePayload = {
            uploadUrl,
            audioUrl,
            key,
            expiresIn: 300
        };

        if (res && typeof res.status === "function") {
            return res.status(200).json(responsePayload);
        }

        return new Response(JSON.stringify(responsePayload), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("[Voice Upload URL Error]:", err);
        const errPayload = { error: err.message || "Internal Server Error" };
        if (res && typeof res.status === "function") {
            return res.status(500).json(errPayload);
        }
        return new Response(JSON.stringify(errPayload), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
