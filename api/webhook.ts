import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Node.js runtime is used by default for better compatibility with Stripe
// export const config = { runtime: "edge" };

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
            console.error("Missing critical environment variables for webhook.");
            return new Response("Server configuration error", { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16" as any,
            httpClient: Stripe.createFetchHttpClient(),
        });

        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            return new Response("Missing Stripe signature", { status: 400 });
        }

        // To verify the signature in Edge, we must read the body as raw text
        const rawBody = await req.text();

        // Use constructEventAsync for Edge Compatibility (Web Crypto API)
        let event: Stripe.Event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                rawBody,
                signature,
                webhookSecret
            );
        } catch (err: any) {
            console.error(`⚠️ Webhook signature verification failed:`, err.message);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Process webhook event
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;
            const userId = session.client_reference_id; // UUID injected during checkout

            if (userId && subscriptionId) {
                console.log(`✅ Checkout completed for user ${userId}. Activating Pro...`);

                // Fetch the subscription to get the period end date
                const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

                // Upsert subscription data directly ignoring user's RLS due to SERVICE_KEY
                const { error } = await supabase
                    .from("user_subscriptions")
                    .upsert(
                        {
                            user_id: userId,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            status: subscription.status, // "active", "trialing", etc.
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        },
                        { onConflict: "user_id" }
                    );

                if (error) {
                    console.error("Supabase upsert failed:", error.message);
                    return new Response("Database error", { status: 500 });
                }
            } else {
                console.warn("Session completed but missing client_reference_id (userId).");
            }
        } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            console.log(`🔔 Subscription ${subscription.id} status changed to ${subscription.status}`);

            // Find matching user by stripe_customer_id
            const { error } = await supabase
                .from("user_subscriptions")
                .update({
                    status: subscription.status,
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    stripe_subscription_id: subscription.id,
                })
                .eq("stripe_customer_id", customerId);

            if (error) {
                console.error("Supabase update failed:", error.message);
                return new Response("Database error", { status: 500 });
            }
        } else {
            // Unhandled event
            console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err: any) {
        console.error("Overall Webhook Error:", err);
        return new Response(`Webhook Handler Error: ${err.message}`, { status: 500 });
    }
}
