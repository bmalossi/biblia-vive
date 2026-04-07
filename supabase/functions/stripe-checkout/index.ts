// @ts-ignore - Deno env
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const userId: string | undefined = body.userId;
        const userEmail: string | undefined = body.email;
        const planType: 'pro' | 'templo' = body.planType || 'pro'; // default to pro for backwards compatibility

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        let priceId = Deno.env.get(`STRIPE_PRICE_ID_${planType.toUpperCase()}`);

        // Retrocompatibilidade se usuário ainda não dividiu a var: fallback apenas pro "pro"
        if (!priceId && planType === 'pro') {
            priceId = Deno.env.get("STRIPE_PRICE_ID");
        }

        if (!stripeSecretKey || !priceId) {
            console.error(`[stripe-checkout] Missing configuration for plan: ${planType}`);
            return new Response(
                JSON.stringify({ error: `Configuração do Stripe ausente para o plano ${planType}` }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "User ID is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Derive the origin from the Referer or use the production URL as fallback
        const referer = req.headers.get("referer") || req.headers.get("origin") || "";
        let origin = "https://bibliavive.com.br";
        try {
            if (referer) {
                const u = new URL(referer);
                origin = `${u.protocol}//${u.host}`;
            }
        } catch (_) {
            // keep fallback
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: "subscription",
            success_url: `${origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pro?canceled=true`,
            client_reference_id: userId,
            customer_email: userEmail || undefined,
            allow_promotion_codes: true,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("[stripe-checkout] Error:", err?.message, err);
        return new Response(
            JSON.stringify({ error: err?.message || "Internal Server Error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
