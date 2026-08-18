import { useEffect, useState, useCallback } from 'react';
import { getChapterCachedVerseNumbers } from '@/lib/studyPanel';

export function useVerseCommentCache(
  bookId: string | undefined,
  chapterNumber: number | string,
  language: string = 'pt'
) {
  const [cachedVerseNumbers, setCachedVerseNumbers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCache = useCallback(async () => {
    if (!bookId) {
      setCachedVerseNumbers(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const versesSet = await getChapterCachedVerseNumbers(bookId, chapterNumber, language);
      setCachedVerseNumbers(versesSet);
    } catch (err) {
      console.warn('Failed to load verse commentary cache:', err);
      setCachedVerseNumbers(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [bookId, chapterNumber, language]);

  useEffect(() => {
    let isMounted = true;

    if (!bookId) {
      setCachedVerseNumbers(new Set());
      return;
    }

    setIsLoading(true);

    getChapterCachedVerseNumbers(bookId, chapterNumber, language)
      .then((versesSet) => {
        if (isMounted) {
          setCachedVerseNumbers(versesSet);
        }
      })
      .catch((err) => {
        console.warn('Failed to load verse commentary cache:', err);
        if (isMounted) {
          setCachedVerseNumbers(new Set());
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bookId, chapterNumber, language]);

  const hasCacheForVerse = useCallback(
    (verseNumber: number | string): boolean => {
      const num = typeof verseNumber === 'string' ? parseInt(verseNumber, 10) : verseNumber;
      return !isNaN(num) && cachedVerseNumbers.has(num);
    },
    [cachedVerseNumbers]
  );

  return {
    cachedVerseNumbers,
    hasCacheForVerse,
    isLoading,
    refetchCache: fetchCache,
  };
}
