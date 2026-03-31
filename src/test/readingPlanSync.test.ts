// ─────────────────────────────────────────────────────────────────────────────
// readingPlanSync.test.ts — Bíblia Vive · Sprint 12 · TDD RED → GREEN
// Tests written BEFORE implementation (per TDD workflow)
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    savePlanProgressToCloud,
    loadPlanProgressFromCloud,
    migrateLocalPlanToSupabase,
    mergePlanProgress,
} from '../lib/readingPlanSync';

// ── Mock Supabase ─────────────────────────────────────────────────────────────
const mockData = { data: null, error: null };
const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue(mockData),
    delete: vi.fn().mockReturnThis(),
};

vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => mockChain),
    },
}));

import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'bv_plan_progress';

const sampleProgress = {
    planId: 'bible-1-year',
    startDate: 1700000000000,
    completedDays: [1, 2, 3],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Reading Plan Cloud Sync', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    // ── savePlanProgressToCloud ────────────────────────────────────────────────
    describe('savePlanProgressToCloud', () => {
        it('should upsert plan progress to Supabase for authenticated user', async () => {
            await savePlanProgressToCloud('user-123', sampleProgress);

            expect(supabase.from).toHaveBeenCalledWith('user_plan_progress');
            expect(mockChain.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 'user-123',
                    plan_id: 'bible-1-year',
                    completed_days: [1, 2, 3],
                }),
                { onConflict: 'user_id,plan_id' }
            );
        });

        it('should not call Supabase if userId is null', async () => {
            await savePlanProgressToCloud(null, sampleProgress);
            expect(supabase.from).not.toHaveBeenCalled();
        });
    });

    // ── loadPlanProgressFromCloud ─────────────────────────────────────────────
    describe('loadPlanProgressFromCloud', () => {
        it('should return null when no cloud data found', async () => {
            mockChain.single.mockResolvedValueOnce({ data: null, error: null });
            const result = await loadPlanProgressFromCloud('user-123');
            expect(result).toBeNull();
        });

        it('should map Supabase row to PlanProgress format', async () => {
            mockChain.single.mockResolvedValueOnce({
                data: {
                    plan_id: 'bible-1-year',
                    start_date: 1700000000000,
                    completed_days: [1, 2, 3],
                },
                error: null,
            });

            const result = await loadPlanProgressFromCloud('user-123');

            expect(result).toEqual({
                planId: 'bible-1-year',
                startDate: 1700000000000,
                completedDays: [1, 2, 3],
            });
        });
    });

    // ── mergePlanProgress ─────────────────────────────────────────────────────
    describe('mergePlanProgress (Merge Automático - Opção A)', () => {
        it('should return cloud data when local is null', () => {
            const cloud = { planId: 'nt-90', startDate: 1000, completedDays: [1, 2] };
            expect(mergePlanProgress(null, cloud)).toEqual(cloud);
        });

        it('should return local data when cloud is null', () => {
            expect(mergePlanProgress(sampleProgress, null)).toEqual(sampleProgress);
        });

        it('should return null when both are null', () => {
            expect(mergePlanProgress(null, null)).toBeNull();
        });

        it('should keep cloud planId and merge completed days from both', () => {
            const local = { planId: 'bible-1-year', startDate: 1000, completedDays: [1, 2, 5] };
            const cloud = { planId: 'bible-1-year', startDate: 2000, completedDays: [1, 3, 4] };

            const merged = mergePlanProgress(local, cloud);

            expect(merged?.planId).toBe('bible-1-year');
            // Merged must contain all unique days from both
            expect(merged?.completedDays).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]));
            expect(merged?.completedDays).toHaveLength(5);
        });

        it('should use earliest startDate (to preserve streak)', () => {
            const local = { planId: 'bible-1-year', startDate: 500, completedDays: [] };
            const cloud = { planId: 'bible-1-year', startDate: 1000, completedDays: [] };
            const merged = mergePlanProgress(local, cloud);
            expect(merged?.startDate).toBe(500);
        });
    });

    // ── migrateLocalPlanToSupabase ────────────────────────────────────────────
    describe('migrateLocalPlanToSupabase', () => {
        it('should upload localStorage plan progress to Supabase and clear local storage', async () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProgress));

            await migrateLocalPlanToSupabase('user-123');

            expect(supabase.from).toHaveBeenCalledWith('user_plan_progress');
            expect(mockChain.upsert).toHaveBeenCalled();
            expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        });

        it('should do nothing if localStorage has no plan progress', async () => {
            await migrateLocalPlanToSupabase('user-123');
            expect(supabase.from).not.toHaveBeenCalled();
        });
    });
});
