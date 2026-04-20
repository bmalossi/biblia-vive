// @ts-ignore - Deno env
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
// @ts-ignore - Deno env
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno&no-check";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
            return new Response(
                JSON.stringify({ error: "Server configuration error" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const body = await req.json().catch(() => ({}));
        const userId: string | undefined = body.userId;

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "User ID is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Fetch the stripe_customer_id for this user
        const { data: sub, error: subError } = await supabase
            .from("user_subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", userId)
            .maybeSingle();

        if (subError || !sub?.stripe_customer_id) {
            console.error("[stripe-portal] No customer found for user:", userId, subError?.message);
            return new Response(
                JSON.stringify({ error: "Nenhuma assinatura ativa encontrada para este usuário." }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create a Stripe Customer Portal session
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: sub.stripe_customer_id,
            return_url: "https://www.bibliavive.com.br/conta",
            locale: "pt-BR",
        });

        console.log(`[stripe-portal] ✅ Portal session created for user ${userId}`);

        return new Response(JSON.stringify({ url: portalSession.url }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("[stripe-portal] Error:", err?.message, err);
        return new Response(
            JSON.stringify({ error: err?.message || "Internal Server Error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
