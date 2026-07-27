import { sendArticleNotification } from "./_send";

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug } = body;

    if (!title || !slug) {
      return new Response(
        JSON.stringify({ error: "title and slug are required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const appUrl = process.env.VITE_APP_URL || "https://www.bibliavive.com.br";
    const result = await sendArticleNotification(title, slug, appUrl);

    return new Response(
      JSON.stringify({ success: true, sent: result.sent, failed: result.failed }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err: unknown) {
    console.error("Notify-publish handler error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
