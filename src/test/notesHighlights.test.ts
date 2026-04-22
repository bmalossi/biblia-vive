import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    setHighlight,
    getChapterHighlights,
    saveNote,
    getChapterNotes,
    removeHighlight,
    deleteNote,
    migrateLocalToSupabase,
} from '../lib/notesHighlights';

const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockReturnThis(),
};

// Mock do supabase client
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => mockChain)
    }
}));

import { supabase } from '../lib/supabase';

describe('Notes & Highlights Service (Dual-Mode)', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('Anonymous Mode (localStorage)', () => {
        it('should save and retrieve highlights in localStorage', async () => {
            await setHighlight(null, 'JOH', 3, 16, 'yellow');
            const hls = await getChapterHighlights(null, 'JOH', 3);
            expect(hls).toHaveLength(1);
            expect(hls[0]).toEqual({ verse: 16, color: 'yellow' });
        });

        it('should update existing highlight color in localStorage', async () => {
            await setHighlight(null, 'JOH', 3, 16, 'yellow');
            await setHighlight(null, 'JOH', 3, 16, 'blue');
            const hls = await getChapterHighlights(null, 'JOH', 3);
            expect(hls).toHaveLength(1);
            expect(hls[0].color).toBe('blue');
        });

        it('should remove highlight from localStorage', async () => {
            await setHighlight(null, 'JOH', 3, 16, 'yellow');
            await removeHighlight(null, 'JOH', 3, 16);
            const hls = await getChapterHighlights(null, 'JOH', 3);
            expect(hls).toHaveLength(0);
        });

        it('should save and retrieve notes in localStorage', async () => {
            await saveNote(null, {
                bookId: 'GEN',
                bookName: 'Gênesis',
                chapter: 1,
                verse: 1,
                content: 'No princípio',
                version: 'acf',
                verseText: '...',
            });
            const notes = await getChapterNotes(null, 'GEN', 1);
            expect(notes).toHaveLength(1);
            expect(notes[0].content).toBe('No princípio');
            expect(notes[0].id).toBeDefined();
        });

        it('should update existing note content in localStorage', async () => {
            await saveNote(null, {
                bookId: 'GEN',
                bookName: 'Gênesis',
                chapter: 1,
                verse: 1,
                content: 'Primeira nota',
                version: 'acf',
                verseText: '...',
            });
            await saveNote(null, {
                bookId: 'GEN',
                bookName: 'Gênesis',
                chapter: 1,
                verse: 1,
                content: 'Segunda nota',
                version: 'acf',
                verseText: '...',
            });
            const notes = await getChapterNotes(null, 'GEN', 1);
            expect(notes).toHaveLength(1);
            expect(notes[0].content).toBe('Segunda nota');
        });

        it('should remove note from localStorage', async () => {
            await saveNote(null, {
                bookId: 'GEN',
                bookName: 'Gênesis',
                chapter: 1,
                verse: 1,
                content: 'No princípio',
                version: 'acf',
                verseText: '...',
            });
            await deleteNote(null, 'GEN', 1, 1);
            const notes = await getChapterNotes(null, 'GEN', 1);
            expect(notes).toHaveLength(0);
        });

        it('should isolate notes from different chapters (cross-chapter isolation)', async () => {
            await saveNote(null, {
                bookId: 'GEN',
                bookName: 'Gênesis',
                chapter: 1,
                verse: 1,
                content: 'Nota do capítulo 1',
                version: 'acf',
                verseText: 'No princípio...',
            });
            await saveNote(null, {
                bookId: 'GEN',
                bookName: 'Gênesis',
                chapter: 2,
                verse: 1,
                content: 'Nota do capítulo 2',
                version: 'acf',
                verseText: 'Assim os céus...',
            });
            const ch1 = await getChapterNotes(null, 'GEN', 1);
            const ch2 = await getChapterNotes(null, 'GEN', 2);
            expect(ch1).toHaveLength(1);
            expect(ch1[0].content).toBe('Nota do capítulo 1');
            expect(ch2).toHaveLength(1);
            expect(ch2[0].content).toBe('Nota do capítulo 2');
        });
    });

    describe('Logged-in Mode (Supabase)', () => {
        const userId = '123-abc';

        it('should call supabase upsert when saving highlight', async () => {
            await setHighlight(userId, 'JOH', 3, 16, 'yellow');
            expect(supabase.from).toHaveBeenCalledWith('user_highlights');
            // Verify upsert was called with the right data via the mock chain
            expect(mockChain.upsert).toHaveBeenCalledWith(
                { user_id: userId, book_id: 'JOH', chapter: 3, verse: 16, color: 'yellow' },
                { onConflict: 'user_id,book_id,chapter,verse' }
            );
        });

        it('should call supabase upsert when saving note', async () => {
            await saveNote(userId, {
                bookId: 'GEN',
                bookName: 'Gênesis',
                chapter: 1,
                verse: 1,
                content: 'No princípio',
                version: 'acf',
                verseText: '...',
            });
            expect(supabase.from).toHaveBeenCalledWith('user_notes');
        });
    });

    describe('Migration', () => {
        it('should migrate highlights and notes from local to Supabase upon login', async () => {
            // 1. Create anonymous data
            await setHighlight(null, 'JOH', 3, 16, 'yellow');
            await saveNote(null, {
                bookId: 'GEN',
                bookName: 'Gênesis',
                chapter: 1,
                verse: 1,
                content: 'No princípio',
                version: 'acf',
                verseText: '...',
            });

            // 2. Call migrate
            const userId = '123-abc';
            await migrateLocalToSupabase(userId);

            // 3. Verify supabase upserts were called
            expect(supabase.from).toHaveBeenCalledTimes(2);

            // 4. Verify localStorage was cleared for these keys
            expect(localStorage.getItem('bv_highlights')).toBeNull();
            expect(localStorage.getItem('bv_notes')).toBeNull();
        });
    });
});
