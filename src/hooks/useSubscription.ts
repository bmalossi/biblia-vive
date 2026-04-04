import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface SubscriptionData {
    status:
    | "active"
    | "trialing"
    | "canceled"
    | "past_due"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired"
    | "none";
    current_period_end: string | null;
}

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        const fetchSubscription = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from("user_subscriptions")
                    .select("status, current_period_end")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (error || !data) {
                    setSubscription({ status: "none", current_period_end: null });
                } else {
                    setSubscription(data as SubscriptionData);
                }
            } catch (err) {
                setSubscription({ status: "none", current_period_end: null });
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();

        // Realtime subscription listen allows the UI to unlock immediately after successful Stripe payment webhook
        const channel = supabase
            .channel("public:user_subscriptions")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "user_subscriptions",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    setSubscription(payload.new as SubscriptionData);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const userRole = (user?.app_metadata as any)?.role;
    const isPro = userRole === "admin" || subscription?.status === "active" || subscription?.status === "trialing";

    // Helper to request a checkout session from Vercel Serverless
    const checkout = async () => {
        if (!user) throw new Error("User must be logged in to checkout.");

        const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, email: user.email }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Failed to create checkout session");
        }

        const data = await response.json();
        if (data.url) {
            window.location.href = data.url; // Redirect to Stripe
        }
    };

    return { subscription, isPro, loading, checkout };
}
