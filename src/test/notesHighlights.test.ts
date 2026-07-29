import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    setHighlight,
    getChapterHighlights,
    saveNote,
    getChapterNotes,
    removeHighlight,
    deleteNote,
    migrateLocalToSupabase,
    createNoteStore,
} from '../lib/notesHighlights';

const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockResolvedValue({ data: null, error: null }),
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

    describe('Memorial Entries (Sprint 26)', () => {
        it('should save prayer entry and filter by category in local storage', async () => {
            const store = createNoteStore(null);
            await store.save({
                type: 'prayer',
                title: 'Oração pela família',
                content: 'Senhor abençoe nossa casa',
                bookId: 'PSA',
                bookName: 'Salmos',
                chapter: 23,
                verse: null,
                version: 'acf',
                metadata: { motivo: 'Proteção', pedido: 'Paz' },
            });

            await store.save({
                type: 'testimony',
                title: 'Livramento na estrada',
                content: 'Deus guardou nossa viagem',
                bookId: 'PSA',
                bookName: 'Salmos',
                chapter: 23,
                verse: 1,
                version: 'acf',
            });

            const prayers = await store.getAll({ type: 'prayer' });
            expect(prayers).toHaveLength(1);
            expect(prayers[0].title).toBe('Oração pela família');
            expect(prayers[0].metadata?.motivo).toBe('Proteção');

            const testimonies = await store.getAll({ type: 'testimony' });
            expect(testimonies).toHaveLength(1);
            expect(testimonies[0].title).toBe('Livramento na estrada');
        });

        it('should toggle favorite and mark prayer as answered', async () => {
            const store = createNoteStore(null);
            await store.save({
                type: 'prayer',
                title: 'Oração por saúde',
                content: 'Cura para o irmão João',
                bookId: 'JHN',
                bookName: 'João',
                chapter: 11,
                version: 'nvi',
            });

            const all = await store.getAll();
            const id = all[0].id;

            const isFav = await store.toggleFavorite!(id);
            expect(isFav).toBe(true);

            await store.markAnswered!(id, 'Ele foi curado no hospital!');
            const updated = await store.getAll({ answeredOnly: true });
            expect(updated).toHaveLength(1);
            expect(updated[0].status).toBe('answered');
            expect(updated[0].answeredNote).toBe('Ele foi curado no hospital!');
        });
    });
});
