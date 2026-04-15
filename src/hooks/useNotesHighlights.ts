// ─────────────────────────────────────────────────────────────────────────────
// useNotesHighlights.ts — Bíblia Viva · Sprint 7
// Hook reativo para notas e destaques do capítulo atual
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
    getChapterHighlights,
    getChapterNotes,
    setHighlight as svcSetHighlight,
    removeHighlight as svcRemoveHighlight,
    saveNote as svcSaveNote,
    deleteNote as svcDeleteNote,
    type VerseHighlight,
    type VerseNote,
    type HighlightColor,
} from '@/lib/notesHighlights';

export type SaveNoteError = { message: string } | null;

export function useNotesHighlights(bookId: string, chapter: number) {
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const [highlights, setHighlights] = useState<VerseHighlight[]>([]);
    const [notes, setNotes] = useState<VerseNote[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data whenever chapter or auth state changes
    useEffect(() => {
        if (!bookId || !chapter) return;
        setLoading(true);
        Promise.all([
            getChapterHighlights(userId, bookId, chapter),
            getChapterNotes(userId, bookId, chapter),
        ]).then(([hl, nt]) => {
            setHighlights(hl);
            setNotes(nt);
        }).finally(() => setLoading(false));
    }, [userId, bookId, chapter]);

    const getHighlightForVerse = useCallback(
        (verse: number) => highlights.find(h => h.verse === verse)?.color ?? null,
        [highlights]
    );

    const getNoteForVerse = useCallback(
        (verse: number) => notes.find(n => n.verse === verse) ?? null,
        [notes]
    );

    const addHighlight = useCallback(
        async (verse: number, color: HighlightColor, meta?: { bookName?: string; version?: string; verseText?: string }) => {
            await svcSetHighlight(userId, bookId, chapter, verse, color, meta);
            setHighlights(prev => {
                const without = prev.filter(h => h.verse !== verse);
                return [...without, { verse, color }];
            });
        },
        [userId, bookId, chapter]
    );

    const removeHighlight = useCallback(
        async (verse: number) => {
            await svcRemoveHighlight(userId, bookId, chapter, verse);
            setHighlights(prev => prev.filter(h => h.verse !== verse));
        },
        [userId, bookId, chapter]
    );

    const saveNote = useCallback(
        async (note: Omit<VerseNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ error: string | null }> => {
            // Only apply the optimistic update when the saved note belongs to the
            // currently mounted chapter, preventing cross-chapter state pollution.
            const isCurrentChapter = note.bookId === bookId && note.chapter === chapter;
            const now = new Date().toISOString();
            const optimisticNote = {
                ...note,
                id: notes.find(n => n.verse === note.verse)?.id ?? (typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}`),
                createdAt: now,
                updatedAt: now,
            };

            if (isCurrentChapter) {
                setNotes(prev => {
                    const without = prev.filter(n => n.verse !== note.verse);
                    return [...without, optimisticNote];
                });
            }

            try {
                await svcSaveNote(userId, note);
                return { error: null };
            } catch (err: unknown) {
                // Revert optimistic update on failure
                if (isCurrentChapter) {
                    setNotes(prev => prev.filter(n => n.verse !== note.verse));
                }
                const message = err instanceof Error ? err.message : 'Erro ao salvar anotação.';
                return { error: message };
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userId, bookId, chapter, notes]
    );

    const deleteNote = useCallback(
        async (verse: number) => {
            await svcDeleteNote(userId, bookId, chapter, verse);
            setNotes(prev => prev.filter(n => n.verse !== verse));
        },
        [userId, bookId, chapter]
    );

    return {
        highlights,
        notes,
        loading,
        getHighlightForVerse,
        getNoteForVerse,
        addHighlight,
        removeHighlight,
        saveNote,
        deleteNote,
    };
}
