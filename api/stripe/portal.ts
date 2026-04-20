import Stripe from "stripe";

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
            return new Response(
                JSON.stringify({ error: "Missing Environment Variables" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await req.json().catch(() => ({}));
        const userId = body.userId;

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "User ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // ── Fetch stripe_customer_id via native fetch with timeout ──────────
        // The Supabase SDK hangs indefinitely on this project — use raw REST instead.
        const controller = new AbortController();
        const dbTimeout = setTimeout(() => controller.abort(), 8000);

        let stripeCustomerId: string | null = null;
        try {
            const dbRes = await fetch(
                `${supabaseUrl}/rest/v1/user_subscriptions?select=stripe_customer_id&user_id=eq.${userId}&limit=1`,
                {
                    headers: {
                        apikey: supabaseServiceRoleKey,
                        Authorization: `Bearer ${supabaseServiceRoleKey}`,
                        Accept: "application/json",
                    },
                    signal: controller.signal,
                }
            );

            if (!dbRes.ok) {
                throw new Error(`Supabase query failed: ${dbRes.status}`);
            }

            const rows: { stripe_customer_id: string | null }[] = await dbRes.json();
            stripeCustomerId = rows?.[0]?.stripe_customer_id ?? null;
        } finally {
            clearTimeout(dbTimeout);
        }

        if (!stripeCustomerId) {
            return new Response(
                JSON.stringify({ error: "No active Stripe customer found for this user." }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // ── Create Stripe Billing Portal session ────────────────────────────
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16" as any,
            httpClient: Stripe.createFetchHttpClient(),
        });

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: "https://www.bibliavive.com.br/conta",
            locale: "pt-BR",
        });

        return new Response(JSON.stringify({ url: portalSession.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[stripe/portal] Error:", err?.message ?? err);
        return new Response(
            JSON.stringify({ error: err?.message || "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
