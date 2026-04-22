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
        let cancelled = false;

        // Safety net: stop the spinner after 12s even if queries are still pending.
        // Queries may still resolve later (when auth lock releases) and update the UI.
        const safetyTimer = setTimeout(() => {
            if (!cancelled) setLoading(false);
        }, 12000);

        setLoading(true);

        Promise.all([getAllNotes(userId), getAllHighlights(userId)])
            .then(([n, h]) => {
                if (cancelled) return;
                setNotes(n);
                setHighlights(h);
            })
            .catch((err) => {
                console.error("[useAllStudyData] Error loading study data:", err?.message ?? err);
                if (cancelled) return;
                // Keep existing data on error — don't wipe if we had something before
            })
            .finally(() => {
                clearTimeout(safetyTimer);
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
            clearTimeout(safetyTimer);
        };
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
