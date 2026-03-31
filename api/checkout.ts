import Stripe from "stripe";

// Node.js runtime is used by default to avoid Edge bundling issues with Stripe/@vercel/og

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        // Obter variáveis de ambiente
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const priceId = process.env.STRIPE_PRICE_ID;

        if (!stripeSecretKey || !priceId) {
            return new Response(
                JSON.stringify({ error: "Missing Stripe Environment Variables" }),
                { status: 500 }
            );
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16" as any,
            httpClient: Stripe.createFetchHttpClient(), // Necessário para rodar no Edge
        });

        // Pegar userId do body
        const body = await req.json().catch(() => ({}));
        const userId = body.userId;
        const userEmail = body.email;

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "User ID is required" }),
                { status: 400 }
            );
        }

        // Criar a sessão de Checkout
        const url = new URL(req.url);
        const origin = `${url.protocol}//${url.host}`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId, // ID do Preço recorrente no Stripe (ex: price_12345)
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pro?canceled=true`,
            client_reference_id: userId, // Importante: Liga o checkout ao UUID do Supabase
            customer_email: userEmail || undefined,
            allow_promotion_codes: true,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (err: any) {
        console.error("Stripe Checkout Error:", err);
        return new Response(
            JSON.stringify({ error: err.message || "Internal Server Error" }),
            { status: 500 }
        );
    }
}
