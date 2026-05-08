import { createHash, createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Generates an AWS Signature V4 presigned PUT URL using pure Node.js crypto.
 * No S3 SDK → no network calls → no timeouts.
 */
function createPresignedPutUrl({
    endpoint,
    bucket,
    key,
    accessKeyId,
    secretAccessKey,
    expiresIn = 3600,
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

    // Path: /{bucket}/{key}  (path-style, each segment encoded separately)
    const pathParts = [bucket, ...key.split("/")].map(s => encodeURIComponent(s));
    const encodedPath = "/" + pathParts.join("/");

    // Canonical query string (params sorted by key)
    const rawParams: [string, string][] = [
        ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
        ["X-Amz-Credential", credential],
        ["X-Amz-Date", amzDate],
        ["X-Amz-Expires", String(expiresIn)],
        ["X-Amz-SignedHeaders", "host"],
    ];
    rawParams.sort((a, b) => a[0].localeCompare(b[0]));
    const qs = rawParams.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");

    // Canonical request
    const canonicalRequest = [
        "PUT",
        encodedPath,
        qs,
        `host:${host}\n`,
        "host",
        "UNSIGNED-PAYLOAD",
    ].join("\n");

    // String to sign
    const reqHash = createHash("sha256").update(canonicalRequest).digest("hex");
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${reqHash}`;

    // Signing key (HMAC chain)
    const kDate = createHmac("sha256", `AWS4${secretAccessKey}`).update(ymd).digest();
    const kRegion = createHmac("sha256", kDate).update(region).digest();
    const kService = createHmac("sha256", kRegion).update(service).digest();
    const kReq = createHmac("sha256", kService).update("aws4_request").digest();
    const signature = createHmac("sha256", kReq).update(stringToSign).digest("hex");

    return `${endpoint}/${bucket}/${key}?${qs}&X-Amz-Signature=${signature}`;
}

/**
 * VERCEL NODE.JS HANDLER — uses the two-argument (req, res) pattern to ensure
 * the HTTP response is properly closed. The one-argument (req: Request) pattern
 * causes 60s timeouts on Vercel Node.js runtime because res.end() is never called.
 */
export default async function handler(req: any, res: any) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
        const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        const r2Endpoint = process.env.R2_ENDPOINT;
        const r2BucketName = process.env.R2_BUCKET_NAME;
        const r2PublicUrl = process.env.VITE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;

        if (!r2AccessKeyId || !r2SecretAccessKey || !r2Endpoint || !r2BucketName) {
            return res.status(500).json({ error: "R2 configuration missing" });
        }

        // req.body is auto-parsed by Vercel when Content-Type: application/json
        const body = req.body || {};
        const { filename, contentType, manifestOnly } = body;

        if (!filename || !contentType) {
            return res.status(400).json({ error: "Missing filename or contentType" });
        }

        // Verify admin via Supabase (with persistSession: false to prevent background connections)
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const token = String(authHeader).replace("Bearer ", "");

        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
            auth: { persistSession: false },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user || (user.app_metadata as any).role !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }

        // Generate presigned URL — pure crypto, zero network calls
        const key = manifestOnly ? "r2-media-index.json" : `articles/${Date.now()}-${filename}`;
        const uploadUrl = createPresignedPutUrl({
            endpoint: r2Endpoint,
            bucket: r2BucketName,
            key,
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretAccessKey,
        });
        const finalUrl = `${r2PublicUrl}/${key}`;

        return res.status(200).json({ uploadUrl, finalUrl, key });

    } catch (err: any) {
        console.error("[R2 Upload Error]:", err.message);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
}
