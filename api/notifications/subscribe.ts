import { createClient } from "@supabase/supabase-js";

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const { error } = await supabase
      .from("push_tokens")
      .upsert({ token }, { onConflict: "token" });

    if (error) {
      console.error("Subscribe error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save token" }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err: unknown) {
    console.error("Subscribe handler error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
