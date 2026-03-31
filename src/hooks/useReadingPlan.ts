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
        return stored ? JSON.parse(stored) : null;
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
        });
    }, []);

    const abandonPlan = useCallback(() => {
        setProgress(null);
    }, []);

    const markTodayComplete = useCallback(() => {
        setProgress((prev) => {
            if (!prev || prev.completedDays.includes(todayDayIndex)) return prev;
            return { ...prev, completedDays: [...prev.completedDays, todayDayIndex] };
        });
    }, [todayDayIndex]);

    return {
        plans,
        activePlan,
        progress,
        isLoading,
        todayDayIndex,
        todayRefs,
        isTodayCompleted,
        streak,
        progressPct,
        startPlan,
        abandonPlan,
        markTodayComplete,
    };
}
