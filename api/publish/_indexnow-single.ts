export interface IndexNowResult {
  success: boolean;
  url: string;
  statusCode?: number;
  error?: string;
}

const DEFAULT_KEY = "4f9b8c2e7a1d3f5b8e9a0c1d2e3f4a5b";
const DEFAULT_HOST = "www.bibliavive.com.br";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Sends a single article URL notification to IndexNow (Bing, ChatGPT Search, Seznam, etc.)
 * Tolerant to external failures: never throws, logs and returns result object.
 */
export async function notifyIndexNowSingle(
  slug: string,
  options?: { host?: string; key?: string }
): Promise<IndexNowResult> {
  const host = options?.host || process.env.INDEXNOW_HOST || DEFAULT_HOST;
  const key = options?.key || process.env.INDEXNOW_KEY || DEFAULT_KEY;
  const articleUrl = `https://${host}/artigos/${slug}`;

  try {
    const payload = {
      host,
      key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: [articleUrl],
    };

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    // 200 = OK, 202 = Accepted
    if (response.ok || response.status === 200 || response.status === 202) {
      return {
        success: true,
        url: articleUrl,
        statusCode: response.status,
      };
    }

    const responseText = await response.text();
    const errorMsg = `IndexNow returned status ${response.status}: ${responseText}`;
    console.warn(`[indexnow-single] ${errorMsg}`);
    return {
      success: false,
      url: articleUrl,
      statusCode: response.status,
      error: errorMsg,
    };
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    console.warn(`[indexnow-single] Network error submitting ${articleUrl}:`, errorMsg);
    return {
      success: false,
      url: articleUrl,
      error: errorMsg,
    };
  }
}
