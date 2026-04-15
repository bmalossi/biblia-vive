// ─────────────────────────────────────────────────────────────────────────────
// useAllStudyData.ts — Bíblia Viva · Sprint 14
// Hook para buscar todas as notas e destaques do usuário
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getAllNotes, getAllHighlights, type VerseNote, type VerseHighlightFull } from '@/lib/notesHighlights';

export interface StudyStats {
    totalNotes: number;
    totalHighlights: number;
    booksCount: number;
}

export function useAllStudyData() {
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const [notes, setNotes] = useState<VerseNote[]>([]);
    const [highlights, setHighlights] = useState<VerseHighlightFull[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getAllNotes(userId),
            getAllHighlights(userId),
        ]).then(([n, h]) => {
            setNotes(n);
            setHighlights(h);
        }).finally(() => setLoading(false));
    }, [userId]);

    const stats: StudyStats = {
        totalNotes: notes.length,
        totalHighlights: highlights.length,
        booksCount: new Set([
            ...notes.map(n => n.bookId),
            ...highlights.map(h => h.bookId),
        ]).size,
    };

    return { notes, highlights, loading, stats, setNotes, setHighlights };
}
