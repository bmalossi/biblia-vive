import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
    // We allow GET for listing
    if (req.method !== "GET" && req.method !== "POST") {
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
            region: "auto",
            endpoint: r2Endpoint,
            forcePathStyle: true, // Required for Cloudflare R2 list operations
            credentials: {
                accessKeyId: r2AccessKeyId,
                secretAccessKey: r2SecretAccessKey,
            },
        });

        // 3. List Objects
        const command = new ListObjectsV2Command({
            Bucket: r2BucketName,
            Prefix: "articles/",
        });

        const data = await s3.send(command);

        // 4. Map to public URLs and clean metadata
        const images = (data.Contents ?? [])
            .filter(obj => obj.Key && !obj.Key.endsWith("/")) // exclude folders
            .map(obj => ({
                key: obj.Key,
                url: `${r2PublicUrl}/${obj.Key}`,
                lastModified: obj.LastModified,
                size: obj.Size,
            }))
            .sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0));

        return new Response(JSON.stringify({ images }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[R2 List Error]:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
