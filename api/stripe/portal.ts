import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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
                { status: 500 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const userId = body.userId;

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "User ID is required" }),
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { data: subscription } = await supabase
            .from("user_subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", userId)
            .maybeSingle();

        if (!subscription || !subscription.stripe_customer_id) {
            return new Response(
                JSON.stringify({ error: "No active Stripe customer found" }),
                { status: 404 }
            );
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16" as any,
            httpClient: Stripe.createFetchHttpClient(),
        });

        const returnUrl = "https://www.bibliavive.com.br/plano";

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: returnUrl,
            locale: "pt-BR",
        });

        return new Response(JSON.stringify({ url: portalSession.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("Stripe Portal Error:", err);
        return new Response(
            JSON.stringify({ error: err.message || "Internal Server Error" }),
            { status: 500 }
        );
    }
}
