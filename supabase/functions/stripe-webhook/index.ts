// @ts-ignore - Deno env
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
// @ts-ignore - Deno env
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno&no-check";

Deno.serve(async (req: Request) => {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
            console.error("[stripe-webhook] Missing critical environment variables");
            return new Response("Server configuration error", { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            return new Response("Missing Stripe signature", { status: 400 });
        }

        // Read raw body for signature verification
        const rawBody = await req.text();

        let event: Stripe.Event;
        try {
            event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
        } catch (err: any) {
            console.error("[stripe-webhook] Signature verification failed:", err.message);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;
            const userId = session.client_reference_id;

            if (userId && subscriptionId) {
                console.log(`[stripe-webhook] ✅ Checkout completed for user ${userId}`);

                const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

                const { error } = await supabase
                    .from("user_subscriptions")
                    .upsert(
                        {
                            user_id: userId,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            status: subscription.status,
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        },
                        { onConflict: "user_id" }
                    );

                if (error) {
                    console.error("[stripe-webhook] Supabase upsert failed:", error.message);
                    return new Response("Database error", { status: 500 });
                }
            } else {
                console.warn("[stripe-webhook] Missing client_reference_id (userId) in session.");
            }
        } else if (
            event.type === "customer.subscription.updated" ||
            event.type === "customer.subscription.deleted"
        ) {
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            console.log(`[stripe-webhook] 🔔 Subscription ${subscription.id} → ${subscription.status}`);

            const { error } = await supabase
                .from("user_subscriptions")
                .update({
                    status: subscription.status,
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    stripe_subscription_id: subscription.id,
                })
                .eq("stripe_customer_id", customerId);

            if (error) {
                console.error("[stripe-webhook] Supabase update failed:", error.message);
                return new Response("Database error", { status: 500 });
            }
        } else {
            console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("[stripe-webhook] Overall error:", err?.message, err);
        return new Response(`Webhook Handler Error: ${err?.message}`, { status: 500 });
    }
});
