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

        // Authenticate the requesting user
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Invalid or expired token" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch the user's subscription record
        const { data: sub, error: subError } = await supabase
            .from("user_subscriptions")
            .select("stripe_subscription_id, status")
            .eq("user_id", user.id)
            .maybeSingle();

        if (subError || !sub?.stripe_subscription_id) {
            return new Response(
                JSON.stringify({ error: "No active subscription found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (sub.status === "canceled") {
            return new Response(
                JSON.stringify({ error: "Subscription is already canceled" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Cancel at period end (user keeps access until billing cycle ends)
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        const updatedSub = await stripe.subscriptions.update(sub.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        console.log(`[stripe-cancel] ✅ Subscription ${sub.stripe_subscription_id} set to cancel_at_period_end for user ${user.id}`);

        return new Response(
            JSON.stringify({
                ok: true,
                cancel_at_period_end: updatedSub.cancel_at_period_end,
                cancel_at: updatedSub.cancel_at,
                current_period_end: updatedSub.current_period_end,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("[stripe-cancel] Error:", err?.message, err);
        return new Response(
            JSON.stringify({ error: err?.message || "Internal error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
