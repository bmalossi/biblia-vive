// ─────────────────────────────────────────────────────────────────────────────
// useEditorialChapter.ts — Bíblia Vive
//
// Hook responsável por buscar o Capítulo de Hoje publicado no Supabase.
// Regras de negócio:
//   1. Busca um registro com status = 'publicado' e publish_date <= HOJE (YYYY-MM-DD).
//   2. Ordena por publish_date DESC, created_at DESC (limite 1).
//   3. FALLBACK AUTOMÁTICO: Se não houver nenhum registro elegível para hoje,
//      busca o capítulo publicado mais recente (independente da data), garantindo
//      que o componente nunca seja exibido em branco.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EditorialChapter } from '@/types/editorialChapter';

export interface UseEditorialChapterReturn {
    chapter: EditorialChapter | null;
    loading: boolean;
    error: Error | null;
}

export function useEditorialChapter(): UseEditorialChapterReturn {
    const [chapter, setChapter] = useState<EditorialChapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchChapter() {
            try {
                setLoading(true);
                setError(null);

                const todayStr = new Date().toISOString().split('T')[0];

                // 1. Busca capítulo publicado com publish_date <= hoje
                const { data: primaryData, error: primaryError } = await supabase
                    .from('editorial_chapters')
                    .select('*')
                    .eq('status', 'publicado')
                    .lte('publish_date', todayStr)
                    .order('publish_date', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (primaryError) throw primaryError;

                if (primaryData && primaryData.length > 0) {
                    if (isMounted) setChapter(primaryData[0]);
                    return;
                }

                // 2. Fallback: Busca o último capítulo publicado mais recente
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('editorial_chapters')
                    .select('*')
                    .eq('status', 'publicado')
                    .order('publish_date', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (fallbackError) throw fallbackError;

                if (fallbackData && fallbackData.length > 0) {
                    if (isMounted) setChapter(fallbackData[0]);
                } else {
                    if (isMounted) setChapter(null);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error('[useEditorialChapter] Erro ao carregar capítulo de hoje:', err);
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchChapter();

        return () => {
            isMounted = false;
        };
    }, []);

    return { chapter, loading, error };
}
