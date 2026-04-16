// ─────────────────────────────────────────────────────────────────────────────
// readingPlanSync.test.ts — Bíblia Vive · Sprint 14
// Tests written BEFORE implementation (per TDD workflow)
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    savePlanProgressToCloud,
    loadPlanProgressesFromCloud,
    migrateLocalPlanToSupabase,
    mergePlanProgresses,
    deletePlanProgressFromCloud,
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
    readRefs: ['pv/1', 'pv/2', 'pv/3'],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Reading Plan Cloud Sync (Multi-Plan Support)', () => {
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
                    read_refs: ['pv/1', 'pv/2', 'pv/3'],
                }),
                { onConflict: 'user_id,plan_id' }
            );
        });

        it('should not call Supabase if userId is null', async () => {
            await savePlanProgressToCloud(null, sampleProgress);
            expect(supabase.from).not.toHaveBeenCalled();
        });
    });

    describe('deletePlanProgressFromCloud', () => {
        it('should delete plan entry', async () => {
            await deletePlanProgressFromCloud('user-123', 'test-plan');
            expect(supabase.from).toHaveBeenCalledWith('user_plan_progress');
            expect(mockChain.delete).toHaveBeenCalled();
            expect(mockChain.eq).toHaveBeenCalledWith('plan_id', 'test-plan');
        });
    });

    // ── loadPlanProgressesFromCloud ─────────────────────────────────────────────
    describe('loadPlanProgressesFromCloud', () => {
        it('should return empty record when no cloud data found', async () => {
            mockChain.eq.mockResolvedValueOnce({ data: null, error: null });
            const result = await loadPlanProgressesFromCloud('user-123');
            expect(result).toEqual({});
        });

        it('should map multiple Supabase rows to Record<string, PlanProgress> format', async () => {
            mockChain.eq.mockResolvedValueOnce({
                data: [
                    {
                        plan_id: 'bible-1-year',
                        start_date: 1700000000000,
                        completed_days: [1, 2, 3],
                        read_refs: ['pv/1', 'pv/2'],
                    },
                    {
                        plan_id: 'psalms-30',
                        start_date: 1800000000000,
                        completed_days: [1],
                        read_refs: ['sl/1'],
                    }
                ],
                error: null,
            });

            const result = await loadPlanProgressesFromCloud('user-123');

            expect(result).toEqual({
                'bible-1-year': {
                    planId: 'bible-1-year',
                    startDate: 1700000000000,
                    completedDays: [1, 2, 3],
                    readRefs: ['pv/1', 'pv/2'],
                },
                'psalms-30': {
                    planId: 'psalms-30',
                    startDate: 1800000000000,
                    completedDays: [1],
                    readRefs: ['sl/1'],
                }
            });
        });
    });

    // ── mergePlanProgresses ─────────────────────────────────────────────────────
    describe('mergePlanProgresses', () => {
        it('should return cloud data when local is empty', () => {
            const cloud = { 'nt-90': { planId: 'nt-90', startDate: 1000, completedDays: [1, 2], readRefs: [] } };
            expect(mergePlanProgresses({}, cloud)).toEqual(cloud);
        });

        it('should merge disparate plans without conflict', () => {
            const local = { 'psalms-30': { planId: 'psalms-30', startDate: 500, completedDays: [1], readRefs: [] } };
            const cloud = { 'nt-90': { planId: 'nt-90', startDate: 1000, completedDays: [1, 2], readRefs: [] } };

            const merged = mergePlanProgresses(local, cloud);

            expect(merged['nt-90']).toBeDefined();
            expect(merged['psalms-30']).toBeDefined();
        });

        it('should merge same plan completed days and refs from both', () => {
            const local = { 'bible-1-year': { planId: 'bible-1-year', startDate: 1000, completedDays: [1, 2, 5], readRefs: ['sl/1'] } };
            const cloud = { 'bible-1-year': { planId: 'bible-1-year', startDate: 2000, completedDays: [1, 3, 4], readRefs: ['sl/2'] } };

            const merged = mergePlanProgresses(local, cloud);
            const plan = merged['bible-1-year'];

            expect(plan.completedDays).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]));
            expect(plan.completedDays).toHaveLength(5);
            expect(plan.readRefs).toEqual(expect.arrayContaining(['sl/1', 'sl/2']));
            expect(plan.startDate).toBe(1000); // Takes earliest start date
        });
    });

    // ── migrateLocalPlanToSupabase ────────────────────────────────────────────
    describe('migrateLocalPlanToSupabase', () => {
        it('should upload legacy single plan progress to Supabase and clear local storage', async () => {
            // Legacy format was just the object at the root
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleProgress));

            await migrateLocalPlanToSupabase('user-123');

            expect(supabase.from).toHaveBeenCalledWith('user_plan_progress');
            expect(mockChain.upsert).toHaveBeenCalled();
            expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        });

        it('should upload new dictionary plan progress to Supabase and clear local storage', async () => {
            // New format is Record<string, PlanProgress>
            const dict = { 'bible-1-year': sampleProgress };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dict));

            await migrateLocalPlanToSupabase('user-123');

            expect(supabase.from).toHaveBeenCalledWith('user_plan_progress');
            expect(mockChain.upsert).toHaveBeenCalled(); // Loop triggers this
            expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        });
    });
});
