import { sendArticleNotification } from "./_send";

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { title, slug } = body;

    if (!title || !slug) {
      return new Response(
        JSON.stringify({ error: "title and slug are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const appUrl = process.env.VITE_APP_URL || "https://www.bibliavive.com.br";

    const result = await sendArticleNotification(title, slug, appUrl);

    return new Response(
      JSON.stringify({ success: true, sent: result.sent, failed: result.failed }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Notify-publish handler error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}