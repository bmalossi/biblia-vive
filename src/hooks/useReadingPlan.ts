import { useState, useEffect, useCallback } from "react";
import readingPlansData from "../../public/bible/reading-plans.json";
import {
    savePlanProgressToCloud,
    loadPlanProgressFromCloud,
    mergePlanProgress,
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

const STORAGE_KEY = "bv_plan_progress";

function readLocal(): PlanProgress | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        const raw = JSON.parse(stored);
        // Backward-compat: legacy data may not have readRefs
        return { readRefs: [], ...raw };
    } catch {
        return null;
    }
}

function writeLocal(progress: PlanProgress | null) {
    if (progress) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export function useReadingPlan(userId: string | null = null) {
    const plans = readingPlansData as ReadingPlan[];
    const [progress, setProgress] = useState<PlanProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ── Initial load: merge local + cloud ──────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        async function init() {
            setIsLoading(true);
            const local = readLocal();
            const cloud = await loadPlanProgressFromCloud(userId);
            if (cancelled) return;
            const merged = mergePlanProgress(local, cloud);
            setProgress(merged);
            // Persist merged state back to both stores
            writeLocal(merged);
            if (userId && merged) {
                savePlanProgressToCloud(userId, merged).catch(console.warn);
            }
            setIsLoading(false);
        }
        init();
        return () => { cancelled = true; };
    }, [userId]);

    // ── Persist every progress change ──────────────────────────────────────
    useEffect(() => {
        if (isLoading) return; // skip the initial render
        writeLocal(progress);
        if (userId && progress) {
            savePlanProgressToCloud(userId, progress).catch(console.warn);
        }
    }, [progress, userId, isLoading]);

    // ── Derived state ──────────────────────────────────────────────────────
    const activePlan = plans.find((p) => p.id === progress?.planId) ?? null;

    const getTodayDayIndex = () => {
        if (!progress) return 1;
        const now = new Date();
        const start = new Date(progress.startDate);
        now.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        const diff = Math.abs(now.getTime() - start.getTime());
        return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
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

    // ── Actions ────────────────────────────────────────────────────────────
    const startPlan = useCallback((planId: string) => {
        setProgress({
            planId,
            startDate: Date.now(),
            completedDays: [],
            readRefs: [],
        });
    }, []);

    const abandonPlan = useCallback(() => {
        setProgress(null);
    }, []);

    /**
     * Marks a single ref (e.g. "sl/1") as read.
     * Auto-completes the day only when ALL refs for today have been read.
     */
    const markRefRead = useCallback((ref: string) => {
        setProgress((prev) => {
            if (!prev) return prev;

            // Prevent duplicate entries
            if (prev.readRefs.includes(ref)) return prev;

            const newReadRefs = [...prev.readRefs, ref];

            // Check if every ref for today is now read
            const plan = plans.find((p) => p.id === prev.planId);
            const day = plan?.days.find((d) => d.day === todayDayIndex);
            const allRead = day ? day.refs.every((r) => newReadRefs.includes(r)) : false;

            const newCompletedDays =
                allRead && !prev.completedDays.includes(todayDayIndex)
                    ? [...prev.completedDays, todayDayIndex]
                    : prev.completedDays;

            return {
                ...prev,
                readRefs: newReadRefs,
                completedDays: newCompletedDays,
            };
        });
    }, [plans, todayDayIndex]);

    /**
     * Advances the plan to the next day manually by shifting startDate back 1 day.
     * Only meaningful when the current day is already completed.
     */
    const advanceToNextDay = useCallback(() => {
        setProgress((prev) => {
            if (!prev) return prev;
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;
            return {
                ...prev,
                startDate: prev.startDate - ONE_DAY_MS,
            };
        });
    }, []);

    return {
        plans,
        activePlan,
        progress,
        isLoading,
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
