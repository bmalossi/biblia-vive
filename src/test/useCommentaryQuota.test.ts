import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommentaryQuota, FREE_QUOTA } from '../hooks/useCommentaryQuota';

describe('useCommentaryQuota Hook', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('Initialization & Default State', () => {
        it('should initialize with full free quota when no keys are present', () => {
            const { result } = renderHook(() => useCommentaryQuota('verse'));
            expect(result.current.remaining).toBe(FREE_QUOTA);
            expect(result.current.canUse).toBe(true);
        });

        it('should initialize with full free quota for chapter when no keys are present', () => {
            const { result } = renderHook(() => useCommentaryQuota('chapter'));
            expect(result.current.remaining).toBe(FREE_QUOTA);
            expect(result.current.canUse).toBe(true);
        });
    });

    describe('Consumption & Decrement', () => {
        it('should decrease remaining count and update localStorage on consume', () => {
            const { result } = renderHook(() => useCommentaryQuota('verse'));
            
            act(() => {
                result.current.consume();
            });

            expect(result.current.remaining).toBe(2);
            expect(result.current.canUse).toBe(true);
            expect(localStorage.getItem('bv_commentary_quota_verse')).toBe('2');
        });

        it('should not go below 0 when consumed past quota', () => {
            const { result } = renderHook(() => useCommentaryQuota('verse'));
            
            act(() => {
                result.current.consume();
                result.current.consume();
                result.current.consume();
                result.current.consume(); // fourth time
            });

            expect(result.current.remaining).toBe(0);
            expect(result.current.canUse).toBe(false);
            expect(localStorage.getItem('bv_commentary_quota_verse')).toBe('0');
        });
    });

    describe('Legacy Key Migrations', () => {
        describe('Verse type', () => {
            it('should migrate from legacy count key and remove it', () => {
                // Mock legacy key: 1 used
                localStorage.setItem('bv_free_commentaries_used_count', '1');
                localStorage.setItem('bv_free_commentary_used', 'true');

                const { result } = renderHook(() => useCommentaryQuota('verse'));

                expect(result.current.remaining).toBe(2);
                expect(localStorage.getItem('bv_commentary_quota_verse')).toBe('2');
                expect(localStorage.getItem('bv_free_commentaries_used_count')).toBeNull();
                expect(localStorage.getItem('bv_free_commentary_used')).toBeNull();
            });

            it('should migrate from legacy bool key if count is missing', () => {
                localStorage.setItem('bv_free_commentary_used', 'true');

                const { result } = renderHook(() => useCommentaryQuota('verse'));

                expect(result.current.remaining).toBe(2);
                expect(localStorage.getItem('bv_commentary_quota_verse')).toBe('2');
                expect(localStorage.getItem('bv_free_commentary_used')).toBeNull();
            });
        });

        describe('Chapter type', () => {
            it('should migrate from legacy chapter count key and remove it', () => {
                // Mock legacy key: 2 used
                localStorage.setItem('bv_free_chapter_commentaries_used_count', '2');
                localStorage.setItem('bv_free_chapter_commentary_used', 'true');

                const { result } = renderHook(() => useCommentaryQuota('chapter'));

                expect(result.current.remaining).toBe(1);
                expect(localStorage.getItem('bv_commentary_quota_chapter')).toBe('1');
                expect(localStorage.getItem('bv_free_chapter_commentaries_used_count')).toBeNull();
                expect(localStorage.getItem('bv_free_chapter_commentary_used')).toBeNull();
            });

            it('should migrate from legacy chapter bool key if count is missing', () => {
                localStorage.setItem('bv_free_chapter_commentary_used', 'true');

                const { result } = renderHook(() => useCommentaryQuota('chapter'));

                expect(result.current.remaining).toBe(2);
                expect(localStorage.getItem('bv_commentary_quota_chapter')).toBe('2');
                expect(localStorage.getItem('bv_free_chapter_commentary_used')).toBeNull();
            });
        });
    });

    describe('setRemaining Direct Synchronization', () => {
        it('should update remaining value and localStorage to specified count', () => {
            const { result } = renderHook(() => useCommentaryQuota('verse'));

            act(() => {
                result.current.setRemaining(1);
            });

            expect(result.current.remaining).toBe(1);
            expect(result.current.canUse).toBe(true);
            expect(localStorage.getItem('bv_commentary_quota_verse')).toBe('1');
        });

        it('should handle setting quota to 0', () => {
            const { result } = renderHook(() => useCommentaryQuota('verse'));

            act(() => {
                result.current.setRemaining(0);
            });

            expect(result.current.remaining).toBe(0);
            expect(result.current.canUse).toBe(false);
            expect(localStorage.getItem('bv_commentary_quota_verse')).toBe('0');
        });

        it('should enforce bounds and not allow negative values', () => {
            const { result } = renderHook(() => useCommentaryQuota('verse'));

            act(() => {
                result.current.setRemaining(-5);
            });

            expect(result.current.remaining).toBe(0);
            expect(result.current.canUse).toBe(false);
            expect(localStorage.getItem('bv_commentary_quota_verse')).toBe('0');
        });
    });
});
