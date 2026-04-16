import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const TIMEOUT_MS = 5000;
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), ms)
        ),
    ]);
}

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
    cancel_at_period_end?: boolean;
    plan_type: "pro" | "templo" | "none";
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
                const queryPromise = new Promise<{ data: SubscriptionData | null; error: unknown }>((resolve, reject) => {
                    supabase
                        .from("user_subscriptions")
                        .select("status, current_period_end, plan_type")
                        .eq("user_id", user.id)
                        .maybeSingle()
                        .then(resolve, reject);
                });

                const { data, error } = await withTimeout(queryPromise, TIMEOUT_MS);

                if (error || !data) {
                    if (error) console.error("[useSubscription] Error fetching subscription:", error);
                    setSubscription({ status: "none", current_period_end: null, plan_type: "none" });
                } else {
                    setSubscription(data as SubscriptionData);
                }
            } catch (err) {
                // Timeout or any other error — default to "none" so UI unblocks
                setSubscription({ status: "none", current_period_end: null, plan_type: "none" });
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
    const isAdmin = userRole === "admin";
    const isActive = subscription?.status === "active" || subscription?.status === "trialing";

    const isPro = isAdmin || (isActive && (subscription?.plan_type === "pro" || subscription?.plan_type === "templo"));
    const isTemplo = isAdmin || (isActive && subscription?.plan_type === "templo");

    // Helper to request a checkout session from Supabase Edge Function
    const checkout = async (planType: 'pro' | 'templo' = 'pro') => {
        if (!user) throw new Error("User must be logged in to checkout.");

        // Derive the Edge Function URL from the configured Supabase URL
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;

        const response = await fetch(edgeFunctionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ userId: user.id, email: user.email, planType }),
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

    // Helper to cancel subscription via Supabase Edge Function
    const cancelSubscription = async () => {
        if (!user) throw new Error("User must be logged in.");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`${supabaseUrl}/functions/v1/stripe-cancel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.access_token}`,
            },
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Failed to cancel subscription");
        }

        return response.json();
    };

    return { subscription, isPro, isTemplo, isAdmin, loading, checkout, cancelSubscription };
}
