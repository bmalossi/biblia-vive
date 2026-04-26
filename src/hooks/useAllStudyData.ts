// ─────────────────────────────────────────────────────────────────────────────
// useAllStudyData.ts — Bíblia Viva · Sprint 14
// Hook para buscar todas as notas e destaques do usuário
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
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
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        let cancelled = false;

        // Safety net: stop the spinner after 12s even if queries are still pending.
        const safetyTimer = setTimeout(() => {
            if (!cancelled) setLoading(false);
        }, 12000);

        setLoading(true);
        setSessionExpired(false);

        async function load() {
            // ── Garantir sessão válida antes de disparar queries ──────────────
            // Se o userId existe no contexto mas o token JWT expirou, as queries
            // retornam data:null silenciosamente. Verificamos e renovamos antes.
            if (userId) {
                try {
                    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

                    if (sessionError || !sessionData.session) {
                        // Token expirado — tenta renovar via refresh_token
                        const { error: refreshError } = await supabase.auth.refreshSession();
                        if (refreshError) {
                            // Refresh também falhou: sessão totalmente inválida
                            if (!cancelled) {
                                setSessionExpired(true);
                                setLoading(false);
                            }
                            clearTimeout(safetyTimer);
                            return;
                        }
                    }
                } catch {
                    // Erro de rede ao verificar sessão — tenta as queries mesmo assim
                }
            }

            try {
                const [n, h] = await Promise.all([getAllNotes(userId), getAllHighlights(userId)]);
                if (cancelled) return;
                setNotes(n);
                setHighlights(h);
            } catch (err) {
                console.error('[useAllStudyData] Error loading study data:', (err as Error)?.message ?? err);
                // Mantém dados existentes em caso de erro transitório
            } finally {
                clearTimeout(safetyTimer);
                if (!cancelled) setLoading(false);
            }
        }

        void load();

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

    return { notes, highlights, loading, sessionExpired, stats, setNotes, setHighlights };
}
