import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVerseCommentCache } from '../hooks/useVerseCommentCache';
import * as studyPanelModule from '../lib/studyPanel';

describe('useVerseCommentCache Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty set when bookId is undefined', () => {
    const { result } = renderHook(() => useVerseCommentCache(undefined, 1, 'pt'));
    expect(result.current.cachedVerseNumbers.size).toBe(0);
    expect(result.current.hasCacheForVerse(16)).toBe(false);
  });

  it('should fetch and populate cached verse numbers correctly', async () => {
    const mockSet = new Set([16, 21]);
    vi.spyOn(studyPanelModule, 'getChapterCachedVerseNumbers').mockResolvedValue(mockSet);

    const { result } = renderHook(() => useVerseCommentCache('JHN', 3, 'pt'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cachedVerseNumbers.has(16)).toBe(true);
    expect(result.current.cachedVerseNumbers.has(21)).toBe(true);
    expect(result.current.hasCacheForVerse(16)).toBe(true);
    expect(result.current.hasCacheForVerse('21')).toBe(true);
    expect(result.current.hasCacheForVerse(1)).toBe(false);
  });

  it('should handle errors gracefully and return empty set', async () => {
    vi.spyOn(studyPanelModule, 'getChapterCachedVerseNumbers').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVerseCommentCache('JHN', 3, 'pt'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cachedVerseNumbers.size).toBe(0);
    expect(result.current.hasCacheForVerse(16)).toBe(false);
  });
});
