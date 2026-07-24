import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EditorialChapter } from '@/types/editorialChapter';

export interface SeriesGroup {
    seriesName: string;
    seriesOrder: number;
    chapters: EditorialChapter[];
}

export interface UseEditorialJornadasReturn {
    seriesGroups: SeriesGroup[];
    loading: boolean;
    error: Error | null;
}

export function useEditorialJornadas(): UseEditorialJornadasReturn {
    const [seriesGroups, setSeriesGroups] = useState<SeriesGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchJornadas() {
            try {
                setLoading(true);
                setError(null);

                const todayStr = new Date().toISOString().split('T')[0];

                const { data, error: fetchError } = await supabase
                    .from('editorial_chapters')
                    .select('*')
                    .eq('status', 'publicado')
                    .lte('publish_date', todayStr)
                    .order('series_order', { ascending: true })
                    .order('chapter_number', { ascending: true });

                if (fetchError) throw fetchError;

                if (data && isMounted) {
                    // Agrupar por série mantendo a ordenação de series_order
                    const groupsMap = new Map<string, { seriesOrder: number; chapters: EditorialChapter[] }>();

                    data.forEach((chapter) => {
                        const existing = groupsMap.get(chapter.series_name) || {
                            seriesOrder: chapter.series_order ?? 1,
                            chapters: [],
                        };
                        existing.chapters.push(chapter);
                        groupsMap.set(chapter.series_name, existing);
                    });

                    const groups: SeriesGroup[] = Array.from(groupsMap.entries())
                        .map(([seriesName, value]) => ({
                            seriesName,
                            seriesOrder: value.seriesOrder,
                            chapters: value.chapters.sort((a, b) => a.chapter_number - b.chapter_number),
                        }))
                        .sort((a, b) => a.seriesOrder - b.seriesOrder);

                    setSeriesGroups(groups);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error('[useEditorialJornadas] Erro ao carregar acervo de jornadas:', err);
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchJornadas();

        return () => {
            isMounted = false;
        };
    }, []);

    return { seriesGroups, loading, error };
}
