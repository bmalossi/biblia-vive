// ─────────────────────────────────────────────────────────────────────────────
// readingPlanSync.ts — Bíblia Viva · Sprint 15
// Cloud Sync para Planos de Leitura com rastreamento individual por capítulo
// (Suporte a múltiplos planos simultâneos + restore robusto após login)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';

// PlanProgress type is canonical in readingPlanTypes.ts (ADR-0006)
export type { PlanProgress } from './readingPlanTypes';
import type { PlanProgress } from './readingPlanTypes';

export const getStorageKey = (userId: string | null) => userId ? `bv_plan_progress_${userId}` : 'bv_plan_progress_anon';
export const getLastPlanKey = (userId: string | null) => userId ? `bv_last_active_plan_id_${userId}` : 'bv_last_active_plan_id_anon';

// ── save ─────────────────────────────────────────────────────────────────────

/**
 * Persists a specific plan progress to Supabase for authenticated users.
 * No-op for anonymous users (null userId).
 * Retries once on network failure to improve resilience.
 */
export async function savePlanProgressToCloud(
    userId: string | null,
    progress: PlanProgress
): Promise<void> {
    if (!userId) return;

    const payload = {
        user_id: userId,
        plan_id: progress.planId,
        start_date: progress.startDate,
        completed_days: progress.completedDays,
        read_refs: progress.readRefs ?? [],
        updated_at: new Date().toISOString(),
    };

    const upsertOnce = () =>
        supabase
            .from('user_plan_progress')
            .upsert(payload, { onConflict: 'user_id,plan_id' });

    try {
        const { error } = await upsertOnce();
        if (error) {
            // Retry once after a short delay
            await new Promise(r => setTimeout(r, 800));
            const { error: retryError } = await upsertOnce();
            if (retryError) {
                console.warn('[readingPlanSync] Retry failed:', retryError.message);
            }
        }
    } catch (err) {
        console.warn('[readingPlanSync] Failed to save to cloud:', err);
    }
}

/**
 * Deletes a plan progress from the cloud.
 */
export async function deletePlanProgressFromCloud(
    userId: string | null,
    planId: string
): Promise<void> {
    if (!userId) return;
    try {
        await supabase
            .from('user_plan_progress')
            .delete()
            .eq('user_id', userId)
            .eq('plan_id', planId);
    } catch (err) {
        console.warn('[readingPlanSync] Failed to delete from cloud:', err);
    }
}

// ── load ─────────────────────────────────────────────────────────────────────

/**
 * Loads ALL the user's active plan progresses from Supabase.
 * Returns an empty Record if no records exist or on error.
 * Now correctly reads read_refs from the database.
 */
export async function loadPlanProgressesFromCloud(
    userId: string | null
): Promise<Record<string, PlanProgress>> {
    if (!userId) return {};

    try {
        const { data, error } = await supabase
            .from('user_plan_progress')
            .select('plan_id, start_date, completed_days, read_refs')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.warn('[readingPlanSync] Failed to load from cloud:', error.message);
            return {};
        }
        if (!data || data.length === 0) return {};

        const result: Record<string, PlanProgress> = {};
        for (const row of data) {
            result[row.plan_id] = {
                planId: row.plan_id,
                startDate: row.start_date,
                completedDays: row.completed_days ?? [],
                readRefs: row.read_refs ?? [],
            };
        }
        return result;
    } catch {
        return {};
    }
}

// ── merge ─────────────────────────────────────────────────────────────────────

/**
 * Merges two specific plan progresses, combining days and refs from both sources.
 */
function mergeSinglePlan(local: PlanProgress, cloud: PlanProgress): PlanProgress {
    const mergedDays = Array.from(
        new Set([...local.completedDays, ...cloud.completedDays])
    ).sort((a, b) => a - b);

    const mergedRefs = Array.from(
        new Set([...(local.readRefs ?? []), ...(cloud.readRefs ?? [])])
    );

    return {
        planId: cloud.planId,
        // Take the earlier start date so longer streaks aren't lost
        startDate: Math.min(local.startDate, cloud.startDate),
        completedDays: mergedDays,
        readRefs: mergedRefs,
    };
}

/**
 * Merges dictionaries of plan progresses from Local Storage and Cloud Storage.
 * Cloud takes precedence for plans that exist in both, merged at the refs level.
 */
export function mergePlanProgresses(
    localObj: Record<string, PlanProgress>,
    cloudObj: Record<string, PlanProgress>
): Record<string, PlanProgress> {
    const result: Record<string, PlanProgress> = { ...cloudObj };

    // Merge local-only or diverged entries over cloud
    for (const [planId, localPlan] of Object.entries(localObj)) {
        if (!result[planId]) {
            result[planId] = localPlan;
        } else {
            result[planId] = mergeSinglePlan(localPlan, result[planId]);
        }
    }

    return result;
}

// ── migrate ─────────────────────────────────────────────────────────────────

/**
 * Called once on user SIGNED_IN event.
 * Uploads any existing localStorage plan(s) to Supabase then clears local.
 * The hook (useReadingPlan) will then load the merged state from the cloud.
 */
export async function migrateLocalPlanToSupabase(userId: string): Promise<void> {
    try {
        // Try legacy key first, then anon key
        let sourceKey = 'bv_plan_progress';
        let stored = localStorage.getItem(sourceKey);

        if (!stored) {
            sourceKey = 'bv_plan_progress_anon';
            stored = localStorage.getItem(sourceKey);
        }

        if (!stored) return;

        const raw = JSON.parse(stored);

        // Handle migration from legacy single-item progress vs new dictionary object
        if (raw.planId) {
            // It's the old single-plan format
            const local: PlanProgress = {
                planId: raw.planId,
                startDate: raw.startDate ?? Date.now(),
                completedDays: raw.completedDays ?? [],
                readRefs: raw.readRefs ?? [],
            };
            await savePlanProgressToCloud(userId, local);
        } else {
            // It's the new dictionary format Record<string, PlanProgress>
            const plans = Object.values(raw) as PlanProgress[];
            for (const plan of plans) {
                await savePlanProgressToCloud(userId, {
                    ...plan,
                    readRefs: plan.readRefs ?? [],
                });
            }
        }

        // Remove local copy — cloud is now the source of truth
        localStorage.removeItem(sourceKey);
        // Also remove legacy last plan key if it exists
        localStorage.removeItem('bv_last_active_plan_id');
        localStorage.removeItem('bv_last_active_plan_id_anon');
    } catch (err) {
        console.warn('[readingPlanSync] Migration failed:', err);
    }
}
