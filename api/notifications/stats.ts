import { requireAdmin, getServiceSupabase } from "./_admin";

const JSON_HEADERS = { "Content-Type": "application/json" };

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function countTokensSince(since: string | null): Promise<number> {
  const supabase = getServiceSupabase();
  let query = supabase.from("push_tokens").select("token", { count: "exact", head: true });

  if (since) {
    query = query.gte("created_at", since);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function safeCountTokensSince(since: string | null): Promise<number> {
  try {
    return await countTokensSince(since);
  } catch (err) {
    console.warn("countTokensSince fallback:", since, err);
    return 0;
  }
}

async function sumInvalidRemovals(since: string | null): Promise<number | null> {
  try {
    const supabase = getServiceSupabase();
    let query = supabase
      .from("push_token_removals")
      .select("count")
      .eq("reason", "invalid_token");

    if (since) {
      query = query.gte("removed_at", since);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("sumInvalidRemovals unavailable:", error.code, error.message);
      return null;
    }

    return (data ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0);
  } catch (err) {
    console.warn("sumInvalidRemovals error:", err);
    return null;
  }
}

async function handleStats(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof Response) return authResult;

    const total = await countTokensSince(null);
    const [addedLast7Days, addedLast30Days, removedTotal, removedLast7Days, removedLast30Days] =
      await Promise.all([
        safeCountTokensSince(daysAgo(7)),
        safeCountTokensSince(daysAgo(30)),
        sumInvalidRemovals(null),
        sumInvalidRemovals(daysAgo(7)),
        sumInvalidRemovals(daysAgo(30)),
      ]);

    const removalsTracked =
      removedTotal !== null || removedLast7Days !== null || removedLast30Days !== null;

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
          tracked: removalsTracked,
        },
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err: unknown) {
    console.error("Notification stats error:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}

export async function GET(request: Request) {
  return handleStats(request);
}

export async function POST(request: Request) {
  return handleStats(request);
}
