import crypto from "crypto";
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

    // Encode path: keep slashes between segments, encode each segment
    const encodedPath = "/" + [bucket, ...key.split("/")]
        .map(s => encodeURIComponent(s))
        .join("/");

    // Canonical query string (params must be sorted)
    const params: [string, string][] = [
        ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
        ["X-Amz-Credential", credential],
        ["X-Amz-Date", amzDate],
        ["X-Amz-Expires", String(expiresIn)],
        ["X-Amz-SignedHeaders", "host"],
    ].sort((a, b) => a[0].localeCompare(b[0]));

    const qs = params
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

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
    const reqHash = crypto.createHash("sha256").update(canonicalRequest).digest("hex");
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${reqHash}`;

    // Signing key
    const kDate = crypto.createHmac("sha256", `AWS4${secretAccessKey}`).update(ymd).digest();
    const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
    const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
    const kReq = crypto.createHmac("sha256", kService).update("aws4_request").digest();
    const signature = crypto.createHmac("sha256", kReq).update(stringToSign).digest("hex");

    return `${endpoint}/${bucket}/${key}?${qs}&X-Amz-Signature=${signature}`;
}

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
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
            return new Response(JSON.stringify({ error: "R2 configuration missing" }), { status: 500 });
        }

        const body = await req.json().catch(() => ({}));
        const { filename, contentType, manifestOnly } = body;

        if (!filename || !contentType) {
            return new Response("Missing filename or contentType", { status: 400 });
        }

        // Verify admin via Supabase
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "");
        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user || (user.app_metadata as any).role !== "admin") {
            return new Response("Forbidden", { status: 403 });
        }

        // Generate presigned URL — pure crypto, no network calls
        const key = manifestOnly ? "r2-media-index.json" : `articles/${Date.now()}-${filename}`;
        const uploadUrl = createPresignedPutUrl({
            endpoint: r2Endpoint,
            bucket: r2BucketName,
            key,
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretAccessKey,
        });
        const finalUrl = `${r2PublicUrl}/${key}`;

        return new Response(JSON.stringify({ uploadUrl, finalUrl, key }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[R2 Upload Error]:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
