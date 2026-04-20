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

        // Read raw body BEFORE any parsing — required for signature verification
        const rawBody = await req.text();

        let event: Stripe.Event;
        try {
            event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
        } catch (err: any) {
            console.error("[stripe-webhook] Signature verification failed:", err.message);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // ── checkout.session.completed ────────────────────────────────────────
        // Triggered once when the user completes the Stripe Checkout flow.
        // Maps the Supabase user (client_reference_id) to the stripe customer/subscription.
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;
            const userId = session.client_reference_id; // Supabase UUID injected during checkout

            if (userId && subscriptionId) {
                console.log(`[stripe-webhook] ✅ Checkout completed for user ${userId}`);

                // Fetch full subscription to get period_end and status
                const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

                // Derive plan type from price metadata or fall back to 'pro'
                const priceId = subscription.items?.data?.[0]?.price?.id ?? "";
                const temploPrice = Deno.env.get("STRIPE_PRICE_ID_TEMPLO") ?? "";
                const planType = (temploPrice && priceId === temploPrice) ? "templo" : "pro";

                const { error } = await supabase
                    .from("user_subscriptions")
                    .upsert(
                        {
                            user_id: userId,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            status: subscription.status,
                            plan_type: planType,
                            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        },
                        { onConflict: "user_id" }
                    );

                if (error) {
                    console.error("[stripe-webhook] Supabase upsert failed:", error.message);
                    return new Response("Database error", { status: 500 });
                }
                console.log(`[stripe-webhook] ✅ User ${userId} activated as ${planType}`);
            } else {
                console.warn("[stripe-webhook] Missing client_reference_id (userId) in session.");
            }

            // ── customer.subscription.updated ─────────────────────────────────────
            // Triggered on any subscription change (renewal, plan change, cancel schedule).
        } else if (event.type === "customer.subscription.updated") {
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            console.log(`[stripe-webhook] 🔔 Subscription ${subscription.id} → ${subscription.status}`);

            const { error } = await supabase
                .from("user_subscriptions")
                .update({
                    status: subscription.status,
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    stripe_subscription_id: subscription.id,
                    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
                })
                .eq("stripe_customer_id", customerId);

            if (error) {
                console.error("[stripe-webhook] Supabase update failed:", error.message);
                return new Response("Database error", { status: 500 });
            }

            // ── customer.subscription.deleted ─────────────────────────────────────
            // Triggered when a subscription is fully cancelled (not just scheduled).
            // Downgrade user to free plan.
        } else if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            console.log(`[stripe-webhook] ❌ Subscription ${subscription.id} deleted — downgrading to free`);

            const { error } = await supabase
                .from("user_subscriptions")
                .update({
                    status: "canceled",
                    plan_type: "none",
                    cancel_at_period_end: false,
                    current_period_end: subscription.current_period_end
                        ? new Date(subscription.current_period_end * 1000).toISOString()
                        : null,
                })
                .eq("stripe_customer_id", customerId);

            if (error) {
                console.error("[stripe-webhook] Supabase update (delete) failed:", error.message);
                return new Response("Database error", { status: 500 });
            }

            // ── invoice.paid ──────────────────────────────────────────────────────
            // Triggered on every successful recurring payment. Keeps period_end fresh.
        } else if (event.type === "invoice.paid") {
            const invoice = event.data.object as any;
            const customerId = invoice.customer as string;
            const subscriptionId = invoice.subscription as string;

            if (subscriptionId) {
                console.log(`[stripe-webhook] 💳 Invoice paid for customer ${customerId}`);
                const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

                const { error } = await supabase
                    .from("user_subscriptions")
                    .update({
                        status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
                    })
                    .eq("stripe_customer_id", customerId);

                if (error) {
                    console.error("[stripe-webhook] Supabase update (invoice.paid) failed:", error.message);
                    return new Response("Database error", { status: 500 });
                }
            }

            // ── invoice.payment_failed ────────────────────────────────────────────
            // Triggered when a renewal payment fails. Mark as past_due.
        } else if (event.type === "invoice.payment_failed") {
            const invoice = event.data.object as any;
            const customerId = invoice.customer as string;

            console.log(`[stripe-webhook] ⚠️ Payment failed for customer ${customerId}`);

            const { error } = await supabase
                .from("user_subscriptions")
                .update({ status: "past_due" })
                .eq("stripe_customer_id", customerId);

            if (error) {
                console.error("[stripe-webhook] Supabase update (payment_failed) failed:", error.message);
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
