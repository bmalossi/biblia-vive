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
    cancel_at_period_end?: boolean;
    plan_type: "pro" | "templo" | "none";
}

export function useSubscription() {
    const { user } = useAuth();

    // Cache key specific to user
    const getCacheKey = (uid: string) => `sub_cache_${uid}`;

    // Initialize from localStorage if available to prevent UI flicker on F5
    const [subscription, setSubscription] = useState<SubscriptionData | null>(() => {
        if (user?.id) {
            const cached = localStorage.getItem(`sub_cache_${user.id}`);
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    });
    // Initialize loading: false if we have cached data (background refresh), true if no cache (fresh load)
    const [loading, setLoading] = useState(() => {
        if (user?.id) {
            const cached = localStorage.getItem(`sub_cache_${user.id}`);
            if (cached) return false; // Cache exists: no blocking spinner needed
        }
        return true;
    });

    useEffect(() => {
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        // Try to load from cache immediately when user is found (prevents PRO flickering on F5)
        const cacheKey = getCacheKey(user.id);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                setSubscription(JSON.parse(cached));
                console.log("[useSubscription] Loaded from cache:", JSON.parse(cached));
            } catch (e) {
                console.error("[useSubscription] Failed to parse cache", e);
            }
        }

        const fetchSubscription = async () => {
            const hasCache = !!localStorage.getItem(cacheKey);
            if (!hasCache) setLoading(true);

            try {
                // Single attempt with a long timeout.
                // Without lockAcquireTimeout in the Supabase client, queries queue behind
                // any ongoing token refresh and complete naturally (typically in 5-20s).
                // Multiple short retries compound failures during the lock window, so one
                // long attempt is more reliable. The cache keeps the UI correct while waiting.
                const { data, error } = await Promise.race([
                    supabase
                        .from("user_subscriptions")
                        .select("status, current_period_end, plan_type")
                        .eq("user_id", user.id)
                        .maybeSingle(),
                    new Promise<{ data: any, error: any }>((_, reject) =>
                        setTimeout(() => reject(new Error("timeout")), 60000)
                    )
                ]);

                if (error) {
                    console.error("[useSubscription] DB error fetching subscription:", error);
                    // Keep cache intact on error
                } else if (!data) {
                    console.log("[useSubscription] No subscription row found.");
                    const noneState: SubscriptionData = { status: "none", current_period_end: null, plan_type: "none" };
                    setSubscription(noneState);
                    localStorage.setItem(cacheKey, JSON.stringify(noneState));
                } else {
                    console.log("[useSubscription] Fetched successfully:", data);
                    const subData = data as SubscriptionData;
                    setSubscription(subData);
                    localStorage.setItem(cacheKey, JSON.stringify(subData));
                }
            } catch (err: any) {
                // Timeout or network error — keep cache intact, don't overwrite PRO state
                console.warn("[useSubscription] Fetch failed, keeping cached state:", err.message);
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
                    const newData = payload.new as SubscriptionData;
                    console.log("[useSubscription] Realtime update:", newData);
                    setSubscription(newData);
                    localStorage.setItem(getCacheKey(user.id), JSON.stringify(newData));
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

    // Helper to manage subscription via Stripe Customer Portal (Supabase Edge Function)
    const manageSubscription = async () => {
        if (!user) throw new Error("User must be logged in.");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

        const response = await fetch(`${supabaseUrl}/functions/v1/stripe-portal`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Failed to open subscription portal");
        }

        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        }
    };

    return { subscription, isPro, isTemplo, isAdmin, loading, checkout, manageSubscription };
}
