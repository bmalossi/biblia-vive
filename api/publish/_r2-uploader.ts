import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const endpoint =
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing Cloudflare R2 credentials (R2_ENDPOINT or R2_ACCOUNT_ID, plus R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)"
    );
  }

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3ClientInstance;
}

export function resetS3ClientForTesting(): void {
  s3ClientInstance = null;
}

export interface UploadResult {
  success: boolean;
  key: string;
  bucket: string;
  error?: string;
}

/**
 * Uploads an HTML string to Cloudflare R2 bucket with optimal cache headers.
 */
export async function uploadHtmlToR2(
  key: string,
  htmlContent: string,
  customBucket?: string
): Promise<UploadResult> {
  const bucket = customBucket || process.env.R2_HTML_BUCKET_NAME || process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("Missing R2 bucket configuration (R2_HTML_BUCKET_NAME or R2_BUCKET_NAME)");
  }

  try {
    const s3 = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(htmlContent, "utf-8"),
      ContentType: "text/html; charset=utf-8",
      CacheControl: "public, s-maxage=3600, stale-while-revalidate=86400",
    });

    await s3.send(command);
    return { success: true, key, bucket };
  } catch (err: any) {
    console.error(`[r2-uploader] Failed to upload ${key} to bucket ${bucket}:`, err);
    return { success: false, key, bucket, error: err.message || String(err) };
  }
}
