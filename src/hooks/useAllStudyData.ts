// ─────────────────────────────────────────────────────────────────────────────
// useAllStudyData.ts — Bíblia Viva · Sprint 14
// Hook para buscar todas as notas e destaques do usuário
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getAllNotes, getAllHighlights, type VerseNote, type VerseHighlightFull } from '@/lib/notesHighlights';

const TIMEOUT_MS = 5000;
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), ms)
        ),
    ]);
}

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
        let cancelled = false;
        setLoading(true);

        withTimeout(
            Promise.all([getAllNotes(userId), getAllHighlights(userId)]),
            TIMEOUT_MS
        )
            .then(([n, h]) => {
                if (cancelled) return;
                setNotes(n);
                setHighlights(h);
            })
            .catch(() => {
                // Timeout or network error — keep empty arrays so UI unblocks
                if (cancelled) return;
                setNotes([]);
                setHighlights([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
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
