import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEditorialChapterLink, getEditorialChapterReferenceText } from '../types/editorialChapter';

describe('EditorialChapter helpers', () => {
    it('formats basic chapter link without verse anchor', () => {
        const link = getEditorialChapterLink({
            book_slug: 'sl',
            chapter: 1,
        });
        expect(link).toBe('/nvi/sl/1');
    });

    it('formats chapter link with verse anchor', () => {
        const link = getEditorialChapterLink({
            book_slug: 'jhn',
            chapter: 15,
            verse_start: 1,
        });
        expect(link).toBe('/nvi/jhn/15#v1');
    });

    it('formats reference text for full chapter', () => {
        const ref = getEditorialChapterReferenceText({
            book_name: 'Salmos',
            chapter: 1,
        });
        expect(ref).toBe('Salmos 1');
    });

    it('formats reference text for a range of verses', () => {
        const ref = getEditorialChapterReferenceText({
            book_name: 'João',
            chapter: 15,
            verse_start: 1,
            verse_end: 5,
        });
        expect(ref).toBe('João 15:1-5');
    });

    it('formats reference text for a single verse', () => {
        const ref = getEditorialChapterReferenceText({
            book_name: 'João',
            chapter: 3,
            verse_start: 16,
        });
        expect(ref).toBe('João 3:16');
    });
});
