import { requireAdmin, getServiceSupabase } from "./_admin";

const JSON_HEADERS = { "Content-Type": "application/json" };

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function countTokensSince(since: string | null): Promise<number> {
  const supabase = getServiceSupabase();
  let query = supabase.from("push_tokens").select("*", { count: "exact", head: true });

  if (since) {
    query = query.gte("created_at", since);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function sumInvalidRemovals(since: string | null): Promise<number | null> {
  const supabase = getServiceSupabase();
  let query = supabase
    .from("push_token_removals")
    .select("count")
    .eq("reason", "invalid_token");

  if (since) {
    query = query.gte("removed_at", since);
  }

  const { data, error } = await query;

  // Tabela de auditoria ainda não migrada — retorna null em vez de falhar o endpoint.
  if (error) {
    if (error.code === "42P01" || error.message.includes("push_token_removals")) {
      return null;
    }
    throw error;
  }

  return (data ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0);
}

export default async function handler(req: Request) {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof Response) return authResult;

    const [total, addedLast7Days, addedLast30Days, removedTotal, removedLast7Days, removedLast30Days] =
      await Promise.all([
        countTokensSince(null),
        countTokensSince(daysAgo(7)),
        countTokensSince(daysAgo(30)),
        sumInvalidRemovals(null),
        sumInvalidRemovals(daysAgo(7)),
        sumInvalidRemovals(daysAgo(30)),
      ]);

    return new Response(
      JSON.stringify({
        total,
        addedLast7Days,
        addedLast30Days,
        addedAllTime: total,
        removedByInvalidation: {
          total: removedTotal,
          last7Days: removedLast7Days,
          last30Days: removedLast30Days,
          tracked: removedTotal !== null,
        },
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err: unknown) {
    console.error("Notification stats error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
