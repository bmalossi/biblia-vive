import { createClient, type User } from "@supabase/supabase-js";

const JSON_HEADERS = { "Content-Type": "application/json" };

function getAuthorizationHeader(request: Request): string | null {
  if (typeof request.headers?.get === "function") {
    return request.headers.get("Authorization");
  }

  const rawHeaders = request.headers as unknown as Record<string, string | string[] | undefined>;
  const value = rawHeaders?.authorization ?? rawHeaders?.Authorization;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { supabaseUrl, supabaseServiceKey };
}

export async function requireAdmin(request: Request): Promise<{ user: User } | Response> {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig();

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  const authHeader = getAuthorizationHeader(request);
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  const appMeta = user.app_metadata as Record<string, unknown> | undefined;
  const userMeta = user.user_metadata as Record<string, unknown> | undefined;
  const isAdmin = appMeta?.role === "admin" || userMeta?.role === "admin";

  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  return { user };
}

export function getServiceSupabase() {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig();

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase env vars not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
