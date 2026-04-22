import { useState, useEffect, useCallback, useRef } from "react";
import readingPlansData from "@/data/bible/reading-plans.json";
import {
    savePlanProgressToCloud,
    loadPlanProgressesFromCloud,
    mergePlanProgresses,
    deletePlanProgressFromCloud,
    getStorageKey,
    getLastPlanKey,
    type PlanProgress,
} from "@/lib/readingPlanSync";



export interface ReadingPlanDay {
    day: number;
    refs: string[]; // e.g. ["sl/1", "sl/2", "sl/3"]
}

export interface ReadingPlan {
    id: string;
    name: string;
    description: string;
    totalDays: number;
    days: ReadingPlanDay[];
}

function readLocal(userId: string | null): Record<string, PlanProgress> {
    try {
        const stored = localStorage.getItem(getStorageKey(userId));
        if (!stored) return {};
        const raw = JSON.parse(stored);

        // Handle migration for returning users with old single-plan format
        if (raw.planId) {
            return {
                [raw.planId]: {
                    ...raw,
                    readRefs: raw.readRefs ?? [],
                },
            };
        }

        return raw;
    } catch {
        return {};
    }
}

function writeLocal(userId: string | null, progresses: Record<string, PlanProgress>) {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(progresses));
}

export function useReadingPlan(userId: string | null = null, activePlanId: string | null = null) {
    const plans = readingPlansData as ReadingPlan[];
    const [progresses, setProgresses] = useState<Record<string, PlanProgress>>({});
    const [isLoading, setIsLoading] = useState(true);
    // Track the previous userId to detect login events
    const prevUserIdRef = useRef<string | null | undefined>(undefined);

    // ── Initial load + re-load whenever userId changes (login/logout) ──────────
    useEffect(() => {
        let cancelled = false;
        const prevUserId = prevUserIdRef.current;
        prevUserIdRef.current = userId;

        async function init() {
            setIsLoading(true);

            // On logout: clear progresses and local cache
            if (prevUserId !== undefined && !userId && prevUserId) {
                setProgresses({});
                // Don't clear localStorage — we want to keep local progress for
                // anonymous use, but a fresh load from cloud on next login will merge
                setIsLoading(false);
                return;
            }

            const local = readLocal(userId);

            // Always try to load from cloud when authenticated.
            // If the network stalls, fallback to {} after 8 seconds so the UI unblocks.
            const cloudObj = userId
                ? await Promise.race([
                    loadPlanProgressesFromCloud(userId),
                    new Promise<Record<string, PlanProgress>>(resolve => setTimeout(() => resolve({}), 8000))
                ])
                : {};

            if (cancelled) return;

            const merged = mergePlanProgresses(local, cloudObj);
            setProgresses(merged);
            writeLocal(userId, merged);

            // Re-sync any local-only progress up to cloud (e.g. anonymous → logged-in)
            if (userId) {
                for (const plan of Object.values(merged)) {
                    savePlanProgressToCloud(userId, plan).catch(console.warn);
                }
            }

            setIsLoading(false);
        }

        init();
        return () => {
            cancelled = true;
        };
    }, [userId]); // Re-runs on every userId change — key to restoring after login

    // ── Persist lastActivePlanId when a specific plan is selected ─────────────
    useEffect(() => {
        if (activePlanId) {
            localStorage.setItem(getLastPlanKey(userId), activePlanId);
        }
    }, [activePlanId, userId]);

    // ── Derived active state ───────────────────────────────────────────────────
    const effectivePlanId = activePlanId ?? localStorage.getItem(getLastPlanKey(userId)) ?? null;
    const progress = effectivePlanId ? (progresses[effectivePlanId] ?? null) : null;
    const activePlan = effectivePlanId ? (plans.find((p) => p.id === effectivePlanId) ?? null) : null;

    const getTodayDayIndex = () => {
        if (!progress) return 1;
        const now = new Date();
        const start = new Date(progress.startDate);
        now.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        const diff = Math.abs(now.getTime() - start.getTime());
        const calendarDayIndex = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

        // Prevent auto-advancing past days that haven't been completed yet
        return Math.min(calendarDayIndex, progress.completedDays.length + 1);
    };

    const todayDayIndex = getTodayDayIndex();
    const todayRefs = activePlan?.days.find((d) => d.day === todayDayIndex)?.refs ?? [];

    // Which refs for today have been individually marked as read
    const readRefs = progress?.readRefs ?? [];
    const todayReadRefs = todayRefs.filter((r) => readRefs.includes(r));

    const isTodayCompleted = progress?.completedDays.includes(todayDayIndex) ?? false;
    const streak = progress?.completedDays.length ?? 0;
    const progressPct = activePlan
        ? Math.round(((progress?.completedDays.length ?? 0) / activePlan.totalDays) * 100)
        : 0;

    // ── Actions ────────────────────────────────────────────────────────────────
    const startPlan = useCallback(
        (planId: string) => {
            const newPlan: PlanProgress = {
                planId,
                startDate: Date.now(),
                completedDays: [],
                readRefs: [],
            };
            setProgresses((prev) => {
                const next = { ...prev, [planId]: newPlan };
                writeLocal(userId, next);
                if (userId) savePlanProgressToCloud(userId, newPlan).catch(console.warn);
                return next;
            });
            localStorage.setItem(getLastPlanKey(userId), planId);
        },
        [userId]
    );

    const abandonPlan = useCallback(
        (planId: string) => {
            setProgresses((prev) => {
                const next = { ...prev };
                delete next[planId];
                writeLocal(userId, next);
                if (userId) deletePlanProgressFromCloud(userId, planId).catch(console.warn);
                return next;
            });
            // Clear the last active plan if it was this one
            if (localStorage.getItem(getLastPlanKey(userId)) === planId) {
                localStorage.removeItem(getLastPlanKey(userId));
            }
        },
        [userId]
    );

    /**
     * Marks a single ref (e.g. "sl/1") as read on the effective active plan.
     */
    const markRefRead = useCallback(
        (ref: string) => {
            const targetId = effectivePlanId;
            if (!targetId) return;

            setProgresses((prevRecord) => {
                const prev = prevRecord[targetId];
                if (!prev) return prevRecord;

                // Prevent duplicate entries
                if (prev.readRefs.includes(ref)) return prevRecord;

                const newReadRefs = [...prev.readRefs, ref];

                // Check if every ref for today is now read → mark day as complete
                const plan = plans.find((p) => p.id === targetId);
                const day = plan?.days.find((d) => d.day === todayDayIndex);
                const allRead = day ? day.refs.every((r) => newReadRefs.includes(r)) : false;

                const newCompletedDays =
                    allRead && !prev.completedDays.includes(todayDayIndex)
                        ? [...prev.completedDays, todayDayIndex]
                        : prev.completedDays;

                const updatedPlan: PlanProgress = {
                    ...prev,
                    readRefs: newReadRefs,
                    completedDays: newCompletedDays,
                };

                const nextDict = {
                    ...prevRecord,
                    [targetId]: updatedPlan,
                };

                writeLocal(userId, nextDict);
                if (userId) savePlanProgressToCloud(userId, updatedPlan).catch(console.warn);

                return nextDict;
            });
        },
        [plans, todayDayIndex, effectivePlanId, userId]
    );

    /**
     * Advances the active plan to the next day manually by shifting startDate back 1 day.
     * This is useful when the user completes reading early and wants to skip to tomorrow's reading.
     */
    const advanceToNextDay = useCallback(() => {
        const targetId = effectivePlanId;
        if (!targetId) return;

        setProgresses((prevRecord) => {
            const prev = prevRecord[targetId];
            if (!prev) return prevRecord;

            const ONE_DAY_MS = 24 * 60 * 60 * 1000;
            const updatedPlan: PlanProgress = {
                ...prev,
                startDate: prev.startDate - ONE_DAY_MS,
            };

            const nextDict = {
                ...prevRecord,
                [targetId]: updatedPlan,
            };

            writeLocal(userId, nextDict);
            if (userId) savePlanProgressToCloud(userId, updatedPlan).catch(console.warn);

            return nextDict;
        });
    }, [effectivePlanId, userId]);

    return {
        plans,
        progresses,        // the raw map of all active plan progressions
        isLoading,

        // Active Plan scoped fields
        activePlan,
        progress,
        todayDayIndex,
        todayRefs,
        todayReadRefs,
        isTodayCompleted,
        streak,
        progressPct,

        startPlan,
        abandonPlan,
        markRefRead,
        advanceToNextDay,
    };
}
