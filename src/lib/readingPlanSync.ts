// ─────────────────────────────────────────────────────────────────────────────
// readingPlanSync.ts — Bíblia Viva · Sprint 12
// Cloud Sync para Planos de Leitura com estratégia de Merge Automático
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';

const STORAGE_KEY = 'bv_plan_progress';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PlanProgress {
    planId: string;
    startDate: number;        // Unix timestamp in ms
    completedDays: number[];
}

// ── save ─────────────────────────────────────────────────────────────────────

/**
 * Persists the current plan progress to Supabase for authenticated users.
 * No-op for anonymous users (null userId).
 */
export async function savePlanProgressToCloud(
    userId: string | null,
    progress: PlanProgress
): Promise<void> {
    if (!userId) return;

    try {
        await supabase
            .from('user_plan_progress')
            .upsert(
                {
                    user_id: userId,
                    plan_id: progress.planId,
                    start_date: progress.startDate,
                    completed_days: progress.completedDays,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,plan_id' }
            );
    } catch (err) {
        console.warn('[readingPlanSync] Failed to save to cloud:', err);
    }
}

// ── load ─────────────────────────────────────────────────────────────────────

/**
 * Loads the user's active plan progress from Supabase.
 * Returns null if no record exists or on error.
 */
export async function loadPlanProgressFromCloud(
    userId: string | null
): Promise<PlanProgress | null> {
    if (!userId) return null;

    try {
        const { data, error } = await supabase
            .from('user_plan_progress')
            .select('plan_id, start_date, completed_days')
            .eq('user_id', userId)
            .single();

        if (error || !data) return null;

        return {
            planId: data.plan_id,
            startDate: data.start_date,
            completedDays: data.completed_days ?? [],
        };
    } catch {
        return null;
    }
}

// ── merge ─────────────────────────────────────────────────────────────────────

/**
 * Merge Automático (Opção A):
 * Combines local and cloud progress to produce the richest possible state.
 * - Uses earliest startDate to preserve streaks.
 * - Takes the union of all completedDays from both sources.
 * - If plans differ (e.g. user started a new plan on another device), cloud wins.
 */
export function mergePlanProgress(
    local: PlanProgress | null,
    cloud: PlanProgress | null
): PlanProgress | null {
    if (!local && !cloud) return null;
    if (!local) return cloud;
    if (!cloud) return local;

    // If plans differ, cloud is the source of truth (avoid overwriting intention)
    if (local.planId !== cloud.planId) return cloud;

    const mergedDays = Array.from(
        new Set([...local.completedDays, ...cloud.completedDays])
    ).sort((a, b) => a - b);

    return {
        planId: cloud.planId,
        startDate: Math.min(local.startDate, cloud.startDate),
        completedDays: mergedDays,
    };
}

// ── migrate ─────────────────────────────────────────────────────────────────

/**
 * Called once on user login.
 * Uploads any existing localStorage plan to Supabase, then clears local storage.
 * The hook (useReadingPlan) will then load the merged state from the cloud.
 */
export async function migrateLocalPlanToSupabase(userId: string): Promise<void> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const local: PlanProgress = JSON.parse(stored);
        await savePlanProgressToCloud(userId, local);
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.warn('[readingPlanSync] Migration failed:', err);
    }
}
