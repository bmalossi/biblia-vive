import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type TokenRemovalRow = {
  count: number | null;
  removed_at: string;
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { supabaseUrl, supabaseServiceKey };
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function readJsonBody(req: { body?: unknown }): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") {
    return req.body as Record<string, unknown>;
  }
  return {};
}

function getAuthToken(req: { headers?: Record<string, string | string[] | undefined>; body?: unknown }): string | null {
  const header = req.headers?.authorization ?? req.headers?.Authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.replace("Bearer ", "");
  }
  if (Array.isArray(header) && header[0]?.startsWith("Bearer ")) {
    return header[0].replace("Bearer ", "");
  }
  return null;
}

async function requireAdmin(req: { headers?: Record<string, string | string[] | undefined>; body?: unknown }) {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseServiceKey) {
    return { status: 500 as const, body: { error: "Server configuration error" } };
  }

  const token = getAuthToken(req);
  if (!token) {
    return { status: 401 as const, body: { error: "Unauthorized" } };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { status: 403 as const, body: { error: "Forbidden" } };
  }

  const appMeta = user.app_metadata as Record<string, unknown> | undefined;
  const userMeta = user.user_metadata as Record<string, unknown> | undefined;
  const isAdmin = appMeta?.role === "admin" || userMeta?.role === "admin";

  if (!isAdmin) {
    return { status: 403 as const, body: { error: "Forbidden" } };
  }

  return { status: 200 as const, user: user as User, supabase };
}

async function buildStats(supabase: SupabaseClient) {
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  const [totalRes, last7Res, last30Res, removalsRes] = await Promise.all([
    supabase.from("push_tokens").select("token", { count: "exact", head: true }),
    supabase
      .from("push_tokens")
      .select("token", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("push_tokens")
      .select("token", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
    supabase.from("push_token_removals").select("count, removed_at").eq("reason", "invalid_token"),
  ]);

  if (totalRes.error) throw totalRes.error;

  let removedTotal: number | null = null;
  let removedLast7Days: number | null = null;
  let removedLast30Days: number | null = null;

  if (!removalsRes.error && removalsRes.data) {
    removedTotal = 0;
    removedLast7Days = 0;
    removedLast30Days = 0;
    for (const row of removalsRes.data as TokenRemovalRow[]) {
      const count = row.count ?? 0;
      removedTotal += count;
      if (row.removed_at >= sevenDaysAgo) removedLast7Days += count;
      if (row.removed_at >= thirtyDaysAgo) removedLast30Days += count;
    }
  }

  return {
    total: totalRes.count ?? 0,
    addedLast7Days: last7Res.error ? 0 : (last7Res.count ?? 0),
    addedLast30Days: last30Res.error ? 0 : (last30Res.count ?? 0),
    addedAllTime: totalRes.count ?? 0,
    removedByInvalidation: {
      total: removedTotal,
      last7Days: removedLast7Days,
      last30Days: removedLast30Days,
      tracked: removedTotal !== null,
    },
  };
}

/**
 * Handler Node.js (req, res) — padrão estável no runtime Vercel deste projeto.
 */
export default async function handler(req: { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await readJsonBody(req);
    const auth = await requireAdmin(req);
    if (auth.status !== 200) {
      return res.status(auth.status).json(auth.body);
    }

    const stats = await buildStats(auth.supabase);
    return res.status(200).json(stats);
  } catch (err: unknown) {
    console.error("Notification stats error:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
