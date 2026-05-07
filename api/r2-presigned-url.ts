import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

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
        const { filename, contentType } = body;

        if (!filename || !contentType) {
            return new Response("Missing filename or contentType", { status: 400 });
        }

        // 1. Verify Admin via Supabase
        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response("Unauthorized", { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user || (user.app_metadata as any).role !== "admin") {
            return new Response("Forbidden", { status: 403 });
        }

        // 2. Initialize S3 Client for R2
        const s3 = new S3Client({
            region: "us-east-1", // Fixed region for signing; Cloudflare ignores this
            endpoint: r2Endpoint,
            forcePathStyle: true, // Required: prevents virtual-hosted-style URL resolution
            credentials: {
                accessKeyId: r2AccessKeyId,
                secretAccessKey: r2SecretAccessKey,
            },
        });

        // 3. Generate Presigned URLs in parallel (getSignedUrl makes a network call to R2)
        const key = `articles/${Date.now()}-${filename}`;
        const [uploadUrl, manifestUploadUrl] = await Promise.all([
            getSignedUrl(s3, new PutObjectCommand({
                Bucket: r2BucketName,
                Key: key,
                ContentType: contentType,
            }), { expiresIn: 3600 }),
            getSignedUrl(s3, new PutObjectCommand({
                Bucket: r2BucketName,
                Key: "r2-media-index.json",
                ContentType: "application/json",
            }), { expiresIn: 3600 }),
        ]);
        const finalUrl = `${r2PublicUrl}/${key}`;

        return new Response(JSON.stringify({ uploadUrl, finalUrl, manifestUploadUrl, key, filename }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[R2 Upload Error]:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
